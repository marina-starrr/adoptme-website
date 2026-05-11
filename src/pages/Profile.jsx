import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; 
import BackgroundPaws from '../components/BackgroundPaws';
import './Profile.css'; 

function Profile() {
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);
  const [applications, setApplications] = useState([]); 
  const [loadingApps, setLoadingApps] = useState(false);

  const [userData, setUserData] = useState({
    name: 'Марина Денісова', 
    phone: '',
    email: '',
    avatarUrl: '/ava.jpg' 
  });

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    const savedUser = JSON.parse(localStorage.getItem('profileData'));
    if (savedUser) {
      setUserData(savedUser);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      const fetchMyApplications = async () => {
        setLoadingApps(true);
        const { data, error } = await supabase
          .from('AdoptionRequests')
          .select('*')
          .eq('AdopterName', userData.name) 
          .order('Id', { ascending: false });

        if (!error) {
          setApplications(data);
        }
        setLoadingApps(false);
      };

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

  const handleAvatarClick = () => fileInputRef.current.click();

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
          {/* Лапки сайдбару */}
          <BackgroundPaws customClass="sidebar-paws" />
          
          {/* 👇 ДОДАНО zIndex: 2, щоб аватарка була над лапками */}
          <div className="profile-avatar-section" style={{ position: 'relative', zIndex: 2 }}>
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
                <img src={userData.avatarUrl} alt="Аватар" className="profile-avatar-large" />
                <div className="avatar-overlay"><span>Змінити</span></div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <h2 className="profile-name">{userData.name}</h2>
            <p className="profile-status">Власниця акаунту</p>
          </div>
          
          {/* 👇 ДОДАНО zIndex: 2, щоб кнопки натискалися */}
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
                  {applications.length === 0 ? <p>Ви ще не подавали заявок.</p> : 
                    applications.map(app => (
                      <div className="application-card" key={app.Id}>
                        <div className="app-details">
                          <h4>Тваринка: <span>{app.PetName}</span></h4>
                          <p>Дата: {app.RequestDate}</p>
                          <small>Умови: {app.LivingConditions}</small>
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
    </div>
  );
}

export default Profile;