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
        <p className="lucky-review">"{pet.text}"</p>
      </div>
    </div>
  );
}

function Home() {
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState('');
  const [happyPets, setHappyPets] = useState([]);
  
  const [allNewArrivals, setAllNewArrivals] = useState([]); 
  const [filteredNewPets, setFilteredNewPets] = useState([]); 
  const [dynamicTypes, setDynamicTypes] = useState([]); 
  const [newTypeNames, setNewTypeNames] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('Всі'); 

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
            ownerName: pet.OwnerName || "Нова сім'я",
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
    <div className="home-page-container">
      {/* 👇 Глобальний контейнер для лапок, щоб вони були на фоні всієї сторінки */}
      <div className="fixed-background-paws">
        <BackgroundPaws />
      </div>

      {toastMsg && (
        <div className="custom-toast" style={{ zIndex: 9999 }}>
          {toastMsg}
        </div>
      )}

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
        <section className="home-news-section">
          <h2 className="news-section-title">Наші новинки 🌟</h2>
          <p className="news-section-subtitle">Ці хвостики щойно прибули до притулку за останній тиждень та дуже чекають на знайомство</p>
          
          <div className="news-categories-badges">
            <button 
               className={`news-type-badge ${selectedCategory === 'Всі' ? 'active' : ''}`}
               onClick={() => handleCategoryClick('Всі')}
            >
              📂 Всі новинки
            </button>
            {dynamicTypes.map((type) => (
              <button 
                 key={type} 
                 className={`news-type-badge ${selectedCategory === type ? 'active' : ''}`}
                 onClick={() => handleCategoryClick(type)}
              >
                📂 Розділ: {type}
                {newTypeNames.includes(type) && <span className="type-new-tag">✨ Новинка</span>}
              </button>
            ))}
          </div>

          <div className="news-pets-grid">
            {filteredNewPets.map((pet) => (
              <Link to={`/pets/${pet.Id}`} key={pet.Id} className="news-pet-card">
                <div className="news-card-img-wrapper">
                  <img src={getNewPetImg(pet)} alt={pet.Name} />
                  <span className="new-arrival-tag">Новенький 🐾</span>
                </div>
                <div className="news-card-details">
                  <h3>{pet.Name}</h3>
                  <div className="news-card-meta">
                    <span>{pet.Type}</span> • <span>{pet.Breed}</span>
                  </div>
                  <p className="news-card-age">Вік: {pet.Age}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {happyPets.length > 0 && (
        <section className="lucky-section">
          <h2 className="lucky-title">Вони вже знайшли свій дім 🏡</h2>

          <div className="lucky-marquee-container">
            <div className="lucky-marquee-track">
              {[...happyPets, ...happyPets, ...happyPets].map((pet, index) => (
                <LuckyCard key={`${pet.id}-${index}`} pet={pet} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;