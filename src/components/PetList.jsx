import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { petImageUrl } from '../utils/petImage';

const PetList = () => {
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const fetchPets = async () => {
      const { data, error } = await supabase
        .from('Pets') 
        .select('*');

      if (error) console.error('Помилка:', error);
      else setPets(data);
    };

    fetchPets();
  }, []);

  return (
    <div className="catalog-grid">
      {pets.map((pet) => (
        <div key={pet.Id} className="pet-card">
          <img 
            src={petImageUrl(pet.ImageName)}
            alt={pet.Name} 
            style={{ width: '200px', borderRadius: '10px' }} 
          />
          <h3>{pet.Name}</h3>
          <p>{pet.Type} • {pet.Age}</p>
          <div className="tags">{pet.Tags}</div>
        </div>
      ))}
    </div>
  );
};

export default PetList;