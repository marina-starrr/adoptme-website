import { useState, useEffect } from 'react';
import PetCard from '../components/UserPetCard'; // Використовуй UserPetCard, який ми зробили раніше
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient';
import './UserPets.css';

function UserPets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchPets(); 
  }, []);

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .order('Id', { ascending: true });
      
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) { 
      console.error("Помилка завантаження тварин:", err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  if (loading) return <h2 style={{ padding: '100px', textAlign: 'center', color: '#4A148C' }}>Шукаємо пухнастиків... 🐾</h2>;

  return (
    <div className="page-transition">
      <div className="pets-section">
        <BackgroundPaws />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="pets-title-container">Знайди свого найкращого друга</div>
          
          <div className="pet-grid">
            {petsList.map((pet) => (
              <div key={pet.Id} className="pet-card-wrapper">
                <PetCard 
                  {...pet} 
                  image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPets;