import { useState } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false); // 👇 НОВИЙ СТАН
  const [favorites, setFavorites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // 👇 Новий стан

  // 👇 Нова функція для плавного закриття
  const handleCloseDrawer = () => {
      setIsClosing(true); // 1. Вмикаємо анімацію зникнення
      setTimeout(() => {
          setIsAccountOpen(false); // 2. Видаляємо з екрана
          setIsClosing(false);     // 3. Скидаємо стан для наступного разу
      }, 300); // Чекаємо 300мс (час нашої CSS анімації)
  };

  // Дані форми
  const [adopterName, setAdopterName] = useState('');
  const [adopterPhone, setAdopterPhone] = useState('');

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const handleLogoClick = () => {
    window.scrollTo(0, 0); // Примусово крутимо на самий верх
    setIsOpen(false);      // Закриваємо мобільне меню (якщо воно було відкрите)
  };

  // Відкриття кошика
  const openFavorites = () => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavs);
    setShowForm(false); 
    setIsFavoritesOpen(true);
  };

  // Видалення з кошика
  const handleRemove = (id) => {
     const newFavs = favorites.filter(pet => pet.id !== id);
     setFavorites(newFavs);
     localStorage.setItem('favorites', JSON.stringify(newFavs));
       window.dispatchEvent(new Event('cartUpdated'));
  };


  // Відправка заявки в базу
  const handleSubmit = (e) => {
     e.preventDefault();
     const petNames = favorites.map(f => f.name).join(", ");

fetch(`${import.meta.env.VITE_API_URL}/api/adopt`, {       
     method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petName: petNames, adopterName, adopterPhone })
     })
     .then(res => {
        if (res.ok) {
           alert(`Дякуємо, ${adopterName}! Ваша заява була успішно подана.`);
           localStorage.removeItem('favorites'); // Очищаємо пам'ять
           setFavorites([]);
           setIsFavoritesOpen(false);
           // Оновлюємо сторінку, щоб скинути сердечка
           window.location.reload(); 
        }
     });
  };

  // Фільтр для імені: тільки літери, пробіли, тире. Ліміт 50 символів.
  const handleNameChange = (e) => {
    // Видаляємо всі цифри та спецсимволи (залишаємо укр/англ літери, пробіл та тире)
    const cleanedValue = e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-]/g, '');
    setAdopterName(cleanedValue.substring(0, 50)); // Ліміт 50 символів
  };

  // Фільтр для телефону: автоматична маска +38(0XX) XXX XX XX
  const handlePhoneChange = (e) => {
    // Залишаємо ТІЛЬКИ цифри
    const rawDigits = e.target.value.replace(/\D/g, '');
    
    // Якщо поле пусте — очищаємо
    if (rawDigits.length === 0) {
      setAdopterPhone('');
      return;
    }

    // Якщо користувач вводить першу цифру (наприклад '0'), автоматично додаємо '38'
    let digits = rawDigits;
    if (!digits.startsWith('38')) {
      digits = '38' + digits;
    }

    // Обрізаємо до 12 цифр максимум
    digits = digits.substring(0, 12);

    // Збираємо гарну маску
    let formatted = '+';
    if (digits.length > 0) formatted += digits.substring(0, 2); // +38
    if (digits.length > 2) formatted += '(' + digits.substring(2, 5); // +38(0XX
    if (digits.length > 5) formatted += ') ' + digits.substring(5, 8); // +38(0XX) XXX
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10); // ... XX
    if (digits.length > 10) formatted += ' ' + digits.substring(10, 12); // ... XX

    setAdopterPhone(formatted);
  };

  return (
    <header className="header" id="home">
        <div className="header-left">
        <Link to="/" onClick={handleLogoClick}>
        <img src="/logo.png" alt="Adopt Me Logo" className="logo-img" />
        </Link>
        </div>
        
        <button className={`hamburger-menu ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span className="bar"></span><span className="bar"></span><span className="bar"></span>
        </button>
        
        <nav>
            <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
                <li><Link to="/" className="nav-link" onClick={closeMenu}>Головна</Link></li>
                <li><Link to="/pets" className="nav-link" onClick={closeMenu}>Тварини</Link></li>
                <li><Link to="/about" className="nav-link" onClick={closeMenu}>Про нас</Link></li>
                <li><Link to="/reviews" className="nav-link" onClick={closeMenu}>Відгуки</Link></li>
                <li><Link to="/contact" className="nav-link" onClick={closeMenu}>Контакти</Link></li>
            </ul>
        </nav>
        
        <div className="header-right">
            <button className="support-btn">Підтримати</button>
            {/* 👇 Кнопка відкриття Обраного */}
            <img 
                src="/obrane.png" 
                alt="Обране" 
                className="favorite-icon" 
                onClick={openFavorites} 
                style={{ cursor: 'pointer', marginLeft: '15px' }} 
            />
            <img 
                src="/avatar.png" 
                alt="Акаунт" 
                className="account-icon" // Змінив клас для ясності
                onClick={() => setIsAccountOpen(true)} // Відкриває вікно акаунту
                style={{ cursor: 'pointer', marginLeft: '15px', width: '30px', height: '30px' }} // Додав розміри про всяк випадок
            />
        </div>

        {/* 👇 САМЕ МОДАЛЬНЕ ВІКНО */}
        {isFavoritesOpen && (
            <div className="modal" style={{ display: 'flex' }}>
                <div className="modal-content">
                    <span className="close-btn" onClick={() => setIsFavoritesOpen(false)}>&times;</span>
                    <div className="modal-header">
                        <h3>Обрані тварини</h3>
                    </div>

                    {!showForm ? (
                        <>
                            <div className="favorite-pets-container">
                                {favorites.length === 0 ? (
                                    <p>Список порожній. Перейдіть до "Тварини", щоб обрати друга!</p>
                                ) : (
                                    favorites.map(pet => (
                                        <div className="favorite-card" key={pet.id}>
                                            <img src={pet.image} alt={pet.name} className="favorite-card-image" />
                                            <h4 className="favorite-card-name">{pet.name}</h4>
                                            <button className="remove-favorite-btn" onClick={() => handleRemove(pet.id)}>Прибрати</button>
                                        </div>
                                    ))
                                )}
                            </div>
                            {favorites.length > 0 && (
                                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                    <button className="adopt-pet-btn" onClick={() => setShowForm(true)}>Прихистити</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <form className="adoption-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                            <h4>Форма заяви на прихисток</h4>
<input type="text" placeholder="Ваше Ім'я та Прізвище" value={adopterName} onChange={handleNameChange}/>
<input type="text" placeholder="+38(0__) ___ __ __" value={adopterPhone} onChange={handlePhoneChange}/>
<button type="submit" className="submit-adoption-btn" style={{ marginTop: '10px' }}>Подати заяву</button>
                            <button type="button" className="back-to-favorites-btn" onClick={() => setShowForm(false)} style={{ marginTop: '10px' }}>Назад</button>
                        </form>
                    )}
                </div>
            </div>
        )}
        
        {/* Бічна панель акаунту */}
{isAccountOpen && (
    <div className={`side-drawer-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleCloseDrawer}>
        <div className={`side-drawer ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            <img 
                src="/хрест.png" 
                alt="Закрити" 
                className="drawer-close-icon"
                onClick={handleCloseDrawer} 
                style={{ cursor: 'pointer', width: '24px', height: '24px', position: 'absolute', top: '20px', right: '20px' }} 
            />
            
            <div className="drawer-content">
                <img src="/ava.jpg" alt="Профіль" className="drawer-avatar" />
                <h3>Мій акаунт</h3>
                
                <div className="drawer-links">
                    {favorites.length > -1 ? (
                        <>
                            <Link to="/profile" className="drawer-btn" onClick={handleCloseDrawer}> {/* 👇 Замінили функцію */}
                                Мій профіль
                            </Link>
                            <button className="drawer-btn logout-btn" onClick={() => {
                                // Логіка виходу
                                handleCloseDrawer(); {/* 👇 Замінили функцію */}
                            }}>
                                Вийти
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="drawer-btn login-btn" onClick={handleCloseDrawer}> {/* 👇 Замінили функцію */}
                            Увійти
                        </Link>
                    )}
                </div>
            </div>
        </div>
    </div>
)}
    </header>
  );
}

export default Header;