import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import BackgroundPaws from '../components/BackgroundPaws';
import './Home.css';
import { supabase } from '../supabaseClient';

// 🌟 НОВИЙ МІНІ-КОМПОНЕНТ ДЛЯ КАРТКИ ЗІ СЛАЙДЕРОМ
function LuckyCard({ pet }) {
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e) => {
    e.preventDefault();
    setImgIndex((prev) => (prev + 1) % pet.images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    setImgIndex((prev) => (prev - 1 + pet.images.length) % pet.images.length);
  };

  return (
    <div className="lucky-card">
      <div className="lucky-card-img-slider">
        <img src={pet.images[imgIndex]} alt={pet.petName} className="lucky-main-img" />

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
        <h3>{pet.petName} <span className="owner-name">та {pet.ownerName}</span></h3>
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

  // 🌟 ОНОВЛЕНІ ДАНІ: Тепер тут масив фотографій (images)
  const luckyPets = [
    { id: 1, petName: "Марс", ownerName: "Олена", text: "Марс — це наше маленьке руде диво! Він обожнює спати на ручках і муркотіти. Дякую за нового члена сім'ї! ❤️", images: ["/mars1.png", "/mars1.png"] },
    { id: 2, petName: "Багіра", ownerName: "Максим", text: "Справжня пантера! Спочатку трохи боялася, але тепер це найласкавіша кішка у світі. Ми її дуже любимо.", images: ["/bagir1.png", "/bagir1.png"] },
    { id: 3, petName: "Ненсі", ownerName: "Сім'я Коваленків", text: "Діти просто в захваті. Ненсі стала найкращим другом для нашого сина. Вона дуже розумна та грайлива!", images: ["/nensi1.png", "/nensi1.png"] },
    { id: 4, petName: "Момо", ownerName: "Анна", text: "Момо — це суцільний позитив. Вже вивчив кілька команд і обожнює гуляти в парку. Дякуємо притулку!", images: ["/momo1.png", "/momo1.png"] },
    { id: 5, petName: "Каміла", ownerName: "Сергій", text: "Ніколи не думав, що собака може принести стільки щастя. Вона ідеально вписалася в наш ритм життя.", images: ["/kamila1.png", "/kamila1.png"] }
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
        .eq('Status', 'Вже вдома') // 👈 ФІЛЬТР: тільки щасливчики
        .order('Id', { ascending: false })
        .limit(6); // Обмежуємо до 6 тварин, щоб не перевантажувати сторінку

      if (!error && data) {
        // Формуємо масив, щоб він підходив під наш LuckyCard
        const formattedPets = data.map(pet => ({
          id: pet.Id,
          petName: pet.Name,
          ownerName: "Нова сім'я", // Тут можна додати поле в БД, якщо треба ім'я власника
          text: pet.Description || "Знайшов свій дім!",
          images: [`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`]
        }));
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
      <div className="hero page-transition" style={{ position: 'relative' }}>

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

      {/* 🌟 СЕКЦІЯ: ЩАСЛИВЧИКИ (Оновлена) */}
      {happyPets.length > 0 && (
        <section className="lucky-section">
          <h2 className="lucky-title">Вони вже знайшли свій дім 🏡</h2>

          <div className="lucky-marquee-container">
            <div className="lucky-marquee-track">
              {[...happyPets, ...happyPets].map((pet, index) => (
                <LuckyCard key={index} pet={pet} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Home;