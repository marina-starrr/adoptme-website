import { useState, useEffect } from 'react';
import PetCard from '../components/PetCard';
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Pets.css';

function Pets() {
  const { isAdmin } = useAuth();
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  // Стан для файлу картинки
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = { Name: '', Type: 'Кіт', Age: '', Gender: 'Хлопчик', ImageName: '', Tags: '', Description: '' };
  const [petFormData, setPetFormData] = useState(initialFormState);

  useEffect(() => { fetchPets(); }, []);

  async function fetchPets() {
    try {
      const { data, error } = await supabase.from('Pets').select('*').order('Id', { ascending: true });
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) { console.error(err.message); } 
    finally { setLoading(false); }
  }

  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);
    setPetFormData({ ...pet });
    setSelectedFile(null); // Скидаємо вибраний файл при відкритті
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFile(null); // Скидаємо вибраний файл
    setIsModalOpen(true);
  };

  // ФУНКЦІЯ ЗАВАНТАЖЕННЯ ФОТО В SUPABASE STORAGE
  const uploadImage = async (file) => {
    // Генеруємо унікальне ім'я для файлу, щоб вони не перезаписували один одного
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pets') // Назва твого бакета
      .upload(fileName, file);

    if (uploadError) {
      throw new Error('Не вдалося завантажити фото: ' + uploadError.message);
    }
    
    return fileName;
  };

  const handleSavePet = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;

      // Якщо користувач вибрав новий файл, спочатку завантажуємо його
      if (selectedFile) {
        finalImageName = await uploadImage(selectedFile);
      } else if (!editMode && !finalImageName) {
        alert("Будь ласка, оберіть фотографію!");
        setIsUploading(false);
        return;
      }

      const dataToSave = { ...petFormData, ImageName: finalImageName };

      if (editMode) {
        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Pets').insert([dataToSave]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPets();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Видалити тваринку?')) {
      await supabase.from('Pets').delete().eq('Id', id);
      fetchPets();
    }
  };

  return (
    <div className="page-transition">
      <div className="pets-section">
        <BackgroundPaws />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="pets-title-container">Знайди свого найкращого друга</div>
          <div className="pet-grid">
            
            {petsList.map((pet) => (
              <div key={pet.Id} className="pet-card-wrapper">
                {isAdmin && (
                  <div className="admin-card-actions">
                    <button className="edit-icon-btn" onClick={(e) => handleEditOpen(e, pet)}>✎</button>
                    <button className="delete-icon-btn" onClick={(e) => handleDelete(e, pet.Id)}>×</button>
                  </div>
                )}
                <PetCard {...pet} image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`} name={pet.Name} age={pet.Age} gender={pet.Gender} id={pet.Id} tags={pet.Tags} />
              </div>
            ))}

            {isAdmin && (
              <div className="add-pet-card" onClick={handleAddOpen}>
                <div className="plus-icon">+</div>
                <h3>Додати тваринку</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isUploading && setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{editMode ? "Редагувати" : "Новий хвостик"}</h3>
            <form onSubmit={handleSavePet} className="admin-form">
              <input type="text" placeholder="Ім'я" value={petFormData.Name} onChange={e => setPetFormData({...petFormData, Name: e.target.value})} required />
              
              <div className="form-row">
                <select value={petFormData.Type} onChange={e => setPetFormData({...petFormData, Type: e.target.value})}><option>Кіт</option><option>Собака</option></select>
                <select value={petFormData.Gender} onChange={e => setPetFormData({...petFormData, Gender: e.target.value})}><option>Хлопчик</option><option>Дівчинка</option></select>
              </div>
              
              <div className="form-row">
                 <input type="text" placeholder="Вік (напр. 2 міс)" value={petFormData.Age} onChange={e => setPetFormData({...petFormData, Age: e.target.value})} required />
                 <input type="text" placeholder="Теги (через кому)" value={petFormData.Tags} onChange={e => setPetFormData({...petFormData, Tags: e.target.value})} />
              </div>

              {/* 👇 НОВЕ ПОЛЕ ДЛЯ ЗАВАНТАЖЕННЯ ФОТО 👇 */}
              <div className="file-upload-container">
                  <label className="file-upload-label">
                      {selectedFile ? `Обрано: ${selectedFile.name}` : (editMode ? "Змінити фото..." : "📷 Обрати фото з пристрою")}
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setSelectedFile(e.target.files[0])} 
                          style={{ display: 'none' }} 
                      />
                  </label>
                  {editMode && !selectedFile && <p className="file-hint">Зараз встановлено: {petFormData.ImageName}</p>}
              </div>

              <textarea placeholder="Опис" value={petFormData.Description} onChange={e => setPetFormData({...petFormData, Description: e.target.value})} required rows="3"></textarea>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Скасувати</button>
                <button type="submit" className="save-btn" disabled={isUploading}>
                    {isUploading ? 'Завантаження...' : 'Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pets;