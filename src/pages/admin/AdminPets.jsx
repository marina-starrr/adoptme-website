import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';

function CustomDropdown({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <div 
        className={`custom-dropdown-header ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="custom-dropdown-list-wrapper">
          <ul className="custom-dropdown-list">
            {options.map((opt) => (
              <li 
                key={opt.value} 
                className={`custom-dropdown-item ${value === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdminPets() {
  const navigate = useNavigate();
  const [petsList, setPetsList] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');
  const [toastMsg, setToastMsg] = useState('');
  const [petToDelete, setPetToDelete] = useState(null);

  const [petTypes, setPetTypes] = useState(['Кіт', 'Собака']);
  const [newType, setNewType] = useState('');

  const [petBreeds, setPetBreeds] = useState(['Безпородна', 'Не вказано']);
  const [newBreed, setNewBreed] = useState('');

  const [filterType, setFilterType] = useState('Всі');
  const [filterBreed, setFilterBreed] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі'); 
  const [filterStatus, setFilterStatus] = useState('Всі');
  const [filterSize, setFilterSize] = useState('Всі');
  const [filterEnergy, setFilterEnergy] = useState('Всі');
  const [filterVaccinated, setFilterVaccinated] = useState('Всі');
  const [filterTraining, setFilterTraining] = useState('Всі');

  const getAgeInMonths = (ageStr) => {
    if (!ageStr) return 0;
    const lowerStr = ageStr.toLowerCase();
    const match = lowerStr.match(/(\d+([.,]\d+)?)/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(',', '.'));
    if (lowerStr.includes('рік') || lowerStr.includes('рок') || lowerStr.includes('річ') || lowerStr.includes('р.')) {
      return num * 12;
    } else if (lowerStr.includes('тиж')) {
      return num * 0.25; 
    } else if (lowerStr.includes('дн') || lowerStr.includes('день')) {
      return num / 30; 
    }
    return num;
  };

  const filteredAndSortedPets = [...petsList]
    .filter(pet => {
      const matchType = filterType === 'Всі' || (pet.Type || '').trim().toLowerCase() === filterType.trim().toLowerCase();
      
      const safePetBreed = pet.Breed ? pet.Breed.trim() : 'Безпородна';
      const matchBreed = filterBreed === 'Всі' || safePetBreed === filterBreed;

      const matchGender = filterGender === 'Всі' || (pet.Gender || '').trim().toLowerCase() === filterGender.trim().toLowerCase();

      const ageInMonths = getAgeInMonths(pet.Age);
      let matchAge = true;
      if (filterAge === 'До 6 місяців') matchAge = ageInMonths < 6;
      else if (filterAge === 'Від 6 міс. до 1 року') matchAge = ageInMonths >= 6 && ageInMonths <= 12;
      else if (filterAge === 'Від 1 до 3 років') matchAge = ageInMonths > 12 && ageInMonths <= 36;
      else if (filterAge === 'Більше 3 років') matchAge = ageInMonths > 36;

      const matchStatus = filterStatus === 'Всі' || (pet.Status || 'Шукає дім').trim().toLowerCase() === filterStatus.trim().toLowerCase();

      const safePetSize = pet.Size ? pet.Size.trim() : 'Середній';
      const matchSize = filterSize === 'Всі' || safePetSize === filterSize;

      const safePetEnergy = pet.EnergyLevel ? pet.EnergyLevel.trim() : 'Середній';
      const matchEnergy = filterEnergy === 'Всі' || safePetEnergy === filterEnergy;

      let matchVaccinated = true;
      if (filterVaccinated === 'Вакциновані') matchVaccinated = pet.IsVaccinated === true;
      else if (filterVaccinated === 'Не вакциновані') matchVaccinated = !pet.IsVaccinated;

      let matchTraining = true;
      if (filterTraining === 'Так') matchTraining = pet.NeedsTraining === true;
      else if (filterTraining === 'Ні') matchTraining = !pet.NeedsTraining;

      return matchType && matchBreed && matchGender && matchAge && matchStatus && matchSize && matchEnergy && matchVaccinated && matchTraining;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return (a.Name || '').localeCompare(b.Name || '');
      
      if (sortOrder === 'oldest') {
        const dateA = a.ArrivalDate ? new Date(a.ArrivalDate).getTime() : a.Id;
        const dateB = b.ArrivalDate ? new Date(b.ArrivalDate).getTime() : b.Id;
        return dateA - dateB;
      }
      
      const dateA = a.ArrivalDate ? new Date(a.ArrivalDate).getTime() : a.Id;
      const dateB = b.ArrivalDate ? new Date(b.ArrivalDate).getTime() : b.Id;
      return dateB - dateA;
    });

  const resetFilters = () => {
    setFilterType('Всі');
    setFilterBreed('Всі');
    setFilterGender('Всі');
    setFilterAge('Всі'); 
    setFilterStatus('Всі');
    setFilterSize('Всі');
    setFilterEnergy('Всі');
    setFilterVaccinated('Всі');
    setFilterTraining('Всі');
    setSortOrder('newest');
  };

  const handleAddNewType = (e) => {
    e.preventDefault();
    if (newType.trim() && !petTypes.includes(newType.trim())) {
      setPetTypes([...petTypes, newType.trim()]);
      setPetFormData({ ...petFormData, Type: newType.trim() });
      setNewType('');
      showToast("✨ Новий вид додано до списку!");
    } else {
      showToast("⚠️ Такий вид вже існує або назва порожня");
    }
  };

  const handleAddNewBreed = (e) => {
    e.preventDefault();
    if (newBreed.trim() && !petBreeds.includes(newBreed.trim())) {
      setPetBreeds([...petBreeds, newBreed.trim()]);
      setPetFormData({ ...petFormData, Breed: newBreed.trim() });
      setNewBreed('');
      showToast("✨ Нову породу додано до списку!");
    } else {
      showToast("⚠️ Така порода вже існує або назва порожня");
    }
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const initialFormState = {
    Name: '',
    Type: 'Кіт',
    Breed: 'Безпородна',
    Age: '',
    Gender: 'Хлопчик',
    ImageName: '',
    Tags: '',
    Description: '',
    Status: 'Шукає дім',
    OwnerId: null, 
    OwnerName: '',
    ArrivalDate: getTodayDate(),
    IsVaccinated: false,
    MedicalNotes: '',
    EnergyLevel: 'Середній',
    Friendliness: 'Дружелюбний до всіх',
    NeedsTraining: false,
    Size: 'Середній'
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetchPets();
    fetchUsers(); 
  }, []);

  useEffect(() => {
    if (petsList.length > 0) {
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).filter(Boolean))];
      setPetTypes([...new Set(['Кіт', 'Собака', ...uniqueTypes])]);

      const uniqueBreeds = [...new Set(petsList.map(pet => pet.Breed).filter(Boolean))];
      setPetBreeds([...new Set(['Безпородна', 'Не вказано', ...uniqueBreeds])]);
    }
  }, [petsList]);

  async function fetchPets() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Pets').select('*').order('Id', { ascending: true });
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) {
      showToast("❌ Помилка завантаження: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from('Users').select('Id, FirstName, LastName, Nickname');
    if (!error && data) {
      setUsersList(data);
    }
  }

  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);
    setPetFormData({
      Name: pet.Name || '',
      Type: pet.Type || 'Кіт',
      Breed: pet.Breed || 'Безпородна',
      Age: pet.Age || '',
      Gender: pet.Gender || 'Хлопчик',
      ImageName: pet.ImageName || '',
      Tags: pet.Tags || '',
      Description: pet.Description || '',
      Status: pet.Status || 'Шукає дім',
      OwnerId: pet.OwnerId || null,
      OwnerName: pet.OwnerName || '',
      ArrivalDate: pet.ArrivalDate || getTodayDate(),
      IsVaccinated: pet.IsVaccinated || false,
      MedicalNotes: pet.MedicalNotes || '',
      EnergyLevel: pet.EnergyLevel || 'Середній',
      Friendliness: pet.Friendliness || 'Дружелюбний до всіх',
      NeedsTraining: pet.NeedsTraining || false,
      Size: pet.Size || 'Середній'
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('pets').upload(fileName, file);
    if (uploadError) throw new Error('Помилка завантаження фото: ' + uploadError.message);
    return fileName;
  };

  const handleSavePet = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;

      if (selectedFile) {
        finalImageName = await uploadImage(selectedFile);
      } else if (!editMode && !finalImageName) {
        showToast("❌ Будь ласка, оберіть фотографію!");
        setIsUploading(false);
        return;
      }

      const dataToSave = { ...petFormData, ImageName: finalImageName };

      if (dataToSave.Status !== 'Вже вдома') {
        dataToSave.OwnerId = null;
        dataToSave.OwnerName = null;
      }

      if (editMode) {
        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;
        showToast("✅ Профіль тваринки успішно оновлено!");
      } else {
        const { error } = await supabase.from('Pets').insert([dataToSave]);
        if (error) throw error;
        showToast("🎉 Нового хвостика успішно додано!");
      }

      setIsModalOpen(false);
      fetchPets();
    } catch (error) {
      showToast("❌ Помилка: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setPetToDelete(id);
  };

  const executeDelete = async () => {
    if (!petToDelete) return;
    try {
      const { error } = await supabase.from('Pets').delete().eq('Id', petToDelete);
      if (error) throw error;
      showToast("🗑️ Профіль успішно видалено!");
      setPetToDelete(null);
      fetchPets();
    } catch (err) {
      showToast("❌ Помилка видалення: " + err.message);
      setPetToDelete(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="admin-page-layout">

        <aside className="admin-sidebar" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="sidebar-header">
            <h3 className="sidebar-title" style={{ margin: 0 }}>Фільтри</h3>
            <button className="reset-btn" onClick={resetFilters}>Скинути</button>
          </div>
          
          <div className="filter-block">
            <label>Вид тварини</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Всі види' },
                ...petTypes.map(type => ({ value: type, label: type }))
              ]} 
              value={filterType} 
              onChange={setFilterType} 
            />
          </div>

          <div className="filter-block">
            <label>Порода</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-яка порода' },
                ...petBreeds.map(breed => ({ value: breed, label: breed }))
              ]} 
              value={filterBreed} 
              onChange={setFilterBreed} 
            />
          </div>

          <div className="filter-block">
            <label>Стать</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-яка' },
                { value: 'Хлопчик', label: 'Хлопчик' },
                { value: 'Дівчинка', label: 'Дівчинка' }
              ]} 
              value={filterGender} 
              onChange={setFilterGender} 
            />
          </div>

          <div className="filter-block">
            <label>Розмір</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-який' },
                { value: 'Маленький', label: 'Маленький' },
                { value: 'Середній', label: 'Середній' },
                { value: 'Великий', label: 'Великий' }
              ]} 
              value={filterSize} 
              onChange={setFilterSize} 
            />
          </div>

          <div className="filter-block">
            <label>Рівень енергії</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-який' },
                { value: 'Низький', label: 'Низький' },
                { value: 'Середній', label: 'Середній' },
                { value: 'Високий', label: 'Високий' }
              ]} 
              value={filterEnergy} 
              onChange={setFilterEnergy} 
            />
          </div>

          <div className="filter-block">
            <label>Вік</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-який вік' },
                { value: 'До 6 місяців', label: 'До 6 місяців (Малюки)' },
                { value: 'Від 6 міс. до 1 року', label: 'Від 6 міс. до 1 року' },
                { value: 'Від 1 до 3 років', label: 'Від 1 до 3 років' },
                { value: 'Більше 3 років', label: 'Більше 3 років' }
              ]} 
              value={filterAge} 
              onChange={setFilterAge} 
            />
          </div>

          <div className="filter-block">
            <label>Вакцинація</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Не важливо' },
                { value: 'Вакциновані', label: '💉 Вакциновані' },
                { value: 'Не вакциновані', label: '⚠️ Не вакциновані' }
              ]} 
              value={filterVaccinated} 
              onChange={setFilterVaccinated} 
            />
          </div>

          <div className="filter-block">
            <label>Навчання / Дресирування</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Не важливо' },
                { value: 'Так', label: 'Потребує навчання' },
                { value: 'Ні', label: 'Слухняна(ий)' }
              ]} 
              value={filterTraining} 
              onChange={setFilterTraining} 
            />
          </div>

          <div className="filter-block">
            <label>Позначка (Статус)</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Всі статуси' },
                { value: 'Шукає дім', label: '🐾 Шукає дім' },
                { value: 'Потребує особливого догляду', label: '❤️‍🩹 Особливий догляд' },
                { value: 'На лікуванні', label: '💊 На лікуванні' },
                { value: 'Вже вдома', label: '🏡 Вже вдома' },
                { value: 'Не вдалось врятувати', label: '🌈 Не вдалось врятувати' }
              ]} 
              value={filterStatus} 
              onChange={setFilterStatus} 
            />
          </div>
        </aside>

        <div className="admin-content-area">
          <div className="admin-card">
            
            <div className="admin-header-box">
              <div className="admin-title-row">
                <h2 className="admin-page-title">
                  <span className="admin-page-title-icon">🐾</span> База тварин
                </h2>
                
                <div className="sort-control">
                  <span className="sort-label">Сортувати:</span>
                  <div style={{ width: '220px' }}>
                    <CustomDropdown 
                      options={[
                        { value: 'newest', label: 'Новенькі спочатку' },
                        { value: 'oldest', label: 'Ті, що давно чекають' },
                        { value: 'name', label: 'За алфавітом (А-Я)' }
                      ]} 
                      value={sortOrder} 
                      onChange={setSortOrder} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pet-grid">
              <div className="add-pet-card" onClick={handleAddOpen}>
                <div className="plus-icon">+</div>
                <h3>Додати хвостика</h3>
              </div>

              {filteredAndSortedPets.map((pet) => (
                <div key={pet.Id} className="pet-card-wrapper admin-mode" onClick={() => navigate(`/admin/pets/${pet.Id}`)} style={{ cursor: 'pointer' }}>
                  <div className="admin-card-actions">
                    <button className="edit-icon-btn" onClick={(e) => handleEditOpen(e, pet)}>✎</button>
                    <button className="delete-icon-btn" onClick={(e) => confirmDeleteClick(e, pet.Id)}>×</button>
                  </div>
                  <UserPetCard
                    id={pet.Id}
                    name={pet.Name}
                    age={pet.Age}
                    gender={pet.Gender}
                    tags={pet.Tags}
                    image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`}
                    isAdmin={true}
                    status={pet.Status} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isUploading && setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? "Редагування профілю" : "Новий підопічний"}</h3>
              <button className="close-x" onClick={() => setIsModalOpen(false)} title="Закрити">×</button>
            </div>

            <form onSubmit={handleSavePet} className="admin-form">
              <div className="input-group">
                <label>Кличка тваринки</label>
                <input type="text" placeholder="Наприклад: Mars" value={petFormData.Name} onChange={e => setPetFormData({ ...petFormData, Name: e.target.value })} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Вид тваринки</label>
                  <div className="add-type-row">
                    <select value={petFormData.Type} onChange={e => setPetFormData({ ...petFormData, Type: e.target.value })} className="form-control">
                      {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інший вид..." value={newType} onChange={e => setNewType(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewType}>+</button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Порода</label>
                  <div className="add-type-row">
                    <select value={petFormData.Breed} onChange={e => setPetFormData({ ...petFormData, Breed: e.target.value })} className="form-control">
                      {petBreeds.map(breed => <option key={breed} value={breed}>{breed}</option>)}
                    </select>
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інша порода..." value={newBreed} onChange={e => setNewBreed(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewBreed}>+</button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Стать</label>
                  <select value={petFormData.Gender} onChange={e => setPetFormData({ ...petFormData, Gender: e.target.value })} className="form-control">
                    <option>Хлопчик</option>
                    <option>Дівчинка</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Вік</label>
                  <input type="text" placeholder="Наприклад: 9 місяців" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} className="form-control" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Дата прибуття в притулок</label>
                  <input type="date" value={petFormData.ArrivalDate} onChange={e => setPetFormData({ ...petFormData, ArrivalDate: e.target.value })} className="form-control" required />
                </div>
                <div className="input-group">
                  <label>Розмір</label>
                  <select value={petFormData.Size} onChange={e => setPetFormData({ ...petFormData, Size: e.target.value })} className="form-control">
                    <option>Маленький</option>
                    <option>Середній</option>
                    <option>Великий</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Рівень енергії</label>
                  <select value={petFormData.EnergyLevel} onChange={e => setPetFormData({ ...petFormData, EnergyLevel: e.target.value })} className="form-control">
                    <option>Низький</option>
                    <option>Середній</option>
                    <option>Високий</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Дружелюбність</label>
                  <select value={petFormData.Friendliness} onChange={e => setPetFormData({ ...petFormData, Friendliness: e.target.value })} className="form-control">
                    <option>Дружелюбний до всіх</option>
                    <option>Любить дітей</option>
                    <option>Добре з іншими тваринами</option>
                    <option>Обережний / Потребує часу</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="needsTraining" checked={petFormData.NeedsTraining} onChange={e => setPetFormData({ ...petFormData, NeedsTraining: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                <label htmlFor="needsTraining" style={{ margin: 0, cursor: 'pointer' }}>Потребує дресирування / навчання</label>
              </div>

              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#49109f' }}>Медичний статус</h4>
                
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <input type="checkbox" id="isVaccinated" checked={petFormData.IsVaccinated} onChange={e => setPetFormData({ ...petFormData, IsVaccinated: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  <label htmlFor="isVaccinated" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#2E7D32' }}>💉 Тваринка вакцинована</label>
                </div>

                <div className="input-group">
                  <label>Медичні нотатки (ліки, особливості)</label>
                  <textarea placeholder="Наприклад: Потребує гіпоалергенний корм..." value={petFormData.MedicalNotes || ''} onChange={e => setPetFormData({ ...petFormData, MedicalNotes: e.target.value })} className="form-control" rows="2"></textarea>
                </div>
              </div>

              <div className="input-group">
                <label>Позначка (Статус тваринки)</label>
                <select 
                  value={petFormData.Status} 
                  onChange={e => {
                    const newStatus = e.target.value;
                    let newDesc = petFormData.Description;
                    if (newStatus === 'Вже вдома' && !newDesc) {
                      newDesc = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                    }
                    setPetFormData({ ...petFormData, Status: newStatus, Description: newDesc });
                  }} 
                  className="form-control"
                >
                  <option value="Шукає дім">🐾 Шукає дім</option>
                  <option value="Потребує особливого догляду">❤️‍🩹 Потребує особливого догляду</option>
                  <option value="На лікуванні">💊 На лікуванні</option>
                  <option value="Вже вдома">🏡 Вже вдома</option>
                  <option value="Не вдалось врятувати">🌈 Не вдалось врятувати</option>
                </select>
              </div>

              {petFormData.Status === 'Вже вдома' && (
                <div className="input-group" style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                  <label style={{ color: '#6847DD' }}>🏡 Хто прихистив тваринку? (Оберіть користувача)</label>
                  <select
                    value={petFormData.OwnerId || ''}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      const selectedUser = usersList.find(u => u.Id.toString() === selectedUserId);
                      setPetFormData({
                        ...petFormData,
                        OwnerId: selectedUserId ? parseInt(selectedUserId) : null,
                        OwnerName: selectedUser ? `${selectedUser.FirstName} ${selectedUser.LastName}` : ''
                      });
                    }}
                    className="form-control"
                    required
                  >
                    <option value="">-- Виберіть користувача --</option>
                    {usersList.map(user => (
                      <option key={user.Id} value={user.Id}>
                        {user.FirstName} {user.LastName} (@{user.Nickname})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Теги</label>
                <input type="text" placeholder="#добра #розумна" value={petFormData.Tags} onChange={e => setPetFormData({ ...petFormData, Tags: e.target.value })} className="form-control" />
              </div>

              <div className="input-group">
                <label>Фотографія</label>
                <label className="file-upload-label">
                  <span className="file-upload-text">
                    {selectedFile ? `✅ Обрано: ${selectedFile.name}` : (editMode ? "🖼️ Натисніть, щоб змінити поточне фото" : "📷 Натисніть, щоб обрати фото")}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="input-group">
                <label>Опис історії та характеру</label>
                <textarea
                  placeholder="Опишіть тваринку детальніше..."
                  value={petFormData.Description || ''}
                  onChange={e => setPetFormData({ ...petFormData, Description: e.target.value })}
                  className="form-control"
                  required
                  rows="4">
                </textarea>
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

      {petToDelete && (
        <div className="modal-overlay" onClick={() => setPetToDelete(null)}>
          <div className="admin-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px' }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              Ви дійсно хочете назавжди видалити профіль цієї тваринки? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={() => setPetToDelete(null)}>Скасувати</button>
              <button className="save-btn" style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }} onClick={executeDelete}>
                Так, видалити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPets;