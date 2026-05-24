import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import BackgroundPaws from '../components/BackgroundPaws';
import './Home.css';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

// 🌟 МІНІ-КОМПОНЕНТ ДЛЯ КАРТКИ ЗІ СЛАЙДЕРОМ
function LuckyCard({ pet }) {
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 Щоб клік по стрілочці не перекидав на іншу сторінку
    setImgIndex((prev) => (prev + 1) % pet.images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 Щоб клік по стрілочці не перекидав на іншу сторінку
    setImgIndex((prev) => (prev - 1 + pet.images.length) % pet.images.length);
  };

  return (
    <div className="lucky-card">
      <div className="lucky-card-img-slider">
        {/* 🌟 ДОДАНО: Робимо фото клікабельним */}
        <Link to={`/pets/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
            <img src={pet.images[imgIndex]} alt={pet.petName} className="lucky-main-img" />
        </Link>

        {/* Показуємо стрілочки тільки якщо фотографій більше однієї */}
        {pet.images.length > 1 && (
          <>
            <button className="mini-nav prev" onClick={prevImg}>‹</button>
            <button className="mini-nav next" onClick={nextImg}>›</button>

            {/* Крапочки-індикатори знизу фото */}
            <div className="mini-dots">
              {pet.images.map((_, i) => (
                <span key={i} className={`dot ${i === imgIndex ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="lucky-card-info">
        <h3>
            {/* 🌟 ДОДАНО: Робимо ім'я клікабельним */}
            <Link to={`/pets/${pet.id}`} className="lucky-name-link">
                {pet.petName}
            </Link> 
            <span className="owner-name"> та {pet.ownerName}</span>
        </h3>
        <p className="lucky-review">"{pet.text}"</p>
      </div>
    </div>
  );
}

function Home() {
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState('');
  const [happyPets, setHappyPets] = useState([]);

  const sliderPets = [
    { src: '/mars1.png', id: 1 },
    { src: '/bagir1.png', id: 2 },
    { src: '/nensi1.png', id: 3 },
    { src: '/momo1.png', id: 4 },
    { src: '/kamila1.png', id: 5 }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (location.state?.welcomeMsg) {
      setToastMsg(location.state.welcomeMsg);
      const timer = setTimeout(() => {
        setToastMsg('');
      }, 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    const fetchHappyPets = async () => {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .eq('Status', 'Вже вдома')
        .order('Id', { ascending: false })
        .limit(8);

      if (!error && data) {
        const formattedPets = data.map(pet => {
          let images = [];
          if (pet.Images && Array.isArray(pet.Images)) {
            images = pet.Images.map(img => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${img}`);
          } else {
            images = [`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`];
          }

          return {
            id: pet.Id,
            petName: pet.Name,
            ownerName: pet.OwnerName || "Нова сім'я",
            text: pet.Description || "Знайшов свій дім!",
            images: images
          };
        });
        setHappyPets(formattedPets);
      }
    };
    fetchHappyPets();
  }, []);

  const changeImage = (direction) => {
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + direction;
      if (newIndex >= sliderPets.length) newIndex = 0;
      if (newIndex < 0) newIndex = sliderPets.length - 1;
      return newIndex;
    });
  };

  useEffect(() => {
    const sliderTimer = setInterval(() => {
      changeImage(1);
    }, 4000);
    return () => clearInterval(sliderTimer);
  }, []);

  return (
    <>
      <div className="hero" style={{ position: 'relative' }}>

        {toastMsg && (
          <div className="custom-toast">
            {toastMsg}
          </div>
        )}

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

      {/* 🌟 СЕКЦІЯ: ЩАСЛИВЧИКИ */}
      {happyPets.length > 0 && (
        <section className="lucky-section">
          <h2 className="lucky-title">Вони вже знайшли свій дім 🏡</h2>

          <div className="lucky-marquee-container">
            <div className="lucky-marquee-track">
              {/* Для стабільної анімації дублюємо масив */}
              {[...happyPets, ...happyPets, ...happyPets].map((pet, index) => (
                <LuckyCard key={`${pet.id}-${index}`} pet={pet} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Home;