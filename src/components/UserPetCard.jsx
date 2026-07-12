import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './UserPetCard.css';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // 👈 Додано контекст сповіщень

function UserPetCard({ id, name, age, gender, tags, image, isAdmin, status = "Шукає дім" }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    const { userEmail } = useAuth();

    // 👇 Підключаємо глобальні сповіщення
    const { showToast } = useToast();

    // Перевірка, чи тваринка в обраному
    useEffect(() => {
        const checkFavoriteStatus = () => {
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const isFav = favorites.some(pet => pet.id === id);
            setIsFavorite(isFav);
        };

        checkFavoriteStatus();
        window.addEventListener('cartUpdated', checkFavoriteStatus);

        return () => {
            window.removeEventListener('cartUpdated', checkFavoriteStatus);
        };
    }, [id]);

    // Перевірка, чи користувач вже підписаний на сповіщення про лікування
    useEffect(() => {
        const checkNotificationStatus = async () => {
            if (status === 'На лікуванні') {
                const userNickname = localStorage.getItem('userNickname');
                if (userNickname) {
                    const { data, error } = await supabase
                        .from('TreatmentNotifications')
                        .select('Id')
                        .eq('PetId', id)
                        .eq('UserNickname', userNickname);

                    if (data && data.length > 0) {
                        setIsNotified(true);
                    }
                }
            }
        };

        checkNotificationStatus();
    }, [id, status]);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const userNickname = localStorage.getItem('userNickname');
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        if (isFavorite) {
            if (userNickname) {
                const { error } = await supabase
                    .from('Favorites')
                    .delete()
                    .eq('UserNickname', userNickname)
                    .eq('PetId', id);

                if (error) console.error("❌ Помилка видалення з Favorites:", error.message);
            }
            favorites = favorites.filter(pet => pet.id !== id);
        } else {
            if (userNickname) {
                const { error } = await supabase.from('Favorites').insert([
                    {
                        PetId: id,
                        UserNickname: userNickname
                    }
                ]);

                if (error) console.error("❌ Помилка вставки в Favorites:", error.message);
            } else {
                console.warn("⚠️ Користувач не авторизований, зберігаємо лише локально.");
            }
            favorites.push({ id, name, image });
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
        setIsFavorite(!isFavorite);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleNotifyClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            showToast("🐾 Будь ласка, увійдіть в систему, щоб керувати сповіщеннями!");
            return;
        }

        if (isNotified) {
            const { error } = await supabase
                .from('TreatmentNotifications')
                .delete()
                .eq('PetId', id)
                .eq('UserNickname', userNickname);

            if (!error) {
                setIsNotified(false);
                showToast(`🔕 Ви скасували підписку на сповіщення про ${name}.`);
            } else {
                showToast("❌ Сталася помилка при відписці: " + error.message);
            }
        } else {
            const { error } = await supabase.from('TreatmentNotifications').insert([
                {
                    UserNickname: userNickname,
                    UserEmail: userEmail || null,
                    PetId: id,
                    PetName: name,
                    Status: 'Нова'
                }
            ]);

            if (!error) {
                setIsNotified(true);
                showToast(`🔔 Дякуємо! Ви отримаєте повідомлення, коли ${name} одужає.`);
            } else {
                showToast("❌ Сталася помилка при підписці: " + error.message);
            }
        }
    };

    const getStatusConfig = (petStatus) => {
        switch (petStatus) {
            case 'Особливий догляд': return { class: 'status-special', icon: '❤️‍🩹' };
            case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
            case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
            case 'Не вдалось врятувати': return { class: 'status-died', icon: '😞' };
            case 'Заброньована': case 'Заброньовано': return { class: 'status-reserved', icon: '🔒' };
            default: return { class: 'status-looking', icon: '🐾' };
        }
    };

    const statusConfig = getStatusConfig(status);

    const hideIcon = status === 'Вже вдома' || status === 'Не вдалось врятувати' || status === 'Заброньована' || status === 'Заброньовано';
    const showBell = status === 'На лікуванні';

    return (
        <div className="pet-card">
            <div className="pet-card-image-container">
                <Link to={`/pets/${id}`} style={{ display: 'block', height: '100%' }}>
                    <img src={image} alt={name} className="pet-card-image" />
                </Link>

                <h3 className="pet-name">{name}</h3>

                <div className={`pet-status-badge ${statusConfig.class}`}>
                    <span className="badge-icon">{statusConfig.icon}</span>
                    <span className="badge-text">{status}</span>
                </div>

                {!isAdmin && !hideIcon && (
                    showBell ? (
                        <img
                            src={isNotified ? "/bell-active.png" : "/bell.png"}
                            alt="Сповіщення"
                            className="action-icon"
                            onClick={handleNotifyClick}
                            title={isNotified ? "Відписатися від сповіщень" : "Повідомити, коли одужає"}
                        />
                    ) : (
                        <img
                            src={isFavorite ? "/heart2.png" : "/heart.png"}
                            alt="Like"
                            className="action-icon"
                            onClick={toggleFavorite}
                            title="Додати в обране"
                        />
                    )
                )}
            </div>

            <div className="pet-card-content">
                <div className="pet-info-row">
                    <div className="pet-info">
                        <img src="/1age.png" alt="Вік" /> {age}
                    </div>
                    <div className="pet-info">
                        <img src="/1стать.png" alt="Стать" /> {gender}
                    </div>
                </div>
                <div className="pet-info-chatacter">
                    {tags ? tags.split(/[#, ]+/).filter(t => t).map((tag, index) => (
                        <span key={index} className="pet-tag-pill">#{tag.trim()}</span>
                    )) : null}
                </div>

                <Link to={`/pets/${id}`} className="pet-details-btn">
                    Детальніше &raquo;
                </Link>
            </div>
        </div >
    );
}

export default UserPetCard;