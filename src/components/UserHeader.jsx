import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './UserHeader.css';
import DonateButton from './DonateButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext'; // 👈 Глобальні сповіщення

function UserHeader() {
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [livePetsData, setLivePetsData] = useState([]);
    const [selectedPetIds, setSelectedPetIds] = useState([]);
    const [isFetchingLive, setIsFetchingLive] = useState(false);

    const { isLoggedIn, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isSuccessScreen, setIsSuccessScreen] = useState(false);

    const [adopterFirstName, setAdopterFirstName] = useState('');
    const [adopterLastName, setAdopterLastName] = useState('');
    const [adopterPhone, setAdopterPhone] = useState('');
    const [adopterEmail, setAdopterEmail] = useState('');

    const [housingType, setHousingType] = useState('');
    const [hasExperience, setHasExperience] = useState('no');
    const [experienceDetails, setExperienceDetails] = useState('');
    const [hasOtherPets, setHasOtherPets] = useState('no');
    const [otherPetsDetails, setOtherPetsDetails] = useState('');
    const [comment, setComment] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const textareaRef = useRef(null);
    const dropdownRef = useRef(null); 
    const navigate = useNavigate();
    const location = useLocation();

    // 👇 Підключаємо функцію для красивих сповіщень
    const { showToast } = useToast();

    const userRole = localStorage.getItem('userRole');

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
    
    const showLoggedInUI = isLoggedIn && !isAuthPage;

    useEffect(() => {
        if (userRole === 'admin' && !location.pathname.startsWith('/admin')) {
            navigate('/admin/adoptions', { replace: true });
        }
    }, [userRole, location.pathname, navigate]);

    const formatExistingPhone = (phoneStr) => {
        if (!phoneStr) return '';
        let digits = phoneStr.replace(/\D/g, '');
        
        if (digits.startsWith('380')) {
            digits = digits.substring(3);
        } else if (digits.startsWith('0')) {
            digits = digits.substring(1);
        } else if (digits.startsWith('38')) {
            digits = digits.substring(2);
        }
        
        digits = digits.substring(0, 9); 
        
        let formatted = '+38(0';
        if (digits.length > 0) formatted += digits.substring(0, 2);
        if (digits.length > 2) formatted += ') ' + digits.substring(2, 5);
        if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
        if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);
        
        return formatted;
    };

    const fetchNotifications = async () => {
        const userNickname = localStorage.getItem('userNickname');
        
        if (userNickname) {
            const { data: treatmentData, error: treatmentError } = await supabase
                .from('TreatmentNotifications')
                .select('*')
                .eq('UserNickname', userNickname)
                .eq('Status', 'Оброблена');

            const { data: adoptionData, error: adoptionError } = await supabase
                .from('AdoptionRequests')
                .select('*')
                .eq('UserNickname', userNickname)
                .neq('Status', 'Нова')
                .eq('UserNotified', false);

            const { data: favoriteData, error: favoriteError } = await supabase
                .from('FavoriteNotifications')
                .select('*')
                .eq('UserNickname', userNickname)
                .eq('IsRead', false);

            let combinedNotifications = [];

            if (!treatmentError && treatmentData) {
                combinedNotifications = [
                    ...combinedNotifications, 
                    ...treatmentData.map(n => ({ ...n, type: 'treatment', uniqueId: `treat_${n.Id}` }))
                ];
            }

            if (!adoptionError && adoptionData) {
                combinedNotifications = [
                    ...combinedNotifications, 
                    ...adoptionData.map(a => ({ ...a, type: 'adoption_status', uniqueId: `adopt_${a.Id}` }))
                ];
            }

            if (!favoriteError && favoriteData) {
                combinedNotifications = [
                    ...combinedNotifications,
                    ...favoriteData.map(f => ({ ...f, type: 'favorite_status', uniqueId: `fav_${f.Id}` }))
                ];
            }

            setNotifications(combinedNotifications);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (showForm) {
            const loadUserData = async () => {
                const localNickname = localStorage.getItem('userNickname');
                if (localNickname && localNickname !== 'Гість') {
                    try {
                        const { data: userData, error } = await supabase
                            .from('Users')
                            .select('FirstName, LastName, Phone, Email')
                            .eq('Nickname', localNickname)
                            .maybeSingle();
                        
                        if (userData) {
                            if (userData.FirstName) setAdopterFirstName(userData.FirstName);
                            if (userData.LastName) setAdopterLastName(userData.LastName);
                            if (userData.Email) setAdopterEmail(userData.Email);
                            if (userData.Phone) {
                                setAdopterPhone(formatExistingPhone(userData.Phone));
                            } else {
                                setAdopterPhone(''); 
                            }
                        }
                    } catch (err) {
                        console.error('Помилка завантаження профілю:', err);
                    }
                }
            };
            loadUserData();
        }
    }, [showForm]);

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCloseFavorites = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsFavoritesOpen(false);
            setIsModalClosing(false);
            setShowForm(false);
            setIsSuccessScreen(false);
        }, 300);
    };

    const handleCloseNotifications = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsNotificationsOpen(false);
            setIsModalClosing(false);
        }, 300);
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);
    
    const handleLogoClick = (e) => {
        if (userRole === 'admin') {
            e.preventDefault();
            navigate('/admin/adoptions');
        } else {
            window.scrollTo(0, 0);
            setIsOpen(false);
        }
    };

    const openFavorites = () => {
        const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(savedFavs);
        setShowForm(false);
        setIsSuccessScreen(false);
        setIsFavoritesOpen(true);
    };

    const handleRemove = async (id) => {
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

    const handleDeleteNotification = async (notif) => {
        setNotifications(prev => prev.filter(n => n.uniqueId !== notif.uniqueId));

        try {
            if (notif.type === 'treatment') {
                await supabase.from('TreatmentNotifications').delete().eq('Id', notif.Id);
            } else if (notif.type === 'adoption_status') {
                await supabase.from('AdoptionRequests').update({ UserNotified: true }).eq('Id', notif.Id);
            } else if (notif.type === 'favorite_status') {
                await supabase.from('FavoriteNotifications').update({ IsRead: true }).eq('Id', notif.Id);
            }
        } catch (err) {
            console.error(err);
            fetchNotifications(); 
        }
    };

    const handleNotificationCardClick = async (notif) => {
        handleDeleteNotification(notif);
        setIsNotificationsOpen(false);
        
        if (notif.type === 'adoption_status') {
            navigate('/profile', { 
                state: { activeTab: 'applications', highlightAppId: notif.Id } 
            });
        } else if (notif.type === 'favorite_status') {
            navigate(`/pets/${notif.PetId}`); 
        }
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
        let input = e.target.value;
        
        if (input.length < 5 || !input.startsWith('+38(0')) {
            setAdopterPhone('+38(0');
            return;
        }
        
        let rawAfter = input.substring(5).replace(/\D/g, '');
        rawAfter = rawAfter.substring(0, 9);
        
        let formatted = '+38(0';
        if (rawAfter.length > 0) formatted += rawAfter.substring(0, 2);
        if (rawAfter.length > 2) formatted += ') ' + rawAfter.substring(2, 5);
        if (rawAfter.length > 5) formatted += ' ' + rawAfter.substring(5, 7);
        if (rawAfter.length > 7) formatted += ' ' + rawAfter.substring(7, 9);
        
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

        if (selectedPetIds.length === 0) {
            // 👇 Замінено alert на showToast
            showToast("⚠️ Будь ласка, оберіть хоча б одну тваринку, доступну для усиновлення!");
            return;
        }

        const selectedPets = livePetsData.filter(p => selectedPetIds.includes(p.Id));
        const petNames = selectedPets.map(f => f.Name).join(", ");
        const petIds = selectedPets.map(f => f.Id);
        const userNickname = localStorage.getItem('userNickname');

        const adoptionData = {
            PetIds: petIds,
            UserNickname: userNickname,
            PetName: petNames,
            AdopterName: `${adopterFirstName} ${adopterLastName}`,
            AdopterPhone: adopterPhone,
            AdopterEmail: adopterEmail,
            LivingConditions: housingType,
            HasExperience: hasExperience === 'yes',
            ExperienceDetails: hasExperience === 'yes' ? experienceDetails : '',
            HasOtherPets: hasOtherPets === 'yes',
            OtherPetsDetails: hasOtherPets === 'yes' ? otherPetsDetails : '',
            Reason: comment,
            Status: 'Нова',
            UserNotified: false 
        };

        const { error } = await supabase.from('AdoptionRequests').insert([adoptionData]);

        if (!error) {
            if (userNickname && petIds.length > 0) {
                await supabase
                    .from('Favorites')
                    .delete()
                    .eq('UserNickname', userNickname)
                    .in('PetId', petIds);
            }

            const remainingFavs = favorites.filter(f => !petIds.includes(f.id));
            if (remainingFavs.length > 0) {
                localStorage.setItem('favorites', JSON.stringify(remainingFavs));
            } else {
                localStorage.removeItem('favorites');
            }

            setIsSuccessScreen(true);
            window.dispatchEvent(new Event('cartUpdated'));

            setAdopterFirstName('');
            setAdopterLastName('');
            setAdopterPhone('');
            setAdopterEmail('');
            setHousingType('');
            setComment('');
            setAgreeToTerms(false);
            setSelectedPetIds([]);
        } else {
            // 👇 Замінено alert на showToast
            showToast("❌ Сталася помилка при відправці: " + error.message);
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

    const handleLogoutClick = () => {
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
        setIsAccountOpen(false);
        navigate('/login');
    };

    const getStatusClass = (statusStr) => {
        switch(statusStr) {
            case 'Нова': return 'new';
            case 'Розглядається': return 'review';
            case 'Схвалено': return 'approved';
            case 'Передано': return 'handed';
            case 'Відхилено': return 'rejected';
            default: return 'new';
        }
    };

    const getPetStatusClass = (statusStr) => {
        switch(statusStr) {
            case 'На лікуванні': return 'treatment';
            case 'Вже вдома': case 'Вже знайшла дім': return 'home';
            case 'Не вдалось врятувати': return 'rainbow';
            case 'Заброньована': case 'Заброньовано': return 'reserved';
            case 'Шукає дім': return 'looking'; 
            default: return 'review';
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
                    <li><a href="/" className="nav-link" onClick={closeMenu}>Головна</a></li>
                    <li><a href="/pets" className="nav-link" onClick={closeMenu}>Тварини</a></li>
                    <li><a href="/about" className="nav-link" onClick={closeMenu}>Про нас</a></li>
                    <li><a href="/reviews" className="nav-link" onClick={closeMenu}>Відгуки</a></li>
                    <li><a href="/help" className="nav-link" onClick={closeMenu}>Допомога</a></li>
                    <li><a href="/contact" className="nav-link" onClick={closeMenu}>Контакти</a></li>
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

                {showLoggedInUI && (
                    <div className="notification-wrapper">
                        <img
                            src="/notification.png"
                            alt="Сповіщення"
                            className="notification-icon"
                            onClick={() => setIsNotificationsOpen(true)}
                        />
                        {notifications.length > 0 && (
                            <span className="notification-badge">{notifications.length}</span>
                        )}
                    </div>
                )}

                {showLoggedInUI ? (
                    <div className="avatar-dropdown-container" ref={dropdownRef}>
                        <img
                            src="/avatar.png"
                            alt="Акаунт"
                            className="account-icon"
                            onClick={() => setIsAccountOpen(!isAccountOpen)}
                        />

                        {isAccountOpen && (
                            <div className="profile-mini-menu">
                                <div className="mini-menu-header">
                                    <span className="mini-menu-name">@{localStorage.getItem('userNickname')}</span>
                                </div>

                                {userRole === 'admin' ? (
                                    <Link to="/admin/adoptions" className="mini-menu-item" onClick={() => setIsAccountOpen(false)}>
                                        ⚙️ Панель керування
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/profile" state={{ activeTab: 'personal' }} className="mini-menu-item" onClick={() => setIsAccountOpen(false)}>
                                            👤 Мій профіль
                                        </Link>

                                        <Link to="/profile" state={{ activeTab: 'applications' }} className="mini-menu-item" onClick={() => setIsAccountOpen(false)}>
                                            📝 Мої заявки
                                        </Link>
                                    </>
                                )}

                                <div className="mini-menu-divider"></div>

                                <button className="mini-menu-item logout-item" onClick={handleLogoutClick}>
                                    🚪 Вийти
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="login-nav-btn">
                        Увійти
                    </Link>
                )}
            </div>

            {/* Модальне вікно для СПОВІЩЕНЬ */}
            {isNotificationsOpen && (
                <div className={`modal ${isModalClosing ? 'closing' : ''}`} style={{ display: 'flex' }}>
                    <div className={`modal-content ${isModalClosing ? 'closing' : ''}`}>
                        <span className="close-btn" onClick={handleCloseNotifications}>&times;</span>
                        <div className="modal-header">
                            <h3>Ваші сповіщення</h3>
                        </div>
                        <div className="notifications-container">
                            {notifications.length === 0 ? (
                                <p className="empty-favorites-text">У вас поки немає нових сповіщень.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.uniqueId} 
                                        className="notification-card"
                                        onClick={() => handleNotificationCardClick(notif)}
                                        style={{ cursor: notif.type !== 'treatment' ? 'pointer' : 'default' }}
                                    >
                                        {notif.type === 'treatment' ? (
                                            <p>
                                                🎉 Радісна новина! Тваринка{' '}
                                                <Link
                                                    to={`/pets/${notif.PetId}`}
                                                    onClick={handleCloseNotifications}
                                                    className="notification-pet-link"
                                                >
                                                    {notif.PetName}
                                                </Link>{' '}
                                                упішно пройшла лікування і тепер чекає на вас!
                                            </p>
                                        ) : notif.type === 'adoption_status' ? (
                                            <p>
                                                📋 Статус вашої заявки на <strong>{notif.PetName}</strong> було змінено! Новий статус:{' '}
                                                <span className={`status-badge-inline ${getStatusClass(notif.Status)}`}>
                                                    {notif.Status}
                                                </span>
                                            </p>
                                        ) : notif.type === 'favorite_status' && notif.NewStatus === 'Новенький хвостик' ? (
                                            <p>
                                                ✨ У притулку поповнення! Зустрічайте хвостика на ім'я <strong>{notif.PetName}</strong>.{' '}
                                                <Link
                                                    to={`/pets/${notif.PetId}`}
                                                    onClick={handleCloseNotifications}
                                                    className="notification-pet-link"
                                                >
                                                    Дивитися
                                                </Link>
                                            </p>
                                        ) : (
                                            <p>
                                                ❤️ Тваринка <strong>{notif.PetName}</strong> з вашого обраного змінила статус на:{' '}
                                                <span className={`status-badge-inline ${getPetStatusClass(notif.NewStatus)}`}>
                                                    {notif.NewStatus}
                                                </span>
                                            </p>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                handleDeleteNotification(notif);
                                            }}
                                            className="mark-read-btn"
                                        >
                                            Зрозуміло
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Модальне вікно для ОБРАНОГО */}
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
                                        <button className="adopt-pet-btn" onClick={async () => {
                                            if (!isLoggedIn) {
                                                handleCloseFavorites();
                                                navigate('/login', {
                                                    state: { welcomeMsg: '🐾 Будь ласка, увійдіть в систему, щоб прихистити тваринку' }
                                                });
                                            } else {
                                                setIsFetchingLive(true);
                                                const ids = favorites.map(f => f.id);
                                                if (ids.length > 0) {
                                                    const { data, error } = await supabase
                                                        .from('Pets')
                                                        .select('Id, Name, Status')
                                                        .in('Id', ids);
                                                    
                                                    if (!error && data) {
                                                        setLivePetsData(data);
                                                        const validIds = data
                                                            .filter(p => !['на лікуванні', 'вже вдома', 'не вдалось врятувати', 'заброньована', 'заброньовано'].includes(p.Status?.trim().toLowerCase()))
                                                            .map(p => p.Id);
                                                        setSelectedPetIds(validIds);
                                                    }
                                                }
                                                setIsFetchingLive(false);
                                                setShowForm(true);
                                            }
                                        }}>
                                            {isFetchingLive ? '⏳ Перевірка...' : 'Прихистити'}
                                        </button>
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
                                        <h4 className="form-step-title">Крок 1: Оберіть тваринок для прихистку</h4>
                                        <div className="adoption-pet-selection-list">
                                            {livePetsData.map(pet => {
                                                const isUnavailable = ['на лікуванні', 'вже вдома', 'не вдалось врятувати', 'заброньована', 'заброньовано'].includes(pet.Status?.trim().toLowerCase());
                                                return (
                                                    <div key={pet.Id} className={`selection-pet-item ${isUnavailable ? 'unavailable' : ''}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            id={`select-pet-${pet.Id}`}
                                                            checked={selectedPetIds.includes(pet.Id)}
                                                            disabled={isUnavailable}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPetIds([...selectedPetIds, pet.Id]);
                                                                } else {
                                                                    setSelectedPetIds(selectedPetIds.filter(id => id !== pet.Id));
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`select-pet-${pet.Id}`} className="selection-pet-label">
                                                            <span><strong>{pet.Name}</strong></span>
                                                            {isUnavailable ? (
                                                                <span className="unavail-badge">({pet.Status}) — недоступно</span>
                                                            ) : (
                                                                <span className="avail-badge">({pet.Status || 'Шукає дім'}) — доступно</span>
                                                            )}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="form-step">
                                        <h4 className="form-step-title">Крок 2: Ваші контакти</h4>
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
                                        <input 
                                            type="text" 
                                            placeholder="+38(0__) ___ __ __" 
                                            value={adopterPhone} 
                                            onChange={handlePhoneChange} 
                                            onFocus={() => {
                                                if (adopterPhone === '') setAdopterPhone('+38(0');
                                            }}
                                            onBlur={() => {
                                                if (adopterPhone === '+38(0') setAdopterPhone('');
                                            }}
                                            required 
                                        />
                                    </div>

                                    <div className="form-step">
                                        <h4 className="form-step-title">Крок 3: Умови проживання</h4>
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
                                        <h4 className="form-step-title">Крок 4: Додатково</h4>
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
        </header>
    );
}

export default UserHeader;