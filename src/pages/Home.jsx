import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const images = ['/dog.png', '/cat.png', '/dog2.png', '/cat2.png', '/dog3.png'];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Функція для ручного або автоматичного перемикання слайдів
  const changeImage = (direction) => {
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + direction;
      if (newIndex >= images.length) newIndex = 0;
      if (newIndex < 0) newIndex = images.length - 1;
      return newIndex;
    });
  };

  // 👇 НОВЕ: Магія автоматичного перемикання (Автопілот)
  useEffect(() => {
    // Встановлюємо таймер, який викликає зміну картинки кожні 4 секунди
    const sliderTimer = setInterval(() => {
      changeImage(1);
    }, 4000);

    // Очищаємо таймер, якщо користувач пішов з головної сторінки
    return () => clearInterval(sliderTimer);
  }, []);

  return (
    <div className="hero">
        <div className="hero-left">
            <div className="call-to-action-container">
                <Link to="/pets" style={{ textDecoration: 'none' }}>
                    <div className="call-to-action">
                        Знайди свого улюбленця
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
                {/* 👇 НОВЕ: Виводимо всі картинки, але активною робимо тільки одну */}
                {images.map((imgSrc, index) => (
                    <img 
                        key={index}
                        src={imgSrc} 
                        alt="Happy pet" 
                        // Додаємо клас 'active', якщо індекс збігається з поточним
                        className={`slider-image ${index === currentIndex ? 'active' : ''}`} 
                    />
                ))}
                
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