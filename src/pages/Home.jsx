import { useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  // 👇 Магія React: Стан для слайдера
  // images - це список картинок з папки public
  const images = ['/dog.png', '/cat.png', '/dog2.png', '/cat2.png', '/dog3.png'];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Функція для перемикання слайдів
  const changeImage = (direction) => {
    let newIndex = currentIndex + direction;
    
    // Якщо дійшли до кінця - повертаємось на початок
    if (newIndex >= images.length) newIndex = 0;
    // Якщо пішли назад з початку - йдемо в кінець
    if (newIndex < 0) newIndex = images.length - 1;
    
    setCurrentIndex(newIndex);
  };

  return (
    <div className="hero">
        <div className="hero-left">
            <div className="call-to-action-container">
    <Link to="/pets" style={{ textDecoration: 'none' }}>
        <div className="call-to-action">
            Знайди свого улюбленця
            {/* 👇 Додаємо нашу лапку сюди 👇 */}
            <div className="blinking-paw"></div>
        </div>
    </Link>
</div>
            
            <div className="stats-container">
                <div className="stat-item">
                    <span className="stat-text">Врятовано понад</span>
                    <span className="stat-number">42 000</span>
                </div>
                <div className="stat-item">
                    <span className="stat-text">Знайшли люблячий дім</span>
                    <span className="stat-number">17 000</span>
                </div>
                <div className="stat-item stats-full-width">
                    <span className="stat-text">Одужали та реабілітувалися</span>
                    <span className="stat-number">35 000</span>
                </div>
            </div>
        </div>

        <div className="hero-right">
            <div className="image-slider">
                {/* 👇 Тут картинка змінюється залежно від currentIndex */}
                <img 
                    src={images[currentIndex]} 
                    alt="Happy pet" 
                    className="slider-image" 
                />
                
                {/* Кнопки перемикання */}
                <button className="slider-nav prev" onClick={() => changeImage(-1)}>&lt;</button>
                <button className="slider-nav next" onClick={() => changeImage(1)}>&gt;</button>
                
                <div className="cta-text-right">
                    Ці цифри ростуть з кожним днем, стань частиною нашої родини!
                </div>
            </div>
        </div>
    </div>
  );
}

export default Home;