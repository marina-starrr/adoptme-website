import { useParams, Link } from 'react-router-dom';
import { petsData } from '../data/petsData';

function PetDetails() {
  const { id } = useParams(); // Отримуємо id з URL (напр. 'mars')
  
  // Шукаємо тваринку в нашому списку за ID
  const pet = petsData.find(p => p.id === id);

  if (!pet) {
    return <h2>Тваринку не знайдено 🐾</h2>;
  }

  return (
    <div className="fade-view" style={{ padding: '100px 5%' }}>
      <Link to="/pets">← Назад до списку</Link>
      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        <img src={pet.image} alt={pet.name} style={{ width: '400px', borderRadius: '20px' }} />
        <div>
          <h1>{pet.name}</h1>
          <p><strong>Порода:</strong> {pet.breed}</p>
          <p>{pet.description}</p>
          {/* Тут згодом буде кнопка "Подати заявку" */}
        </div>
      </div>
    </div>
  );
}

export default PetDetails;