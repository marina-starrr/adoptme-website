import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BackgroundPaws from '../components/BackgroundPaws';
import './Profile.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);
  
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Одразу беремо email з пам'яті
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: localStorage.getItem('userEmail') || '', 
    avatarUrl: '/ava.jpg'
  });

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    const savedUser = JSON.parse(localStorage.getItem('profileData'));
    if (savedUser) {
      setUserData(savedUser);
    }
  }, []);

  // 👇 ЗАВАНТАЖЕННЯ ЗАЯВОК ПО EMAIL
  // 👇 1. ОНОВЛЕНИЙ ЗАПИТ: Шукаємо заявку + підтягуємо фото тваринки
  // 👇 ОНОВЛЕНИЙ ЗАПИТ: Завантажуємо одразу при відкритті сторінки профілю!
  useEffect(() => {
    const fetchMyApplications = async () => {
      setLoadingApps(true);
      const currentUserEmail = localStorage.getItem('userEmail');

      // Отримуємо заявки
      const { data: appsData, error: appsError } = await supabase
        .from('AdoptionRequests')
        .select('*')
        .eq('AdopterEmail', currentUserEmail)
        .order('Id', { ascending: false });

      if (!appsError && appsData) {
        // Отримуємо всіх тваринок, щоб взяти їхні фотографії та ID
        const { data: petsData } = await supabase.from('Pets').select('Id, Name, ImageName');

        // З'єднуємо заявку з фотографією тваринки
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
    };

    // Викликаємо функцію БЕЗ ПЕРЕВІРКИ activeTab
    fetchMyApplications();
  }, []); // 👈 ТУТ ТЕПЕР ПОРОЖНІ ДУЖКИ! Це означає "запустити 1 раз при старті"

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('profileData', JSON.stringify(userData));
    alert('Дані збережено локально!');
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
    <div className="profile-page page-transition">
      <div className="profile-container">

        <aside className="profile-sidebar">
          <BackgroundPaws customClass="sidebar-paws" />

          <div className="profile-avatar-section" style={{ position: 'relative', zIndex: 2 }}>
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
                <img src={userData.avatarUrl} alt="Аватар" className="profile-avatar-large" />
                <div className="avatar-overlay"><span>Змінити</span></div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <h2 className="profile-name">{userData.name || 'Користувач'}</h2>
            <p className="profile-status">Власник акаунту</p>
          </div>

          <nav className="profile-nav" style={{ position: 'relative', zIndex: 2 }}>
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
                  <input type="email" name="email" value={userData.email} onChange={handleInputChange} readOnly title="Пошта прив'язана до акаунту" />
                </div>
                <button type="submit" className="save-profile-btn">Зберегти зміни</button>
              </form>
            </div>
          )}

          {/* 👇 2. ОНОВЛЕНИЙ HTML: Виводимо фотографію і посилання */}
          {activeTab === 'applications' && (
            <div className="profile-tab-content fade-in">
              <h3>Історія заявок у притулок</h3>
              {loadingApps ? <p>Завантаження заявок...</p> : (
                <div className="applications-list">
                  {applications.length === 0 ? <p>Ви ще не подавали заявок.</p> :
                    applications.map(app => (
                      <div className="application-card" key={app.Id}>
                        
                        {/* ЛІВА ЧАСТИНА: Фото + Текст */}
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
                                <Link to={`/pets/${app.PetId}`} className="app-pet-link"><span>{app.PetName}</span></Link>
                              ) : (
                                <span>{app.PetName}</span>
                              )}
                            </h4>
                            <p>Заявка №: {app.Id}</p>
                            <small>Умови: {app.LivingConditions}</small>
                          </div>
                        </div>

                        {/* ПРАВА ЧАСТИНА: Статус */}
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
    </div>
  );
}

export default Profile;