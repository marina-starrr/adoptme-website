import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 1. Додали імпорт контексту
import './PetCard.css';

function PetCard({ id, name, image, age, gender, tags }) {
  const { isAdmin } = useAuth(); // 👈 2. Дістаємо статус адміна
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

  const toggleFavorite = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (isFavorite) {
      favorites = favorites.filter(pet => pet.id !== id);
    } else {
      favorites.push({ id, name, image });
    }

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
            
            {/* 👇 3. УМОВА: Показувати сердечко ТІЛЬКИ якщо НЕ адмін (!isAdmin) */}
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

export default PetCard;