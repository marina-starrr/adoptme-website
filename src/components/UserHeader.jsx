import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserHeader.css';
import DonateButton from './DonateButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

function UserHeader() {
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const { isLoggedIn, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isSuccessScreen, setIsSuccessScreen] = useState(false);

    // Стани форми (Крок 1)
    const [adopterFirstName, setAdopterFirstName] = useState('');
    const [adopterLastName, setAdopterLastName] = useState('');
    const [adopterPhone, setAdopterPhone] = useState('');
    const [adopterEmail, setAdopterEmail] = useState('');

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

    useEffect(() => {
        const handleOpenFavorites = () => {
            const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
            setFavorites(savedFavs);
            setShowForm(false);
            setIsSuccessScreen(false);
            setIsFavoritesOpen(true);
        };

        window.addEventListener('openFavorites', handleOpenFavorites);

        return () => {
            window.removeEventListener('openFavorites', handleOpenFavorites);
        };
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

    // 👇 Виправлено видалення: тепер шукаємо за UserNickname
    const handleRemove = async (id) => {
        const userNickname = localStorage.getItem('userNickname');

        if (userNickname) {
            const { error } = await supabase
                .from('Favorites')
                .delete()
                .eq('UserNickname', userNickname)
                .eq('PetId', id);

            if (error) console.error("Помилка видалення з БД:", error.message);
        }

        const newFavs = favorites.filter(pet => pet.id !== id);
        setFavorites(newFavs);
        localStorage.setItem('favorites', JSON.stringify(newFavs));
        window.dispatchEvent(new Event('cartUpdated'));
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const petNames = favorites.map(f => f.name).join(", ");

        const adoptionData = {
            PetName: petNames,
            AdopterName: `${adopterFirstName} ${adopterLastName}`,
            AdopterPhone: adopterPhone,
            AdopterEmail: adopterEmail, // 👈 Беремо пошту тільки з форми
            LivingConditions: housingType,
            HasExperience: hasExperience === 'yes',
            ExperienceDetails: hasExperience === 'yes' ? experienceDetails : '',
            HasOtherPets: hasOtherPets === 'yes',
            OtherPetsDetails: hasOtherPets === 'yes' ? otherPetsDetails : '',
            Reason: comment,
            Status: 'Нова'
        };

        const { error } = await supabase
            .from('AdoptionRequests')
            .insert([adoptionData]);

        if (!error) {
            localStorage.removeItem('favorites');
            setIsSuccessScreen(true);
            window.dispatchEvent(new Event('cartUpdated'));

            setAdopterFirstName('');
            setAdopterLastName('');
            setAdopterPhone('');
            setAdopterEmail('');
            setHousingType('');
            setComment('');
            setAgreeToTerms(false);
        } else {
            alert("Сталася помилка при відправці: " + error.message);
        }
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
                                        <button className="adopt-pet-btn" onClick={() => {
                                            if (!isLoggedIn) {
                                                handleCloseFavorites();
                                                navigate('/login', {
                                                    state: { welcomeMsg: '🐾 Будь ласка, увійдіть в систему, щоб прихистити тваринку' }
                                                });
                                            } else {
                                                setShowForm(true);
                                            }
                                        }}>Прихистити</button>
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
                                        <input
                                            type="email"
                                            placeholder="Ваш Email"
                                            value={adopterEmail}
                                            onChange={(e) => setAdopterEmail(e.target.value)}
                                            required
                                        />
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

            {isAccountOpen && (
                <div className={`side-drawer-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleCloseDrawer}>
                    <div className={`side-drawer ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>

                        <img
                            src="/хрест.png"
                            alt="Закрити"
                            className="drawer-close-icon"
                            onClick={handleCloseDrawer}
                            style={{ cursor: 'pointer', width: '24px', height: '24px', position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
                        />

                        <div className="drawer-content modern-drawer">

                            <div className="drawer-profile-header">
                                <img src="/ava.jpg" alt="Профіль" className="drawer-avatar modern-avatar" />
                                <h3 className="drawer-user-email">{localStorage.getItem('userNickname')}</h3>
                            </div>

                            <div className="modern-links">
                                <Link to="/profile" className="drawer-btn" onClick={handleCloseDrawer}>
                                    <span className="drawer-icon">👤</span> Мій профіль
                                </Link>
                            </div>

                            <div className="drawer-footer">
                                {/* 👇 Виправлена помилка синтаксису тут */}
                                <button className="drawer-btn logout-btn modern-logout" onClick={() => {
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
                                    handleCloseDrawer();
                                    navigate('/login');
                                }}>
                                    <span className="drawer-icon">🚪</span> Вийти з акаунту
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default UserHeader;