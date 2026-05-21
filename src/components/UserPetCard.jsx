import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './UserPetCard.css';
import { useAuth } from '../context/AuthContext';

function UserPetCard({ id, name, age, gender, tags, image, isAdmin, status = "Шукає дім" }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    const { userEmail } = useAuth();

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
                    const { data } = await supabase
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

    // Логіка додавання в обране
    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const userNickname = localStorage.getItem('userNickname');
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        if (isFavorite) {
            if (userEmail) {
                await supabase.from('Favorites').delete().eq('UserEmail', userEmail).eq('PetId', id);
            }
            favorites = favorites.filter(pet => pet.id !== id);
        } else {
            if (userEmail) {
                await supabase.from('Favorites').insert([{ UserEmail: userEmail, PetId: id }]);
            }
            favorites.push({ id, name, image });
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
        setIsFavorite(!isFavorite);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // 🌟 Оновлена логіка підписки/відписки на сповіщення про лікування
    const handleNotifyClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            alert("🐾 Будь ласка, увійдіть в систему, щоб керувати сповіщеннями!");
            return;
        }

        if (isNotified) {
            // Якщо вже підписаний — ВІДПИСУЄМОСЯ
            const { error } = await supabase
                .from('TreatmentNotifications')
                .delete()
                .eq('PetId', id)
                .eq('UserNickname', userNickname);

            if (!error) {
                setIsNotified(false);
                alert(`🔕 Ви скасували підписку на сповіщення про ${name}.`);
            } else {
                alert("❌ Сталася помилка при відписці: " + error.message);
            }
        } else {
            // Якщо не підписаний — ПІДПИСУЄМОСЯ
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
                alert(`🔔 Дякуємо! Ви отримаєте повідомлення, коли ${name} одужає.`);
            } else {
                alert("❌ Сталася помилка при підписці: " + error.message);
            }
        }
    };

    // Визначення стилю та іконки бейджа
    const getStatusConfig = (petStatus) => {
        switch(petStatus) {
            case 'Потребує особливого догляду': return { class: 'status-special', icon: '❤️‍🩹' };
            case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
            case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
            case 'Не вдалось врятувати': return { class: 'status-rainbow', icon: '🌈' };
            default: return { class: 'status-looking', icon: '🐾' }; // Шукає дім
        }
    };

    const statusConfig = getStatusConfig(status);

    // Змінні для керування відображенням іконок
    const hideIcon = status === 'Вже вдома' || status === 'Не вдалось врятувати';
    const showBell = status === 'На лікуванні';

    return (
        <div className="pet-card">
            <div className="pet-card-image-container">
                <Link to={`/pets/${id}`} style={{ display: 'block', height: '100%' }}>
                    <img src={image} alt={name} className="pet-card-image" />
                </Link>

                <h3 className="pet-name">{name}</h3>

                <div className={`pet-status-badge ${statusConfig.class}`}>
                    {statusConfig.icon} {status}
                </div>

                {/* Логіка відображення іконок (Сердечко / Дзвіночок / Нічого) */}
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
                    {tags}
                </div>

                <Link to={`/pets/${id}`} className="pet-details-btn">
                    Детальніше &raquo;
                </Link>
            </div>
        </div>
    );
}

export default UserPetCard;