import { useState, useEffect } from 'react';
import PetCard from '../components/PetCard';
import BackgroundPaws from '../components/BackgroundPaws'; // 👈 1. Імпортуємо наш компонент
import { supabase } from '../supabaseClient';
import './Pets.css';

function Pets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPets() {
      try {
        const { data, error } = await supabase
          .from('Pets')
          .select('*');

        if (error) throw error;
        setPetsList(data);
      } catch (err) {
        console.error("Помилка завантаження:", err.message);
      } finally {
        setLoading(false);
      }
    }

    getPets();
  }, []);

  const getImageUrl = (fileName) => {
    if (!fileName) return '/placeholder-pet.png';
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${fileName}`;
  };

  return (
    <div className="page-transition">
      <div className="pets-section">

        {/* 👇 2. Викликаємо лапки одним рядком! */}
        <BackgroundPaws />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="pets-title-container">
            Знайди свого найкращого друга
          </div>
          {loading && <p>Завантаження пухнастиків...</p>}

          {!loading && petsList.length === 0 && (
            <p>Наразі в притулку немає хвостиків, але скоро вони з'являться!</p>
          )}

          <div className="pet-grid">
            {petsList.map((pet) => (
              <PetCard
                key={pet.Id}
                id={pet.Id}
                name={pet.Name}
                image={getImageUrl(pet.ImageName)}
                age={pet.Age}
                gender={pet.Gender}
                tags={pet.Tags}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pets;