import { useState, useRef, useEffect } from 'react'; // 👈 Додано useEffect
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import DonateButton from './DonateButton';

function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // 👇 СТАН АВТОРИЗАЦІЇ (Чи увійшов користувач)
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('isAdmin'));

    const [isClosing, setIsClosing] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isSuccessScreen, setIsSuccessScreen] = useState(false);

    // Стани форми (Крок 1)
    const [adopterFirstName, setAdopterFirstName] = useState('');
    const [adopterLastName, setAdopterLastName] = useState('');
    const [adopterPhone, setAdopterPhone] = useState('');

    // Стани форми (Крок 2 та 3)
    const [housingType, setHousingType] = useState('');
    const [hasExperience, setHasExperience] = useState('no');
    const [experienceDetails, setExperienceDetails] = useState('');
    const [hasOtherPets, setHasOtherPets] = useState('no');
    const [otherPetsDetails, setOtherPetsDetails] = useState('');
    const [comment, setComment] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const textareaRef = useRef(null);

    const navigate = useNavigate();

    // 👇 ЕФЕКТ ДЛЯ ВІДСТЕЖЕННЯ ВХОДУ/ВИХОДУ
    useEffect(() => {
        const checkAuth = () => {
            setIsLoggedIn(!!localStorage.getItem('isAdmin'));
        };
        // Слухаємо зміни в localStorage (наприклад, коли відбувається вхід на сторінці Login)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const handleCloseDrawer = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsAccountOpen(false);
            setIsClosing(false);
        }, 300);
    };

    const handleCloseFavorites = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsFavoritesOpen(false);
            setIsModalClosing(false);
            setShowForm(false);
            setIsSuccessScreen(false);
        }, 300);
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);
    const handleLogoClick = () => {
        window.scrollTo(0, 0);
        setIsOpen(false);
    };

    const openFavorites = () => {
        const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(savedFavs);
        setShowForm(false);
        setIsSuccessScreen(false);
        setIsFavoritesOpen(true);
    };

    const handleRemove = (id) => {
        const newFavs = favorites.filter(pet => pet.id !== id);
        setFavorites(newFavs);
        localStorage.setItem('favorites', JSON.stringify(newFavs));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const petNames = favorites.map(f => f.name).join(", ");

        const adoptionData = {
            PetName: petNames,
            FirstName: adopterFirstName,
            LastName: adopterLastName,
            AdopterPhone: adopterPhone,
            LivingConditions: housingType,
            HasExperience: hasExperience === 'yes',
            ExperienceDetails: hasExperience === 'yes' ? experienceDetails : '',
            HasOtherPets: hasOtherPets === 'yes',
            OtherPetsDetails: hasOtherPets === 'yes' ? otherPetsDetails : '',
            Reason: comment,
            AgreedToInterview: agreeToTerms
        };

        fetch(`${import.meta.env.VITE_API_URL}/api/adopt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adoptionData)
        })
            .then(res => {
                if (res.ok) {
                    localStorage.removeItem('favorites');
                    setIsSuccessScreen(true);
                    window.dispatchEvent(new Event('cartUpdated'));
                } else {
                    alert("Сталася помилка при відправці. Перевір консоль сервера.");
                }
            })
            .catch(err => console.error("Помилка відправки:", err));
    };

    const finishAdoption = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setFavorites([]);
            setIsFavoritesOpen(false);
            setIsModalClosing(false);
            setIsSuccessScreen(false);
            window.location.reload();
        }, 300);
    };

    const handleFirstNameChange = (e) => {
        const cleanedValue = e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-]/g, '');
        setAdopterFirstName(cleanedValue.substring(0, 25));
    };

    const handleLastNameChange = (e) => {
        const cleanedValue = e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-]/g, '');
        setAdopterLastName(cleanedValue.substring(0, 25));
    };

    const handlePhoneChange = (e) => {
        const rawDigits = e.target.value.replace(/\D/g, '');
        if (rawDigits.length === 0) { setAdopterPhone(''); return; }
        let digits = rawDigits;
        if (!digits.startsWith('38')) digits = '38' + digits;
        digits = digits.substring(0, 12);
        let formatted = '+';
        if (digits.length > 0) formatted += digits.substring(0, 2);
        if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
        if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
        if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
        if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
        setAdopterPhone(formatted);
    };

    const handleCommentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 300) {
            setComment(value);
            if (textareaRef.current) {
                textareaRef.current.style.height = '0px';
                const scrollHeight = textareaRef.current.scrollHeight;
                textareaRef.current.style.height = `${scrollHeight}px`;
            }
        }
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
                <DonateButton />
                <img
                    src="/obrane.png"
                    alt="Обране"
                    className="favorite-icon"
                    onClick={openFavorites}
                    style={{ cursor: 'pointer', marginLeft: '15px' }}
                />

                {/* 👇 УМОВНИЙ РЕНДЕРИНГ: Аватарка для Адміна, Кнопка для Гостя 👇 */}
                {isLoggedIn ? (
                    <img
                        src="/avatar.png"
                        alt="Акаунт"
                        className="account-icon"
                        onClick={() => setIsAccountOpen(true)}
                        style={{ cursor: 'pointer', marginLeft: '15px', width: '30px', height: '30px' }}
                    />
                ) : (
                    <Link to="/login" className="login-nav-btn">
                        Увійти
                    </Link>
                )}
            </div>

            {/* ВІКНО ОБРАНИХ ТВАРИН ТА АНКЕТА */}
            {isFavoritesOpen && (
                <div className={`modal ${isModalClosing ? 'closing' : ''}`} style={{ display: 'flex' }}>
                    <div className={`modal-content ${isModalClosing ? 'closing' : ''}`}>
                        <span className="close-btn" onClick={handleCloseFavorites}>&times;</span>

                        {isSuccessScreen ? (
                            <div key="success" className="fade-view success-message-container">
                                <div className="success-icon">🐾</div>
                                <h3 className="success-title">Дякуємо, {adopterFirstName}!</h3>
                                <p className="success-text">Вашу заявку успішно надіслано.</p>
                                <p className="success-text">Ми дуже цінуємо ваше бажання подарувати дім {favorites.length === 1 ? 'тваринці' : 'тваринкам'} і зв’яжемося з вами найближчим часом.</p>
                                <button className="adopt-pet-btn" style={{ marginTop: '20px' }} onClick={finishAdoption}>Супер!</button>
                            </div>
                        ) : !showForm ? (
                            <div key="cart" className="fade-view">
                                <div className="modal-header">
                                    <h3>Обрані тварини</h3>
                                </div>
                                <div className="favorite-pets-container">
                                    {favorites.length === 0 ? (
                                        <p className="empty-favorites-text">
                                            Ти досі не вибрав свого улюбленця? <br />
                                            Перейди на сторінку <Link to="/pets" className="empty-link-purple" onClick={handleCloseFavorites}>Тварини</Link> і обери найкращого друга!
                                        </p>
                                    ) : (
                                        favorites.map(pet => (
                                            <div className="favorite-card" key={pet.id}>
                                                <button
                                                    className="remove-favorite-icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemove(pet.id);
                                                    }}
                                                    title="Прибрати з обраного"
                                                >
                                                    &times;
                                                </button>

                                                <Link
                                                    to={`/pets/${pet.id}`}
                                                    className="favorite-card-link"
                                                    onClick={handleCloseFavorites}
                                                >
                                                    <img src={pet.image} alt={pet.name} className="favorite-card-image" />
                                                    <h4 className="favorite-card-name">{pet.name}</h4>
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {favorites.length > 0 && (
                                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                        <p className="success-favorites-text">
                                            Чудовий вибір! Скоріше натискай кнопку нижче <br /> і заповнюй анкету на прихисток 💜
                                        </p>
                                        <button className="adopt-pet-btn" onClick={() => setShowForm(true)}>Прихистити</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div key="form" className="fade-view">
                                <div className="modal-header">
                                    <h3>Анкета на прихисток</h3>
                                </div>
                                <form className="adoption-form" onSubmit={handleSubmit}>

                                    <div className="form-step">
                                        <h4 className="form-step-title">Крок 1: Ваші контакти</h4>
                                        <div className="name-inputs-row">
                                            <input type="text" placeholder="Ім'я" value={adopterFirstName} onChange={handleFirstNameChange} required />
                                            <input type="text" placeholder="Прізвище" value={adopterLastName} onChange={handleLastNameChange} required />
                                        </div>
                                        <input type="text" placeholder="+38(0__) ___ __ __" value={adopterPhone} onChange={handlePhoneChange} required />
                                    </div>

                                    <div className="form-step">
                                        <h4 className="form-step-title">Крок 2: Умови проживання</h4>

                                        <select value={housingType} onChange={(e) => setHousingType(e.target.value)} required className="form-select">
                                            <option value="" disabled>Оберіть тип житла</option>
                                            <option value="Власна квартира">Власна квартира</option>
                                            <option value="Орендована квартира">Орендована квартира</option>
                                            <option value="Приватний будинок">Приватний будинок</option>
                                        </select>

                                        <div className="radio-group-container">
                                            <p>Чи був у вас досвід з тваринами?</p>
                                            <div className="radio-options">
                                                <label><input type="radio" name="exp" value="yes" checked={hasExperience === 'yes'} onChange={() => setHasExperience('yes')} /> Так</label>
                                                <label><input type="radio" name="exp" value="no" checked={hasExperience === 'no'} onChange={() => setHasExperience('no')} /> Ні</label>
                                            </div>
                                            {hasExperience === 'yes' && (
                                                <div className="input-container fade-view conditional-input">
                                                    <input
                                                        type="text"
                                                        placeholder="Який саме? (напр. був собака)"
                                                        value={experienceDetails}
                                                        onChange={(e) => {
                                                            if (e.target.value.length <= 100) setExperienceDetails(e.target.value);
                                                        }}
                                                        maxLength="100"
                                                        required
                                                    />
                                                    <span className={`char-counter input-counter ${experienceDetails.length >= 100 ? 'limit-reached' : ''}`}>
                                                        {100 - experienceDetails.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="radio-group-container">
                                            <p>Чи є зараз інші тварини вдома?</p>
                                            <div className="radio-options">
                                                <label><input type="radio" name="other" value="yes" checked={hasOtherPets === 'yes'} onChange={() => setHasOtherPets('yes')} /> Так</label>
                                                <label><input type="radio" name="other" value="no" checked={hasOtherPets === 'no'} onChange={() => setHasOtherPets('no')} /> Ні</label>
                                            </div>
                                            {hasOtherPets === 'yes' && (
                                                <div className="input-container fade-view conditional-input">
                                                    <input
                                                        type="text"
                                                        placeholder="Які саме? (напр. кіт, папуга)"
                                                        value={otherPetsDetails}
                                                        onChange={(e) => {
                                                            if (e.target.value.length <= 100) setOtherPetsDetails(e.target.value);
                                                        }}
                                                        maxLength="100"
                                                        required
                                                    />
                                                    <span className={`char-counter input-counter ${otherPetsDetails.length >= 100 ? 'limit-reached' : ''}`}>
                                                        {100 - otherPetsDetails.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-step">
                                        <h4 className="form-step-title">Крок 3: Додатково</h4>

                                        <div className="textarea-container">
                                            <textarea
                                                ref={textareaRef}
                                                placeholder="Чому ви обрали саме цю тваринку? (необов'язково)"
                                                value={comment}
                                                onChange={handleCommentChange}
                                                className="form-textarea-small"
                                                rows="3"
                                                maxLength="300"
                                            ></textarea>
                                            <span className={`char-counter ${comment.length >= 300 ? 'limit-reached' : ''}`}>
                                                {300 - comment.length}
                                            </span>
                                        </div>

                                        <label className="checkbox-container">
                                            <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} required />
                                            <span className="checkbox-text">Я погоджуюся на співбесіду з куратором та подальшу підтримку зв'язку.</span>
                                        </label>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="back-to-favorites-btn" onClick={() => setShowForm(false)}>Назад</button>
                                        <button type="submit" className="submit-adoption-btn">Надіслати заявку</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* БІЧНА ПАНЕЛЬ ПРОФІЛЮ АДМІНА */}
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
                                <Link to="/admin-panel" className="drawer-btn" onClick={handleCloseDrawer}> {/* Змінено на /admin-panel */}
                                    Мій профіль
                                </Link>

                                {/* 👇 ОНОВЛЕНА КНОПКА "ВИЙТИ" 👇 */}
                                <button className="drawer-btn logout-btn" onClick={() => {
                                    localStorage.removeItem('isAdmin'); // Очищаємо статус адміна
                                    setIsLoggedIn(false); // Хедер розуміє, що ми вийшли
                                    handleCloseDrawer(); // Закриваємо панель
                                    navigate('/login'); // Перекидаємо на сторінку входу
                                }}>
                                    Вийти
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;