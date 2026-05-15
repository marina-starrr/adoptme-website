import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; 
import BackgroundPaws from '../components/BackgroundPaws'; // 👈 1. Імпортуємо

function PetDetails() {
  const { id } = useParams(); 
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      setLoading(true);
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .eq('Id', id)
        .single(); 

      if (error) {
        console.error("Помилка при завантаженні тваринки:", error.message);
      } else {
        setPet(data);
      }
      setLoading(false);
    }

    fetchPet();
  }, [id]);

  if (loading) return <h2 style={{ padding: '100px', textAlign: 'center', color: '#4A148C' }}>Шукаємо пухнастика в базі... 🐾</h2>;
  
  if (!pet) return <h2 style={{ padding: '100px', textAlign: 'center', color: '#4A148C' }}>Тваринку не знайдено 🐾</h2>;

  const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`;

  const handleAdoptClick = () => {
    // 1. Беремо поточний список обраних з пам'яті браузера
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    // 2. Перевіряємо, чи тваринка вже є в "Кошику/Обраному"
    const isAlreadyFav = favorites.some(fav => fav.id === pet.Id);

    if (!isAlreadyFav) {
        favorites.push({
            id: pet.Id,
            name: pet.Name,
            image: imageUrl
        });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        window.dispatchEvent(new Event('cartUpdated'));
    }
    window.dispatchEvent(new Event('openFavorites'));
  };

  return (
    <div className="page-transition">
    <div className="fade-view" style={{ padding: '100px 5%', position: 'relative', zIndex: 2 }}>
      
      {/* 👇 2. Викликаємо лапки і передаємо їм наш клас для прозорості! */}
      <BackgroundPaws customClass="details-paws" />

      <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/pets">← Назад до списку</Link>

      <div style={{ display: 'flex', gap: '50px', marginTop: '30px', flexWrap: 'wrap' }}>
        <img 
          src={imageUrl} 
          alt={pet.Name} 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            borderRadius: '30px', 
            boxShadow: '0 15px 35px rgba(104, 71, 221, 0.2)', /* Фіолетова тінь */
            objectFit: 'cover'
          }} 
        />
        
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#4A148C', marginBottom: '10px' }}>{pet.Name}</h1>
          <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '5px' }}>
            <strong>Вік:</strong> {pet.Age}
          </p>
          <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '20px' }}>
            <strong>Стать:</strong> {pet.Gender}
          </p>
          
          <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {pet.Tags && pet.Tags.split('#').filter(t => t).map(tag => (
              <span key={tag} style={{ 
                background: '#EFE6FF', /* Світло-фіолетовий фон тегів */
                color: '#6847DD',      /* Темно-фіолетовий текст */
                padding: '8px 20px', 
                borderRadius: '25px', 
                fontWeight: 'bold',
                fontSize: '0.9rem',
                border: '1px solid rgba(104, 71, 221, 0.3)'
              }}>
                #{tag.trim()}
              </span>
            ))}
          </div>

          <p style={{ lineHeight: '1.8', fontSize: '1.15rem', color: '#444', marginTop: '20px' }}>
            {pet.Description || "Цей чудовий пухнастик дуже чекає на люблячу родину!"}
          </p>

          <button onClick={handleAdoptClick}
           style={{
            marginTop: '40px',
            padding: '18px 45px',
            background: '#6847DD', /* Твій фірмовий колір */
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 8px 20px rgba(104, 71, 221, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 12px 25px rgba(104, 71, 221, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(104, 71, 221, 0.4)';
          }}
          >
            Подати заявку на усиновлення
          </button>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}

export default PetDetails;