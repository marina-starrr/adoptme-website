import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; 
import BackgroundPaws from '../components/BackgroundPaws';
import './Profile.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('favorites');
  const fileInputRef = useRef(null);
  
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [toastMsg, setToastMsg] = useState(''); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate(); 
  const { logout } = useAuth(); 

  const [userData, setUserData] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    avatarUrl: '/ava.jpg'
  });

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

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
            .eq('AdopterEmail', user.Email)
            .order('Id', { ascending: false });

          if (!appsError && appsData) {
            const { data: petsData } = await supabase.from('Pets').select('Id, Name, ImageName');

            const enrichedApps = appsData.map(app => {
              const matchedPet = petsData?.find(p => p.Name === app.PetName.split(',')[0].trim());
              return {
                ...app,
                PetId: matchedPet?.Id,
                PetImage: matchedPet 
                  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${matchedPet.ImageName}` 
                  : '/ava.jpg'
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

    fetchProfileAndApplications();

    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    const savedAvatar = localStorage.getItem('profileAvatar');
    if (savedAvatar) {
      setUserData(prev => ({ ...prev, avatarUrl: savedAvatar }));
    }
  }, []);

  useEffect(() => {
    if (location.state?.welcomeMsg) {
      showToast(location.state.welcomeMsg);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const currentNickname = localStorage.getItem('userNickname');

    try {
        const { error } = await supabase
            .from('Users')
            .update({
                FirstName: userData.firstName.trim(),
                LastName: userData.lastName.trim(),
                Phone: userData.phone.trim(),
                Email: userData.email.trim()
            })
            .eq('Nickname', currentNickname);

        if (error) throw error;
        showToast('✅ Зміни успішно збережено в базі даних! 🐾');

    } catch (err) {
        showToast('❌ Помилка збереження: ' + err.message);
    }
  };

  // 👇 НОВА ФУНКЦІЯ ВИХОДУ (ПЕРЕНЕСЕНА З ХЕДЕРА)
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
        
        setIsDeleteModalOpen(false); 

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

  return (
    <div className="profile-page page-transition" style={{ position: 'relative' }}>
      
      {toastMsg && (
          <div className="custom-toast">
              {toastMsg}
          </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
          <div className="modal-content fade-view" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🐾😢</div>
            <h3 style={{ color: '#4A148C', fontSize: '22px', marginBottom: '15px', fontWeight: 'bold' }}>Видалення акаунту</h3>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              Ви впевнені, що хочете назавжди покинути родину <strong>AdoptMe</strong>? Усі ваші обрані тваринки та історія заявок будуть втрачені.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                className="back-to-favorites-btn" 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '12px 25px', fontSize: '15px', borderRadius: '25px' }}
              >
                Скасувати
              </button>
              <button 
                className="adopt-pet-btn" 
                onClick={confirmDeleteAccount}
                style={{ padding: '12px 25px', fontSize: '15px', borderRadius: '25px', background: '#d32f2f', boxShadow: '0 5px 15px rgba(211, 47, 47, 0.3)' }}
              >
                Так, видалити
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-container">

        <aside className="profile-sidebar">
          <BackgroundPaws customClass="sidebar-paws" />

          <div className="profile-avatar-section" style={{ position: 'relative', zIndex: 2 }}>
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
                <img src={userData.avatarUrl} alt="Аватар" className="profile-avatar-large" />
                <div className="avatar-overlay"><span>Змінити</span></div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            
            <h2 className="profile-name">
                {userData.firstName ? `${userData.firstName} ${userData.lastName}` : 'Користувач'}
            </h2>
            <p className="profile-status">@{userData.nickname || 'nickname'}</p>
          </div>

          <nav className="profile-nav" style={{ position: 'relative', zIndex: 2 }}>
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
            
            {/* 👇 НОВА КНОПКА ВИХОДУ В ПРОФІЛІ */}
            <button className="profile-nav-btn logout-nav-btn" onClick={handleLogout}>
              🚪 Вийти з акаунту
            </button>
          </nav>
        </aside>

        <section className="profile-content-area">
          
          {/* ВКЛАДКА 1: УЛЮБЛЕНЦІ */}
          {activeTab === 'favorites' && (
            <div className="profile-tab-content fade-in">
              <h3>Мої улюбленці</h3>
              {favorites.length === 0 ? (
                <p className="empty-message">Список порожній. Перейдіть у каталог тварин, щоб додати друзів ❤️</p>
              ) : (
                <div className="profile-favorites-grid">
                  {favorites.map(pet => (
                    <div className="fav-profile-card" key={pet.id}>
                      <Link to={`/pets/${pet.id}`}>
                        <img src={pet.image} alt={pet.name} />
                      </Link>
                      <h4>{pet.name}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 2: МОЇ ЗАЯВКИ */}
          {activeTab === 'applications' && (
            <div className="profile-tab-content fade-in">
              <h3>Історія заявок у притулок</h3>
              {loadingApps ? <p>Завантаження заявок...</p> : (
                <div className="applications-list">
                  {applications.length === 0 ? <p>Ви ще не подавали заявок.</p> :
                    applications.map(app => (
                      <div className="application-card" key={app.Id}>
                        
                        <div className="app-card-left">
                          {app.PetId ? (
                            <Link to={`/pets/${app.PetId}`}>
                              <img src={app.PetImage} alt={app.PetName} className="app-pet-image" />
                            </Link>
                          ) : (
                            <img src={app.PetImage} alt="Тваринка" className="app-pet-image" />
                          )}
                          
                          <div className="app-details">
                            <h4>Тваринка: 
                              {app.PetId ? (
                                <Link to={`/pets/${app.PetId}`} className="app-pet-link"><span> {app.PetName}</span></Link>
                              ) : (
                                <span> {app.PetName}</span>
                              )}
                            </h4>
                            <p>Заявка №: {app.Id}</p>
                            <small>Умови: {app.LivingConditions}</small>
                          </div>
                        </div>

                        <div className={`app-status status-badge ${app.Status}`}>
                           {app.Status || 'Нова'}
                        </div>

                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 3: ОСОБИСТІ ДАНІ */}
          {activeTab === 'personal' && (
            <div className="profile-tab-content fade-in">
              <h3>Особисті дані</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                
                <div className="form-group">
                  <label>Ваш Нікнейм (Ідентифікатор)</label>
                  <input type="text" name="nickname" value={userData.nickname} readOnly style={{ background: '#f5f5f5', color: '#777' }} title="Нікнейм є унікальним і не змінюється" />
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

                <button type="submit" className="save-profile-btn">Зберегти зміни у базі даних</button>
              </form>

              {/* НЕБЕЗПЕЧНА ЗОНА */}
              <div style={{ marginTop: '40px', borderTop: '2px dashed #ffebee', paddingTop: '25px', textAlign: 'center' }}>
                  <p style={{ color: '#888', fontSize: '14px', marginBottom: '15px' }}>Небезпечна зона</p>
                  <button 
                    type="button" 
                    onClick={() => setIsDeleteModalOpen(true)}
                    style={{ 
                        background: 'transparent', 
                        color: '#d32f2f', 
                        border: '2px solid #d32f2f', 
                        padding: '12px 25px', 
                        borderRadius: '25px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#d32f2f'; e.target.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#d32f2f'; }}
                  >
                      🗑️ Видалити акаунт назавжди
                  </button>
              </div>

            </div>
          )}

        </section>

      </div>
    </div>
  );
}

export default Profile;