import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { petImageUrl } from '../utils/petImage';
import { useAuth } from '../context/AuthContext';
import BackgroundPaws from '../components/BackgroundPaws';
import './Profile.css';
import { useToast } from '../context/ToastContext'; 
import { createPortal } from 'react-dom';

function Profile() {
  const [activeTab, setActiveTab] = useState('favorites');
  const [appFilter, setAppFilter] = useState('Всі');
  const fileInputRef = useRef(null);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [favorites, setFavorites] = useState([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false); 
  const [selectedApp, setSelectedApp] = useState(null);
  const [isAppModalClosing, setIsAppModalClosing] = useState(false); 

  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userId, role, profile, userEmail } = useAuth();
  const { showToast } = useToast();

  const [userData, setUserData] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    avatarUrl: '/ava.png'
  });

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/adoptions', { replace: true });
    }
  }, [role, navigate]);

  // Обране (localStorage) + збережений аватар — не залежить від сесії
  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    const savedAvatar = localStorage.getItem('profileAvatar');
    if (savedAvatar) {
      setUserData(prev => ({ ...prev, avatarUrl: savedAvatar }));
    }
  }, []);

  // Особисті дані з контексту + заявки користувача
  useEffect(() => {
    if (!userId || role === 'admin') return;

    if (profile) {
      setUserData(prev => ({
        ...prev,
        nickname: profile.nickname || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        email: userEmail || ''
      }));
    }

    const fetchApplications = async () => {
      setLoadingApps(true);
      const { data: appsData, error: appsError } = await supabase
        .from('AdoptionRequests')
        .select('*')
        .eq('user_id', userId)
        .order('Id', { ascending: false });

      if (!appsError && appsData) {
        const { data: petsData } = await supabase.from('Pets').select('Id, Name, ImageName');

        const enrichedApps = appsData.map(app => {
          let searchName = app.PetName;
          if (app.PetName.includes('Волонтерство')) {
            const match = app.PetName.match(/\((.*?)\)/);
            if (match) searchName = match[1];
          } else {
            searchName = app.PetName.split(',')[0].trim();
          }

          const matchedPet = petsData?.find(p => p.Name === searchName);
          return {
            ...app,
            PetId: matchedPet?.Id,
            PetImage: matchedPet
              ? petImageUrl(matchedPet.ImageName)
              : '/ava.png'
          };
        });

        setApplications(enrichedApps);
      }
      setLoadingApps(false);
    };

    fetchApplications();
  }, [userId, role, profile, userEmail]);

  useEffect(() => {
    if (location.state?.welcomeMsg) {
      showToast(location.state.welcomeMsg);
    }
    
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    if (applications.length > 0 && location.state?.highlightAppId) {
      const targetApp = applications.find(app => app.Id === location.state.highlightAppId);
      
      if (targetApp) {
        setSelectedApp(targetApp);
        setAppFilter('Всі');
      }
    }

    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location, applications, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.firstName.trim(),
          last_name: userData.lastName.trim(),
          phone: userData.phone.trim()
        })
        .eq('id', userId);

      if (error) throw error;

      // Email керується Supabase Auth: зміна вимагає підтвердження за листом
      const newEmail = userData.email.trim();
      if (newEmail && newEmail !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        showToast('✅ Дані збережено. Підтвердьте нову пошту за посиланням із листа 🐾');
      } else {
        showToast('✅ Зміни успішно збережено! 🐾');
      }

    } catch (err) {
      showToast('❌ Помилка збереження: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logout(); // signOut + очищення localStorage + подія cartUpdated
    navigate('/login', {
      state: { welcomeMsg: '🐾 Ви успішно вийшли з акаунту' }
    });
  };

  // 👇 Логіка видалення тваринки з обраного
  const handleRemoveFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (userId) {
      const { error } = await supabase
        .from('Favorites')
        .delete()
        .eq('user_id', userId)
        .eq('PetId', id);

      if (error) {
        showToast("❌ Помилка видалення: " + error.message);
      }
    }

    const newFavs = favorites.filter(pet => pet.id !== id);
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const closeDeleteModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setIsModalClosing(false);
    }, 300);
  };

  const closeAppModal = () => {
    setIsAppModalClosing(true);
    setTimeout(() => {
      setSelectedApp(null);
      setIsAppModalClosing(false);
    }, 300);
  };

  const confirmDeleteAccount = async () => {
    try {
      // RPC видаляє власний рядок у auth.users; профіль і повʼязані дані — каскадом
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;

      localStorage.removeItem('profileAvatar');
      await logout();

      closeDeleteModal();

      navigate('/', {
        state: { welcomeMsg: '😢 Ваш акаунт видалено. Нам дуже шкода, повертайтесь знову!' }
      });

    } catch (err) {
      showToast('❌ Помилка при видаленні: ' + err.message);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setUserData(prevData => ({ ...prevData, avatarUrl: base64String }));
        localStorage.setItem('profileAvatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const filterTabs = ['Всі', 'Нова', 'Розглядається', 'Схвалено', 'Передано', 'Відхилено'];
  const filteredApps = applications.filter(app => {
    if (appFilter === 'Всі') return true;
    return (app.Status || 'Нова') === appFilter;
  });

  const parseAppInfo = (app) => {
    const isVolunteer = app.PetName.includes('Волонтерство');
    const appType = isVolunteer ? 'Волонтерство' : 'Прихисток';
    let petName = 'будь-який хвостик';

    if (isVolunteer) {
      const match = app.PetName.match(/\((.*?)\)/);
      if (match) petName = match[1];
    } else {
      petName = app.PetName;
    }

    return { isVolunteer, appType, petName };
  };

  return (
    <div className="profile-page" style={{ position: 'relative' }}>

      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-banner">
            <BackgroundPaws customClass="sidebar-paws" />
          </div>

          <div className="profile-avatar-section">
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
              <img src={userData.avatarUrl} alt="Аватар" className="profile-avatar-large" />
              <div className="avatar-overlay">
                <span className="camera-icon">📷</span>
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

            <h2 className="profile-name">
              {userData.firstName ? `${userData.firstName} ${userData.lastName}` : 'Користувач'}
            </h2>
            <p className="profile-status">@{userData.nickname || 'nickname'}</p>
          </div>

          <nav className="profile-nav">
            <button className={`profile-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              🐾 Улюбленці
              {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
            </button>
            <button className={`profile-nav-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
              📝 Мої заявки
              {applications.length > 0 && <span className="badge">{applications.length}</span>}
            </button>
            <button className={`profile-nav-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
              👤 Особисті дані
            </button>

            <div className="nav-divider"></div>

            <button className="profile-nav-btn logout-nav-btn" onClick={handleLogout}>
              🚪 Вийти з акаунту
            </button>
          </nav>
        </aside>

        <section className="profile-content-area">
          {activeTab === 'favorites' && (
            <div className="profile-tab-content fade-in">
              <h3>Мої улюбленці</h3>
              {favorites.length === 0 ? (
                <p className="empty-message">Список порожній. Перейдіть у каталог <Link to="/pets" className="empty-link-purple">тварин</Link>, щоб додати друзів ❤️</p>
              ) : (
                <>
                  <div className="profile-favorites-grid">
                    {favorites.map(pet => (
                      <div className="fav-profile-card" key={pet.id}>
                        <button
                          className="remove-favorite-icon"
                          onClick={(e) => handleRemoveFavorite(e, pet.id)}
                          title="Прибрати з обраного"
                        >
                          &times;
                        </button>
                        <Link to={`/pets/${pet.id}`}>
                          <img src={pet.image} alt={pet.name} />
                        </Link>
                        <h4>{pet.name}</h4>
                      </div>
                    ))}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <p className="success-favorites-text">
                      Чудовий вибір! Скоріше натискай кнопку нижче <br /> і заповнюй анкету на прихисток 💜
                    </p>
                    <button className="adopt-pet-btn" onClick={() => window.dispatchEvent(new Event('openFavorites'))}>
                      Прихистити
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="profile-tab-content fade-in">
              <h3>Історія заявок у притулок</h3>

              <div className="app-filters-container">
                {filterTabs.map(tab => (
                  <button
                    key={tab}
                    className={`app-filter-btn ${appFilter === tab ? 'active' : ''}`}
                    onClick={() => setAppFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {loadingApps ? <p>Завантаження заявок...</p> : (
                <div className="applications-list">
                  {filteredApps.length === 0 ? <p className="empty-message">Заявок з таким статусом не знайдено.</p> :
                    filteredApps.map(app => {
                      const { isVolunteer, appType, petName } = parseAppInfo(app);
                      
                      return (
                        <div 
                          className="application-card clickable-card" 
                          key={app.Id} 
                          id={`app-card-${app.Id}`}
                          onClick={() => setSelectedApp(app)}
                        >
                          <div className="app-card-left">
                            {app.PetId ? (
                              <Link to={`/pets/${app.PetId}`} onClick={(e) => e.stopPropagation()}>
                                <img src={app.PetImage} alt={petName} className="app-pet-image" />
                              </Link>
                            ) : (
                              <img src={app.PetImage} alt="Тваринка" className="app-pet-image" />
                            )}

                            <div className="app-details">
                              <h4 className="app-type-label">{appType}</h4>
                              <p className="app-pet-name">Тваринка: 
                                {app.PetId && petName !== 'будь-який хвостик' ? (
                                  <Link to={`/pets/${app.PetId}`} className="app-pet-link" onClick={(e) => e.stopPropagation()}><span> {petName}</span></Link>
                                ) : (
                                  <span> {petName}</span>
                                )}
                              </p>
                              <p className="app-number">Заявка №: {app.Id}</p>
                              <small className="app-short-desc">
                                {isVolunteer ? app.Reason.split('.')[0] : `Умови: ${app.LivingConditions}`}
                              </small>
                            </div>
                          </div>

                          <div className={`app-status status-badge ${app.Status || 'Нова'}`}>
                            {app.Status || 'Нова'}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="profile-tab-content fade-in">
              <h3>Особисті дані</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>

                <div className="form-group">
                  <label>Ваш Нікнейм (Ідентифікатор)</label>
                  <input type="text" name="nickname" value={userData.nickname} readOnly className="input-readonly" title="Нікнейм є унікальним і не змінюється" />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Ім'я</label>
                    <input type="text" name="firstName" value={userData.firstName} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Прізвище</label>
                    <input type="text" name="lastName" value={userData.lastName} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Номер телефону</label>
                  <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                  <label>Електронна пошта (Email)</label>
                  <input type="email" name="email" value={userData.email} onChange={handleInputChange} required />
                </div>

                <button type="submit" className="save-profile-btn">Зберегти зміни</button>
              </form>

              <div className="danger-zone">
                <p>Небезпечна зона</p>
                <button
                  type="button"
                  className="delete-account-btn"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  🗑️ Видалити акаунт назавжди
                </button>
              </div>

            </div>
          )}
        </section>
      </div>

      {isDeleteModalOpen && createPortal(
        <div 
          className={`profile-modal-overlay ${isModalClosing ? 'closing' : ''}`} 
          onClick={closeDeleteModal}
        >
          <div 
            className={`modal-content fade-view ${isModalClosing ? 'closing' : ''}`} 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}
          >
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🐾😢</div>
            <h3 style={{ color: '#4A148C', fontSize: '22px', marginBottom: '15px', fontWeight: 'bold' }}>Видалення акаунту</h3>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              Ви впевнені, що хочете назавжди покинути родину <strong>AdoptMe</strong>? Усі ваші обрані тваринки та історія заявок будуть втрачені.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="back-to-favorites-btn" onClick={closeDeleteModal} style={{ padding: '12px 25px', fontSize: '15px', borderRadius: '25px' }}>
                Скасувати
              </button>
              <button className="adopt-pet-btn" onClick={confirmDeleteAccount} style={{ padding: '12px 25px', fontSize: '15px', borderRadius: '25px', background: '#d32f2f', boxShadow: '0 5px 15px rgba(211, 47, 47, 0.3)' }}>
                Так, видалити
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedApp && createPortal(
        <div 
          className={`profile-modal-overlay ${isAppModalClosing ? 'closing' : ''}`} 
          onClick={closeAppModal}
        >
          <div 
            className={`modal-content fade-view app-details-modal ${isAppModalClosing ? 'closing' : ''}`} 
            onClick={e => e.stopPropagation()}
          >
            <span className="profile-close-btn" onClick={closeAppModal}>&times;</span>
            
            {(() => {
              const { isVolunteer, appType, petName } = parseAppInfo(selectedApp);
              return (
                <>
                  <h3 className="modal-title">Деталі заявки №{selectedApp.Id}</h3>
                  <div className="app-details-grid">
                    <div className="detail-row">
                      <strong>Тип заявки:</strong> 
                      <span className="highlight-text">{appType}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Ім'я заявника:</strong> 
                      <span>{selectedApp.AdopterName}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Телефон:</strong> 
                      <span>{selectedApp.AdopterPhone}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Тваринка:</strong> 
                      <span>
                        {selectedApp.PetId ? (
                           <Link to={`/pets/${selectedApp.PetId}`} onClick={closeAppModal} className="app-pet-link">
                             {petName}
                           </Link>
                        ) : petName}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Статус:</strong> 
                      <span className={`status-badge ${selectedApp.Status || 'Нова'}`} style={{ display: 'inline-block', padding: '4px 12px', fontSize: '13px' }}>
                        {selectedApp.Status || 'Нова'}
                      </span>
                    </div>

                    {isVolunteer ? (
                      <div className="detail-row full-width">
                        <strong>Деталі допомоги:</strong>
                        <div className="detail-box">{selectedApp.Reason}</div>
                      </div>
                    ) : (
                      <>
                        <div className="detail-row">
                          <strong>Досвід утримання:</strong> 
                          <span>{selectedApp.HasExperience ? 'Так' : 'Ні'}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Інші тварини вдома:</strong> 
                          <span>{selectedApp.HasOtherPets ? 'Так' : 'Ні'}</span>
                        </div>
                        <div className="detail-row full-width">
                          <strong>Умови проживання:</strong>
                          <div className="detail-box">{selectedApp.LivingConditions}</div>
                        </div>
                        {selectedApp.Reason && selectedApp.Reason !== 'будь-який хвостик' && (
                          <div className="detail-row full-width">
                            <strong>Коментар / Чому хочете прихистити:</strong>
                            <div className="detail-box">{selectedApp.Reason}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button className="save-profile-btn" style={{ width: '100%', marginTop: '20px' }} onClick={closeAppModal}>Закрити</button>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Profile;