import { useState, useEffect } from 'react';

function PetCard({ id, name, image, age, gender, tags }) {
  // 1. Оголошуємо стан для сердечка
  const [isFavorite, setIsFavorite] = useState(false);

  // 2. Перевіряємо, чи є тваринка в обраному при завантаженні сторінки
  useEffect(() => {
    const checkFavoriteStatus = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      const isFav = favorites.some(pet => pet.id === id);
      setIsFavorite(isFav);
    };

    // Перевіряємо одразу
    checkFavoriteStatus();

    // Вчимо сердечко слухати події (коли тваринку видаляють з кошика)
    window.addEventListener('cartUpdated', checkFavoriteStatus);
    
    return () => {
      window.removeEventListener('cartUpdated', checkFavoriteStatus);
    };
  }, [id]);

  // 3. Функція кліку по сердечку
  const toggleFavorite = () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (isFavorite) {
      favorites = favorites.filter(pet => pet.id !== id); // Видаляємо
    } else {
      favorites.push({ id, name, image }); // Додаємо
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite); // Змінюємо колір сердечка

    // Повідомляємо всьому сайту, що кошик оновився!
    window.dispatchEvent(new Event('cartUpdated')); 
  };

  return (
    <div className="pet-card">
        <div className="pet-card-image-container">
            <img src={image} alt={name} className="pet-card-image" />
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
        </div>
    </div>
  );
}

export default PetCard;