import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import BackgroundPaws from '../components/BackgroundPaws';
import './Profile.css';
import { useToast } from '../context/ToastContext';
import { createPortal } from 'react-dom';

function Profile() {
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);
  const [applications, setApplications] = useState([]); // Стан для реальних заявок
  const [loadingApps, setLoadingApps] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isAppModalClosing, setIsAppModalClosing] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [userData, setUserData] = useState({
    name: 'Марина Денісова', // Твоє повне ім'я згідно з профілем
    phone: '',
    email: '',
    avatarUrl: '/ava.jpg' 
  });

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchProfileAndApplications = async () => {
      const currentNickname = localStorage.getItem('userNickname');
      if (!currentNickname) return;

      try {
        const { data: user, error: userError } = await supabase
          .from('Users')
          .select('*')
          .eq('Nickname', currentNickname)
          .maybeSingle();

        if (userError) throw userError;

        if (user) {
          setUserData(prev => ({
            ...prev,
            nickname: user.Nickname,
            firstName: user.FirstName,
            lastName: user.LastName,
            phone: user.Phone,
            email: user.Email
          }));

          setLoadingApps(true);

          const { data: appsData, error: appsError } = await supabase
            .from('AdoptionRequests')
            .select('*')
            .eq('UserNickname', currentNickname)
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
                  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${matchedPet.ImageName}`
                  : '/ava.png'
              };
            });

            setApplications(enrichedApps);
          }
          setLoadingApps(false);
        }
      } catch (err) {
        console.error("Помилка завантаження профілю:", err.message);
      }
    };

    if (localStorage.getItem('userRole') !== 'admin') {
      fetchProfileAndApplications();
    }

    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    // Завантаження профілю
    const savedUser = JSON.parse(localStorage.getItem('profileData'));
    if (savedUser) {
      setUserData(savedUser);
    }
  }, []);

  // 1. Функція завантаження заявок з Supabase
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

      fetchMyApplications();
    }
  }, [activeTab, userData.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('profileData', JSON.stringify(userData));
    alert('Дані збережено локально!');
  };

  const handleLogout = () => {
    const userNickname = localStorage.getItem('userNickname');
    const currentFavorites = localStorage.getItem('favorites');

    if (userNickname && currentFavorites) {
      localStorage.setItem(`favorites_${userNickname}`, currentFavorites);
    }

    localStorage.removeItem('favorites');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('cartUpdated'));

    logout();
    navigate('/login', {
      state: { welcomeMsg: '🐾 Ви успішно вийшли з акаунту' }
    });
  };

  const handleRemoveFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const userNickname = localStorage.getItem('userNickname');

    if (userNickname) {
      const { error } = await supabase
        .from('Favorites')
        .delete()
        .eq('UserNickname', userNickname)
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
    const currentNickname = localStorage.getItem('userNickname');

    try {
      const { error } = await supabase
        .from('Users')
        .delete()
        .eq('Nickname', currentNickname);

      if (error) throw error;

      localStorage.removeItem('userNickname');
      localStorage.removeItem('userRole');
      localStorage.removeItem('favorites');
      localStorage.removeItem(`favorites_${currentNickname}`);
      localStorage.removeItem('profileAvatar');

      window.dispatchEvent(new Event('cartUpdated'));
      logout();

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
        setUserData(prevData => {
            const newData = { ...prevData, avatarUrl: base64String };
            localStorage.setItem('profileData', JSON.stringify(newData));
            return newData;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-page"> 
      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
                <img src={userData.avatarUrl} alt="Аватар" className="profile-avatar-large" />
                <div className="avatar-overlay"><span>Змінити</span></div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <h2 className="profile-name">{userData.name}</h2>
            <p className="profile-status">Власниця акаунту</p>
          </div>
          
          <nav className="profile-nav">
            <button className={`profile-nav-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
              Особисті дані
            </button>
            <button className={`profile-nav-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
              Мої заявки
              {applications.length > 0 && <span className="badge">{applications.length}</span>}
            </button>
            <button className={`profile-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              Улюбленці
              {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
            </button>
          </nav>
        </aside>

        <section className="profile-content-area">
          {activeTab === 'personal' && (
            <div className="profile-tab-content fade-in">
              <h3>Особисті дані</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Ім'я та Прізвище</label>
                  <input type="text" name="name" value={userData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Номер телефону</label>
                  <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Електронна пошта</label>
                  <input type="email" name="email" value={userData.email} onChange={handleInputChange} />
                </div>
                <button type="submit" className="save-profile-btn">Зберегти зміни</button>
              </form>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="profile-tab-content fade-in">
              <h3>Історія заявок у притулок</h3>
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
                        <div className="app-status status-yellow">На розгляді</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="profile-tab-content fade-in">
              <h3>Мої улюбленці</h3>
              {favorites.length === 0 ? (
                <p className="empty-message">Список порожній.</p>
              ) : (
                <div className="profile-favorites-grid">
                  {favorites.map(pet => (
                    <div className="fav-profile-card" key={pet.id}>
                      <img src={pet.image} alt={pet.name} />
                      <h4>{pet.name}</h4>
                    </div>
                  ))}
                </div>
              )}
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