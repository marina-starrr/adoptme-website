import { useState, useEffect } from 'react';
import PetCard from '../components/PetCard';
import { supabase } from '../supabaseClient'; // Імпортуємо налаштований клієнт
import './Pets.css';

function Pets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPets() {
      try {
        // Запит до таблиці "Pets" у Supabase
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

  // Функція для отримання прямого посилання на фото з бакета "pets"
  const getImageUrl = (fileName) => {
    if (!fileName) return '/placeholder-pet.png'; // Заглушка, якщо фото немає
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${fileName}`;
  };

  return (
    <div className="pets-section">
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
            image={getImageUrl(pet.ImageName)} // Формуємо URL для картинки
            age={pet.Age}
            gender={pet.Gender}
            tags={pet.Tags}
          />
        ))}
      </div>
    </div>
  );
}

export default Pets;