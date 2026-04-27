import { useState, useEffect, useRef } from 'react';
import './Profile.css'; 

function Profile() {
  const [activeTab, setActiveTab] = useState('personal');
  
  // Додаємо реф для прихованого інпуту файлу
  const fileInputRef = useRef(null);

  // Стан для особистих даних (тепер з аватаркою)
  const [userData, setUserData] = useState({
    name: 'Марина О.',
    phone: '',
    email: '',
    // Встановлюємо дефолтну аватарку, якщо користувач ще не завантажив свою
    avatarUrl: '/ava.jpg' 
  });

  const [favorites, setFavorites] = useState([]);

  const mockApplications = [
    { id: 1, petName: 'Річард', date: '25.04.2026', status: 'Розглядається' },
    { id: 2, petName: 'Луна', date: '10.04.2026', status: 'Схвалено' }
  ];

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);

    const savedUser = JSON.parse(localStorage.getItem('profileData'));
    if (savedUser) {
      setUserData(savedUser);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('profileData', JSON.stringify(userData));
    alert('Ваші дані успішно збережено!');
  };

  // --- НОВІ ФУНКЦІЇ ДЛЯ АВАТАРКИ ---

  // 1. Користувач клікає по аватарці -> програмно натискаємо на прихований інпут
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // 2. Користувач обрав файл
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Перевіряємо, чи це дійсно картинка
      if (!file.type.startsWith('image/')) {
        alert('Будь ласка, оберіть зображення (JPEG, PNG).');
        return;
      }

      // Використовуємо FileReader для перетворення файлу у формат base64 (текстовий рядок), 
      // щоб його можна було зберегти в localStorage
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Коли файл прочитано, оновлюємо стан userData
        const base64String = reader.result;
        
        setUserData(prevData => {
            const newData = { ...prevData, avatarUrl: base64String };
            // Одразу зберігаємо в localStorage, щоб не треба було тиснути "Зберегти зміни"
            localStorage.setItem('profileData', JSON.stringify(newData));
            return newData;
        });
      };
      
      // Запускаємо читання файлу
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="profile-page"> 
      <div className="profile-container">
        
        <aside className="profile-sidebar">
          <div className="profile-avatar-section">
            
            {/* Оновлений блок аватарки */}
            <div className="avatar-wrapper" onClick={handleAvatarClick} title="Натисніть, щоб змінити фото">
                <img 
                    src={userData.avatarUrl} 
                    alt="Моя аватарка" 
                    className="profile-avatar-large" 
                />
                <div className="avatar-overlay">
                    <span>Змінити фото</span>
                </div>
            </div>

            {/* Прихований інпут для вибору файлу */}
            <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} // Ховаємо його з екрану
            />

            <h2 className="profile-name">{userData.name || 'Користувач'}</h2>
            <p className="profile-status">Власниця акаунту</p>
          </div>
          
          <nav className="profile-nav">
             {/* ... (Кнопки навігації залишаються без змін) ... */}
            <button className={`profile-nav-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
              Особисті дані
            </button>
            <button className={`profile-nav-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
              Мої заявки
            </button>
            <button className={`profile-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              Улюбленці
              {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
            </button>
          </nav>
        </aside>

        <section className="profile-content-area">
          {/* ... (Вміст вкладок залишається без змін) ... */}
          {activeTab === 'personal' && (
            <div className="profile-tab-content fade-in">
              <h3>Особисті дані</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Ім'я та Прізвище</label>
                  <input type="text" name="name" value={userData.name} onChange={handleInputChange} placeholder="Введіть ваше ім'я" required />
                </div>
                <div className="form-group">
                  <label>Номер телефону</label>
                  <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} placeholder="+38(0__) ___ __ __" />
                </div>
                <div className="form-group">
                  <label>Електронна пошта</label>
                  <input type="email" name="email" value={userData.email} onChange={handleInputChange} placeholder="example@mail.com" />
                </div>
                <button type="submit" className="save-profile-btn">Зберегти зміни</button>
              </form>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="profile-tab-content fade-in">
              <h3>Історія заявок</h3>
              <div className="applications-list">
                {mockApplications.map(app => (
                  <div className="application-card" key={app.id}>
                    <div className="app-details">
                      <h4>Заявка на: <span>{app.petName}</span></h4>
                      <p>Дата подачі: {app.date}</p>
                    </div>
                    <div className={`app-status ${app.status === 'Схвалено' ? 'status-green' : 'status-yellow'}`}>
                      {app.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="profile-tab-content fade-in">
              <h3>Мої улюбленці</h3>
              {favorites.length === 0 ? (
                <p className="empty-message">Список порожній. Перейдіть до каталогу, щоб обрати друга!</p>
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