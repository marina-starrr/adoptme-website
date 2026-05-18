import { useState, useEffect } from 'react'; 
import { useLocation, Link } from 'react-router-dom'; // 👈 Додали useLocation та Link
import BackgroundPaws from '../components/BackgroundPaws'; 
import './Home.css';

function Home() {
  const location = useLocation(); // 👈 Ловимо перехід з логіну
  const [toastMsg, setToastMsg] = useState(''); // 👈 Стан для тексту плашки

  const sliderPets = [
    { src: '/mars1.png', id: 1 }, 
    { src: '/bagir1.png', id: 2 },
    { src: '/nensi1.png', id: 3 },
    { src: '/momo1.png', id: 4 },
    { src: '/kamila1.png', id: 5 }
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // 👇 Ефект для відстеження повідомлення при вході
  useEffect(() => {
    if (location.state?.welcomeMsg) {
      setToastMsg(location.state.welcomeMsg);

      // Плашка зникне сама через 3 секунди
      const timer = setTimeout(() => {
        setToastMsg('');
      }, 3000);

      // Очищаємо історію, щоб повідомлення не вилазило знову при оновленні сторінки (F5)
      window.history.replaceState({}, document.title);

      return () => clearTimeout(timer);
    }
  }, [location]);

  // Функція для ручного або автоматичного перемикання слайдів
  const changeImage = (direction) => {
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + direction;
      if (newIndex >= sliderPets.length) newIndex = 0;
      if (newIndex < 0) newIndex = sliderPets.length - 1;
      return newIndex;
    });
  };

  // Магія автоматичного перемикання (Автопілот)
  useEffect(() => {
    const sliderTimer = setInterval(() => {
      changeImage(1);
    }, 4000);

    return () => clearInterval(sliderTimer);
  }, []);

  return (
    <div className="hero page-transition" style={{ position: 'relative' }}>
        
        {/* 🟢 НАШЕ КРАСИВЕ СПЛИВАЮЧЕ ПОВІДОМЛЕННЯ ДЛЯ КОРИСТУВАЧА */}
        {toastMsg && (
            <div className="custom-toast">
                {toastMsg}
            </div>
        )}

        {/* 👇 Вмикаємо лапки для головної сторінки! */}
        <BackgroundPaws />

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
                <Link to={`/pets/${sliderPets[currentIndex].id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    {sliderPets.map((pet, index) => (
                        <img 
                            key={index}
                            src={pet.src} 
                            alt="Happy pet" 
                            className={`slider-image ${index === currentIndex ? 'active' : ''}`} 
                        />
                    ))}
                </Link>
                
                <button className="slider-nav prev" onClick={(e) => { e.preventDefault(); changeImage(-1); }}>&lt;</button>
                <button className="slider-nav next" onClick={(e) => { e.preventDefault(); changeImage(1); }}>&gt;</button>
                
                <div className="cta-text-right">
                    Ці цифри ростуть з кожним днем, стань частиною нашої родини!
                </div>
            </div>
        </div>
    </div>
  );
}

export default Home;