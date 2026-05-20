import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './UserPetCard.css';
import { useAuth } from '../context/AuthContext';

// 👇 Додали проп status (за замовчуванням "Шукає дім")
function UserPetCard({ id, name, age, gender, tags, image, isAdmin, status = "Шукає дім" }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const { userEmail } = useAuth();

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

    // 🌟 Розумна функція для визначення стилю та іконки бейджа
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

    return (
        <div className="pet-card">
            <div className="pet-card-image-container">
                <Link to={`/pets/${id}`} style={{ display: 'block', height: '100%' }}>
                    <img src={image} alt={name} className="pet-card-image" />
                </Link>

                <h3 className="pet-name">{name}</h3>

                {/* 🌟 БЕЙДЖ СТАТУСУ */}
                <div className={`pet-status-badge ${statusConfig.class}`}>
                    {statusConfig.icon} {status}
                </div>

                {!isAdmin && (
                    <img
                        src={isFavorite ? "/heart2.png" : "/heart.png"}
                        alt="Like"
                        className="favorite-heart"
                        onClick={toggleFavorite}
                    />
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