import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Наш місток до бази

function PetDetails() {
  const { id } = useParams(); // Отримуємо ID з URL
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      setLoading(true);
      // Робимо запит до таблиці "Pets", де Id дорівнює параметру з URL
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .eq('Id', id)
        .single(); // Очікуємо лише один рядок

      if (error) {
        console.error("Помилка при завантаженні тваринки:", error.message);
      } else {
        setPet(data);
      }
      setLoading(false);
    }

    fetchPet();
  }, [id]);

  if (loading) return <h2 style={{ padding: '100px' }}>Шукаємо пухнастика в базі... 🐾</h2>;
  
  if (!pet) return <h2 style={{ padding: '100px' }}>Тваринку не знайдено 🐾</h2>;

  // Формуємо посилання на фото з твого бакета 'pets'
  const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`;

  return (
    <div className="fade-view" style={{ padding: '100px 5%' }}>
      <Link to="/pets" style={{ color: '#ff8fb1', textDecoration: 'none', fontWeight: 'bold' }}>
        ← Назад до списку
      </Link>

      <div style={{ display: 'flex', gap: '50px', marginTop: '30px', flexWrap: 'wrap' }}>
        <img 
          src={imageUrl} 
          alt={pet.Name} 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            borderRadius: '30px', 
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)' 
          }} 
        />
        
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 style={{ fontSize: '3rem', color: '#333' }}>{pet.Name}</h1>
          <p style={{ fontSize: '1.2rem', color: '#777' }}>
            <strong>Вік:</strong> {pet.Age}
          </p>
          <p style={{ fontSize: '1.2rem', color: '#777' }}>
            <strong>Стать:</strong> {pet.Gender}
          </p>
          
          <div style={{ margin: '20px 0' }}>
            {pet.Tags && pet.Tags.split('#').filter(t => t).map(tag => (
              <span key={tag} style={{ 
                background: '#fff0f3', 
                color: '#ff8fb1', 
                padding: '5px 15px', 
                borderRadius: '20px', 
                marginRight: '10px',
                fontSize: '0.9rem'
              }}>
                #{tag.trim()}
              </span>
            ))}
          </div>

          <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#555' }}>
            {pet.Description || "Цей чудовий пухнастик дуже чекає на люблячу родину!"}
          </p>

          <button style={{
            marginTop: '30px',
            padding: '15px 40px',
            background: '#ff8fb1',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Подати заявку на усиновлення
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetDetails;