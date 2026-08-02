import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import { petImageUrl } from '../../utils/petImage';
import { getAgeInMonths } from '../../utils/petAge';
import { PET_STATUS } from '../../utils/petStatus';
import BaseDropdown from '../../components/CustomDropdown';
import AdminPetFormModal from './AdminPetFormModal';
import AdminPetsFilters from './AdminPetsFilters';
import './AdminPets.css';
import { useToast } from '../../context/ToastContext';

// Варіант випадаючого списку для форм адмінки
const CustomDropdown = (props) => <BaseDropdown variant="form" {...props} />;

function AdminPets() {
  const navigate = useNavigate();
  const [petsList, setPetsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Пагінація для адмінки (12 карток разом з плюсиком на першій сторінці)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);

  const [isModalClosing, setIsModalClosing] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');

  const { showToast } = useToast();

  const [petTypes, setPetTypes] = useState(['Кіт', 'Собака']);
  const [newType, setNewType] = useState('');

  const [petBreeds, setPetBreeds] = useState(['Безпородна', 'Не вказано']);
  const [newBreed, setNewBreed] = useState('');

  const defaultFavoriteFoods = ["М'яско", 'Рибка', 'Сухий корм', 'Вологий корм', 'Паштет', 'Смаколики', 'Усе смачненьке'];
  const [petFavoriteFoods, setPetFavoriteFoods] = useState(defaultFavoriteFoods);
  const [newFavoriteFood, setNewFavoriteFood] = useState('');

  const [filterType, setFilterType] = useState('Всі');
  const [filterBreed, setFilterBreed] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі');
  const [filterStatus, setFilterStatus] = useState('Всі');
  const [filterSize, setFilterSize] = useState('Всі');
  const [filterEnergy, setFilterEnergy] = useState('Всі');
  const [filterVaccinated, setFilterVaccinated] = useState('Всі');
  const [filterTraining, setFilterTraining] = useState('Всі');

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

  // Автоматичне скидання пагінації на 1 сторінку при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterBreed, filterGender, filterAge, filterStatus, filterSize, filterEnergy, filterVaccinated, filterTraining, sortOrder]);

  // 👇 ДОДАНО: Перенесення користувача на самий верх сторінки при перелистуванні сторінок
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Логіка зрізу: на першій сторінці беремо на 1 менше (бо є картка «Додати»)
  const totalItems = filteredAndSortedPets.length;
  const adminPageSize = currentPage === 1 ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE;
  
  // Рахуємо правильний зміщення індексів
  const offset = currentPage === 1 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE - 1;
  const paginatedPets = filteredAndSortedPets.slice(offset, offset + adminPageSize);
  const totalPages = Math.ceil((totalItems + 1) / ITEMS_PER_PAGE);

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

  const handleAddNewFavoriteFood = (e) => {
    e.preventDefault();
    if (newFavoriteFood.trim() && !petFavoriteFoods.includes(newFavoriteFood.trim())) {
      setPetFavoriteFoods([...petFavoriteFoods, newFavoriteFood.trim()]);
      setPetFormData({ ...petFormData, FavoriteFood: newFavoriteFood.trim() });
      setNewFavoriteFood('');
      showToast("✨ Нову улюблену їжу додано до списку!");
    } else {
      showToast("⚠️ Така їжа вже є в списку або назва порожня");
    }
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const initialFormState = {
    Name: '', Type: 'Кіт', Breed: 'Безпородна', Age: '', Gender: 'Хлопчик', ImageName: '', Images: [], Tags: '', Description: '', HomeDescription: null, Status: 'Шукає дім', OwnerUserId: null, OwnerName: '', ArrivalDate: getTodayDate(), IsVaccinated: false, MedicalNotes: '', EnergyLevel: 'Середній', Friendliness: 'Дружелюбний до всіх', NeedsTraining: false, Size: 'Середній', FavoriteFood: "М'яско"
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

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

      const uniqueFavoriteFoods = [...new Set(petsList.map(pet => pet.FavoriteFood).filter(Boolean))];
      setPetFavoriteFoods([...new Set([...defaultFavoriteFoods, ...uniqueFavoriteFoods])]);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname');
    if (!error) {
      setUsersList(data || []);
    }
  }

  const closeEditModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 300);
  };

  const closeDeleteModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setPetToDelete(null);
      setIsModalClosing(false);
    }, 300);
  };

  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);

    setPetFormData({
      ...pet,
      Name: pet.Name || '', Type: pet.Type || 'Кіт', Breed: pet.Breed || 'Безпородна', Age: pet.Age || '', Gender: pet.Gender || 'Хлопчик', ImageName: pet.ImageName || '', Images: pet.Images || [], Tags: pet.Tags || '', Description: pet.Description || '', HomeDescription: pet.HomeDescription || '', Status: pet.Status || 'Шукає дім', OwnerUserId: pet.OwnerUserId || null, OwnerName: pet.OwnerName || '', ArrivalDate: pet.ArrivalDate || getTodayDate(), IsVaccinated: pet.IsVaccinated || false, MedicalNotes: pet.MedicalNotes || '', EnergyLevel: pet.EnergyLevel || 'Середній', Friendliness: pet.Friendliness || 'Дружелюбний до всіх', NeedsTraining: pet.NeedsTraining || false, Size: pet.Size || 'Середній', FavoriteFood: pet.FavoriteFood || "М'яско"
    });
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('pets').upload(fileName, file);
    if (uploadError) throw new Error('Помилка завантаження файлу: ' + uploadError.message);
    return fileName;
  };

  const handleSavePet = async (e) => {
    e.preventDefault();

    const todayStr = getTodayDate();
    if (petFormData.ArrivalDate > todayStr) {
      showToast("❌ Дата прибуття в притулок не може бути в майбутньому!");
      return;
    }

    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;
      let finalImages = petFormData.Images || [];

      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadImage(file));
        const uploadedFileNames = await Promise.all(uploadPromises);

        finalImages = uploadedFileNames;
        finalImageName = uploadedFileNames[0];
      } else if (!editMode && !finalImageName) {
        showToast("❌ Будь ласка, оберіть хоча б одне photo чи відео!");
        setIsUploading(false);
        return;
      }

      const isHome = petFormData.Status === 'Вже вдома';

      const processTags = (tagString) => {
        if (!tagString) return '';
        return tagString
          .split(/[ ,]+/) 
          .filter(t => t.trim() !== '') 
          .map(t => t.startsWith('#') ? t : `#${t}`) 
          .join(' ');
      };

      const dataToSave = {
        ...petFormData,
        Tags: processTags(petFormData.Tags), 
        ImageName: finalImageName,
        Images: finalImages
      };

      if (!isHome) {
        dataToSave.OwnerUserId = null;
        dataToSave.OwnerName = null;
        dataToSave.HomeDescription = null;
      }

      if (editMode) {
        const oldPet = petsList.find(p => p.Id === currentPetId);
        const isStatusChanged = oldPet && oldPet.Status?.trim().toLowerCase() !== dataToSave.Status?.trim().toLowerCase();

        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;

        const cleanStatus = dataToSave.Status?.trim();
        if (isStatusChanged && [PET_STATUS.TREATMENT, PET_STATUS.HOME, PET_STATUS.LOST, PET_STATUS.RESERVED, PET_STATUS.LOOKING].includes(cleanStatus)) {
          const targetStatus = cleanStatus === 'Вже вдома' ? 'Вже знайшла дім' : cleanStatus;

          const { data: favUsers } = await supabase.from('Favorites').select('user_id').eq('PetId', currentPetId);
          const validFavUsers = favUsers ? favUsers.filter(fav => fav.user_id) : [];

          if (validFavUsers.length > 0) {
            const notificationsToInsert = validFavUsers.map(fav => ({
              user_id: fav.user_id,
              PetId: currentPetId,
              PetName: dataToSave.Name,
              NewStatus: targetStatus,
              IsRead: false
            }));
            await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
          }
        }
        showToast("✅ Профіль тваринки успішно оновлено!");
      } else {
        const { data: newPetData, error } = await supabase.from('Pets').insert([dataToSave]).select();
        if (error) throw error;

        if (newPetData && newPetData.length > 0) {
          const newPetId = newPetData[0].Id || newPetData[0].id;

          const { data: freshUsers } = await supabase.from('profiles').select('id');

          if (freshUsers && freshUsers.length > 0) {
            const notificationsToInsert = freshUsers.map(user => ({
              user_id: user.id,
              PetId: newPetId,
              PetName: dataToSave.Name,
              NewStatus: 'Новенький хвостик',
              IsRead: false
            }));

            await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
          }
        }
        showToast("🎉 Нового хвостика успішно додано!");
      }

      closeEditModal();
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
    closeDeleteModal();
    try {
      const { error } = await supabase.from('Pets').delete().eq('Id', petToDelete);
      if (error) throw error;
      showToast("🗑️ Профіль успішно видалено!");
      setPetsList(prev => prev.filter(p => p.Id !== petToDelete));
    } catch (err) {
      showToast("❌ Помилка видалення: " + err.message);
    }
  };

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-layout">
        <AdminPetsFilters
          resetFilters={resetFilters}
          petTypes={petTypes}
          petBreeds={petBreeds}
          filterType={filterType} setFilterType={setFilterType}
          filterBreed={filterBreed} setFilterBreed={setFilterBreed}
          filterGender={filterGender} setFilterGender={setFilterGender}
          filterSize={filterSize} setFilterSize={setFilterSize}
          filterEnergy={filterEnergy} setFilterEnergy={setFilterEnergy}
          filterAge={filterAge} setFilterAge={setFilterAge}
          filterVaccinated={filterVaccinated} setFilterVaccinated={setFilterVaccinated}
          filterTraining={filterTraining} setFilterTraining={setFilterTraining}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        />

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
              {/* Картка додавання відображається тільки на 1 сторінці */}
              {currentPage === 1 && (
                <div className="add-pet-card" onClick={handleAddOpen}>
                  <div className="plus-icon">+</div>
                  <h3>Додати хвостика</h3>
                </div>
              )}

              {paginatedPets.map((pet) => (
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
                    image={petImageUrl(pet.ImageName)}
                    isAdmin={true}
                    status={pet.Status}
                  />
                </div>
              ))}
            </div>

            {/* БЛОК ПАГІНАЦІЇ АДМІНІСТРАТОРА */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AdminPetFormModal
          isModalClosing={isModalClosing}
          isUploading={isUploading}
          closeEditModal={closeEditModal}
          editMode={editMode}
          handleSavePet={handleSavePet}
          petFormData={petFormData}
          setPetFormData={setPetFormData}
          petTypes={petTypes}
          newType={newType}
          setNewType={setNewType}
          handleAddNewType={handleAddNewType}
          petBreeds={petBreeds}
          newBreed={newBreed}
          setNewBreed={setNewBreed}
          handleAddNewBreed={handleAddNewBreed}
          petFavoriteFoods={petFavoriteFoods}
          newFavoriteFood={newFavoriteFood}
          setNewFavoriteFood={setNewFavoriteFood}
          handleAddNewFavoriteFood={handleAddNewFavoriteFood}
          getTodayDate={getTodayDate}
          usersList={usersList}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      )}


      {petToDelete && createPortal(
        <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={closeDeleteModal}>
          <div className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px', marginTop: 0 }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              Ви дійсно хочете назавжди видалити профіль цієї тваринки? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={closeDeleteModal}>Скасувати</button>
              <button className="save-btn" style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }} onClick={executeDelete}>
                Так, видалити
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminPets;