import { useState, useEffect } from 'react';
import PetCard from '../components/PetCard';

function Pets() {
  const [petsList, setPetsList] = useState([]);

  useEffect(() => {
    // 👇 ЗАМІНИ ПОРТ НА СВІЙ (той, що у чорному вікні C#)
    fetch(`${import.meta.env.VITE_API_URL}/api/pets`)
      .then(res => res.json())
      .then(data => setPetsList(data))
      .catch(err => console.error("Помилка:", err));
  }, []);

  return (
    <div className="pets-section">
        <div className="pets-title-container">
            Знайди свого найкращого друга
        </div>

        {/* Якщо база пуста або сервер вимкнений */}
        {petsList.length === 0 && <p>Завантаження пухнастиків...</p>}

        <div className="pet-grid">
            {petsList.map((pet) => (
                <PetCard 
                    key={pet.id}
                    id={pet.id}
                    name={pet.name}
                    image={pet.image} // Переконайся, що імена файлів в базі співпадають з файлами в public
                    age={pet.age}
                    gender={pet.gender}
                    tags={pet.tags}
                />
            ))}
        </div>
    </div>
  );
}

export default Pets;