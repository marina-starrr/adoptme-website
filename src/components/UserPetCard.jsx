import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // 👈 ОБОВ'ЯЗКОВО додали імпорт бази даних
import './UserPetCard.css';

function UserPetCard({ id, name, image, age, gender, tags }) {
    const [isFavorite, setIsFavorite] = useState(false);

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

    // 👇 Зробили функцію асинхронною (async) для роботи з БД
    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const userNickname = localStorage.getItem('userNickname');
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        if (isFavorite) {
            // 🔴 ВИДАЛЯЄМО З ОБРАНОГО
            if (userEmail) {
                // Якщо юзер авторизований, видаляємо з бази Supabase
                await supabase.from('Favorites').delete().eq('UserEmail', userEmail).eq('PetId', id);
            }
            favorites = favorites.filter(pet => pet.id !== id);
        } else {
            // 🟢 ДОДАЄМО В ОБРАНЕ
            if (userEmail) {
                // Якщо юзер авторизований, записуємо в базу Supabase
                await supabase.from('Favorites').insert([{ UserEmail: userEmail, PetId: id }]);
            }
            favorites.push({ id, name, image });
        }

        // Завжди дублюємо в localStorage для миттєвої реакції інтерфейсу
        localStorage.setItem('favorites', JSON.stringify(favorites));
        setIsFavorite(!isFavorite);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    return (
        <div className="pet-card">
            <div className="pet-card-image-container">
                <Link to={`/pets/${id}`} style={{ display: 'block', height: '100%' }}>
                    <img src={image} alt={name} className="pet-card-image" />
                </Link>

                <h3 className="pet-name">{name}</h3>

                <img
                    src={isFavorite ? "/heart2.png" : "/heart.png"}
                    alt="Like"
                    className="favorite-heart"
                    onClick={toggleFavorite}
                />
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