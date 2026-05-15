import { useState, useEffect } from 'react';
import UserPetCard from '../../components/UserPetCard'; // Використовуємо звичайну картку для прев'ю
import BackgroundPaws from '../../components/BackgroundPaws';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';

function AdminPets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  // Стан для файлу картинки та завантаження
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = { 
    Name: '', 
    Type: 'Кіт', 
    Age: '', 
    Gender: 'Хлопчик', 
    ImageName: '', 
    Tags: '', 
    Description: '' 
  };
  
  const [petFormData, setPetFormData] = useState(initialFormState);

  useEffect(() => { 
    fetchPets(); 
  }, []);

  async function fetchPets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .order('Id', { ascending: true });
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) { 
      console.error("Помилка:", err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  // Відкриття модалки для редагування
  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);
    setPetFormData({ ...pet });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // Відкриття модалки для додавання
  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // Завантаження фото в Supabase Storage
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pets')
      .upload(fileName, file);

    if (uploadError) throw new Error('Помилка завантаження фото: ' + uploadError.message);
    return fileName;
  };

  // Збереження даних (Insert або Update)
  const handleSavePet = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;

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

  // Видалення тваринки
  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Ви впевнені, що хочете видалити цей профіль?')) {
      const { error } = await supabase.from('Pets').delete().eq('Id', id);
      if (!error) fetchPets();
    }
  };

  return (
    <div className="admin-pets-page page-transition">
      <div className="pets-section">
        <BackgroundPaws />
        
        <div className="admin-container">
          <div className="admin-header-box">
            <h2>Панель керування тваринами 🐾</h2>
            <p>Тут ви можете додавати нових підопічних або редагувати існуючих</p>
          </div>

          <div className="pet-grid">
            {/* Картка додавання (завжди перша) */}
            <div className="add-pet-card" onClick={handleAddOpen}>
              <div className="plus-icon">+</div>
              <h3>Додати хвостика</h3>
            </div>

            {/* Список існуючих тварин */}
            {petsList.map((pet) => (
              <div key={pet.Id} className="pet-card-wrapper admin-mode">
                <div className="admin-card-actions">
                  <button className="edit-icon-btn" onClick={(e) => handleEditOpen(e, pet)} title="Редагувати">✎</button>
                  <button className="delete-icon-btn" onClick={(e) => handleDelete(e, pet.Id)} title="Видалити">×</button>
                </div>
                <UserPetCard 
                  {...pet} 
                  image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО ФОРМИ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isUploading && setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h3>{editMode ? "Редагування профілю" : "Новий підопічний"}</h3>
                <button className="close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSavePet} className="admin-form">
              <div className="input-group">
                <label>Кличка тваринки</label>
                <input type="text" placeholder="Наприклад: Марс" value={petFormData.Name} onChange={e => setPetFormData({...petFormData, Name: e.target.value})} required />
              </div>
              
              <div className="form-row">
                <div className="input-group">
                    <label>Вид</label>
                    <select value={petFormData.Type} onChange={e => setPetFormData({...petFormData, Type: e.target.value})}>
                        <option>Кіт</option>
                        <option>Собака</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Стать</label>
                    <select value={petFormData.Gender} onChange={e => setPetFormData({...petFormData, Gender: e.target.value})}>
                        <option>Хлопчик</option>
                        <option>Дівчинка</option>
                    </select>
                </div>
              </div>
              
              <div className="form-row">
                 <div className="input-group">
                    <label>Вік</label>
                    <input type="text" placeholder="2 міс. / 1 рік" value={petFormData.Age} onChange={e => setPetFormData({...petFormData, Age: e.target.value})} required />
                 </div>
                 <div className="input-group">
                    <label>Теги (через кому)</label>
                    <input type="text" placeholder="грайливий, лагідний" value={petFormData.Tags} onChange={e => setPetFormData({...petFormData, Tags: e.target.value})} />
                 </div>
              </div>

              <div className="file-upload-container">
                  <label>Фотографія</label>
                  <div className="file-upload-label">
                      {selectedFile ? `✅ Обрано: ${selectedFile.name}` : (editMode ? "🖼️ Залишити поточне або змінити" : "📷 Обрати фото з пристрою")}
                      <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                  </div>
              </div>

              <div className="input-group">
                <label>Опис історії та характеру</label>
                <textarea placeholder="Опишіть тваринку детальніше..." value={petFormData.Description} onChange={e => setPetFormData({...petFormData, Description: e.target.value})} required rows="4"></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Скасувати</button>
                <button type="submit" className="save-btn" disabled={isUploading}>
                    {isUploading ? 'Завантаження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPets;