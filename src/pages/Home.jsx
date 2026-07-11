import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

function LuckyCard({ pet }) {
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % pet.images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + pet.images.length) % pet.images.length);
  };

  return (
    <div className="lucky-card">
      <div className="lucky-card-img-slider">
        <Link to={`/pets/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          <img src={pet.images[imgIndex]} alt={pet.petName} className="lucky-main-img" />
        </Link>

        {pet.images.length > 1 && (
          <>
            <button className="mini-nav prev" onClick={prevImg}>‹</button>
            <button className="mini-nav next" onClick={nextImg}>›</button>

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
          <Link to={`/pets/${pet.id}`} className="lucky-name-link">
            {pet.petName}
          </Link>
          <span className="owner-name"> та {pet.ownerName}</span>
        </h3>
        <div className="lucky-review-box">
          <p className="lucky-review">{pet.text}</p>
          {pet.text && pet.text.length > 100 && (
            <Link to={`/pets/${pet.id}`} className="read-more-link">
              Читати далі »
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Home() {
  const location = useLocation();
  const { showToast } = useToast();

  const [happyPets, setHappyPets] = useState([]);

  const [allNewArrivals, setAllNewArrivals] = useState([]);
  const [filteredNewPets, setFilteredNewPets] = useState([]);
  const [dynamicTypes, setDynamicTypes] = useState([]);
  const [newTypeNames, setNewTypeNames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Всі');

  const sliderPets = [
    { src: '/mars1.png', id: 1 },
    { src: '/karen1.png', id: 2 },
    { src: '/nensi1.png', id: 3 },
    { src: '/kamila1.png', id: 4 },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (location.state?.welcomeMsg) {
      showToast(location.state.welcomeMsg);
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);

  useEffect(() => {
    const fetchHappyPets = async () => {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .eq('Status', 'Вже вдома')
        .order('Id', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Помилка завантаження щасливчиків:", error);
        return;
      }

      if (data) {
        const visiblePetsData = data.filter(pet => pet.ShowInLucky !== false).slice(0, 8);

        const formattedPets = visiblePetsData.map(pet => {
          let images = [];
          if (pet.Images && Array.isArray(pet.Images) && pet.Images.length > 0) {
            images = pet.Images.map(img => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${img}`);
          } else if (pet.ImageName) {
            images = [`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`];
          } else {
            images = ['/placeholder.png'];
          }

          return {
            id: pet.Id,
            petName: pet.Name,
            ownerName: pet.OwnerName ? pet.OwnerName.split(' ')[0] : "Нова сім'я",
            text: pet.HomeDescription || "Знайшов свій дім!",
            images: images
          };
        });
        setHappyPets(formattedPets);
      }
    };

    const fetchNewArrivals = async () => {
      const { data, error } = await supabase.from('Pets').select('*');

      if (!error && data) {
        const getPastDateString = (daysAgo) => {
          const d = new Date();
          d.setDate(d.getDate() - daysAgo);
          return d.toISOString().split('T')[0];
        };

        const todayStr = new Date().toISOString().split('T')[0];
        const weekAgoStr = getPastDateString(7);

        const arrivals = data.filter(pet => {
          if (pet.Status === 'Вже вдома') return false;
          return pet.ArrivalDate >= weekAgoStr && pet.ArrivalDate <= todayStr;
        });

        arrivals.sort((a, b) => b.Id - a.Id);

        setAllNewArrivals(arrivals);
        setFilteredNewPets(arrivals);

        const typesInNewArrivals = [...new Set(arrivals.map(p => p.Type).filter(Boolean))];
        setDynamicTypes(typesInNewArrivals);

        const completelyNewTypes = typesInNewArrivals.filter(type => {
          const hasOldPets = data.some(pet => pet.Type === type && pet.ArrivalDate < weekAgoStr);
          return !hasOldPets;
        });

        setNewTypeNames(completelyNewTypes);
      }
    };

    fetchHappyPets();
    fetchNewArrivals();
  }, []);

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

  const getNewPetImg = (pet) => {
    const firstImg = (pet.Images && pet.Images.length > 0) ? pet.Images[0] : pet.ImageName;
    return firstImg
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${firstImg}`
      : '/placeholder.png';
  };

  const handleCategoryClick = (type) => {
    setSelectedCategory(type);
    if (type === 'Всі') {
      setFilteredNewPets(allNewArrivals);
    } else {
      setFilteredNewPets(allNewArrivals.filter(pet => pet.Type === type));
    }
  };

  return (
    <div className="hero">
        <div className="hero-left">
          <div className="call-to-action-container">
            <Link to="/pets" style={{ textDecoration: 'none' }}>
              <div className="call-to-action">
                <span className="cta-main-text">Знайди свого <br /> улюбленця</span>
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

      {allNewArrivals.length > 0 && (
        <>
          <div className="page-separator"><span>🐾</span></div>

          <section className="home-news-section">
            <div className="section-header">
              <div className="brush-title-container">Наші новинки</div>
              <p className="news-section-subtitle">Ці хвостики щойно прибули до притулку і дуже чекають на знайомство</p>
            </div>

            <div className="news-categories-badges">
              <button
                className={`news-type-badge ${selectedCategory === 'Всі' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('Всі')}
              >
                Всі хвостики
              </button>
              {dynamicTypes.map((type) => (
                <button
                  key={type}
                  className={`news-type-badge ${selectedCategory === type ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(type)}
                >
                  {type}
                  {newTypeNames.includes(type) && <span className="type-new-tag">✨ Новинка</span>}
                </button>
              ))}
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