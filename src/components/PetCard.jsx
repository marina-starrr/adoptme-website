import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 Додали імпорт Link
import './PetCard.css';

function PetCard({ id, name, image, age, gender, tags }) {
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

  // Оновлена функція з блокуванням переходу
  const toggleFavorite = (e) => {
    e.preventDefault(); // 👈 Зупиняємо стандартну поведінку
    e.stopPropagation(); // 👈 Блокуємо клік, щоб він не передався на фотографію під сердечком

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
            {/* 👈 Робимо фотографію клікабельною */}
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
            
            {/* 👈 Додана кнопка "Детальніше" */}
            <Link to={`/pets/${id}`} className="pet-details-btn">
                Детальніше &raquo;
            </Link>
        </div>
    </div>
  );
}

export default PetCard;