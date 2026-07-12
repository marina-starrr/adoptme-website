import { useState, useEffect, useRef } from 'react';
import UserPetCard from '../components/UserPetCard';
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient';
import './UserPets.css';
import { useToast } from '../context/ToastContext';

// КАСТОМНИЙ ВИПАДАЮЧИЙ СПИСОК
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

function UserPets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейт для пагінації (12 тварин на сторінку)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Стейти для динамічних списків
  const [petTypes, setPetTypes] = useState([{ value: 'Всі', label: 'Всі виды' }]);
  const [petBreeds, setPetBreeds] = useState([{ value: 'Всі', label: 'Будь-яка порода' }]);

  // Стейти фільтрів
  const [filterType, setFilterType] = useState('Всі');
  const [filterBreed, setFilterBreed] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі');
  const [filterStatus, setFilterStatus] = useState('Всі');
  const [filterSize, setFilterSize] = useState('Всі');
  const [filterEnergy, setFilterEnergy] = useState('Всі');
  const [filterVaccinated, setFilterVaccinated] = useState('Всі');
  const [filterTraining, setFilterTraining] = useState('Всі');

  const [sortOrder, setSortOrder] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchPets();
  }, []);

  // Скидання на 1-шу сторінку при зміні будь-якого фільтра чи сортування
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterBreed, filterGender, filterAge, filterStatus, filterSize, filterEnergy, filterVaccinated, filterTraining, sortOrder]);

  // 👇 ДОДАНО: Перенесення користувача на самий верх сторінки при перелистуванні сторінок
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Збираємо унікальні види та породи для фільтрів
  useEffect(() => {
    if (petsList.length > 0) {
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).filter(Boolean))];
      setPetTypes([
        { value: 'Всі', label: 'Всі види' },
        ...uniqueTypes.map(type => ({ value: type, label: type }))
      ]);

      const uniqueBreeds = [...new Set(petsList.map(pet => pet.Breed).filter(Boolean))];
      setPetBreeds([
        { value: 'Всі', label: 'Будь-яка порода' },
        ...uniqueBreeds.map(breed => ({ value: breed, label: breed }))
      ]);
    }
  }, [petsList]);

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .order('Id', { ascending: true });

      if (error) throw error;
      setPetsList(data || []);
    } catch (err) {
      console.error("❌ Помилка завантаження: ", err.message);
      showToast("❌ Помилка завантаження : " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const getAgeInMonths = (ageStr) => {
    if (!ageStr) return 0;
    const lowerStr = ageStr.toLowerCase();
    const match = lowerStr.match(/(\d+([.,]\d+)?)/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(',', '.'));

    if (lowerStr.includes('рік') || lowerStr.includes('рок') || lowerStr.includes('р.')) return num * 12;
    if (lowerStr.includes('тиж')) return num * 0.25;
    if (lowerStr.includes('дн') || lowerStr.includes('день')) return num / 30;
    return num;
  };

  // Розумна фільтрація
  const filteredAndSortedPets = [...petsList]
    .filter(pet => {
      const safePetType = pet.Type ? pet.Type.trim().toLowerCase() : '';
      const safeFilterType = filterType.trim().toLowerCase();
      const matchType = filterType === 'Всі' || safePetType === safeFilterType;

      const safePetBreed = pet.Breed ? pet.Breed.trim() : 'Безпородна';
      const matchBreed = filterBreed === 'Всі' || safePetBreed === filterBreed;

      const safePetGender = pet.Gender ? pet.Gender.trim().toLowerCase() : '';
      const safeFilterGender = filterGender.trim().toLowerCase();
      const matchGender = filterGender === 'Всі' || safePetGender === safeFilterGender;

      const ageInMonths = getAgeInMonths(pet.Age);
      let matchAge = true;
      if (filterAge === 'До 6 місяців') matchAge = ageInMonths < 6;
      else if (filterAge === 'Від 6 міс. до 1 року') matchAge = ageInMonths >= 6 && ageInMonths <= 12;
      else if (filterAge === 'Від 1 до 3 років') matchAge = ageInMonths > 12 && ageInMonths <= 36;
      else if (filterAge === 'Більше 3 років') matchAge = ageInMonths > 36;

      const safePetStatus = pet.Status ? pet.Status.trim().toLowerCase() : 'шукає дім';
      const safeFilterStatus = filterStatus.trim().toLowerCase();
      const matchStatus = filterStatus === 'Всі' || safePetStatus === safeFilterStatus;

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

  // Логіка зрізу масиву для поточної сторінки
  const totalItems = filteredAndSortedPets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPets = filteredAndSortedPets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handleResetFilters = () => {
    resetFilters();
    setFiltersOpen(false);
  };

  if (loading) return <h2 className="loading-message">Шукаємо пухнастиків... 🐾</h2>;

  return (
      <div className="pets-section">
        <BackgroundPaws />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="pets-title-container">Знайди свого найкращого друга</div>

          <div className="catalog-layout">

            <button
              type="button"
              className={`filters-toggle-btn ${filtersOpen ? 'open' : ''}`}
              onClick={() => setFiltersOpen(prev => !prev)}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
            >
              <span>Фільтри</span>
              <span className="filters-toggle-icon">{filtersOpen ? '▲' : '▼'}</span>
            </button>
            
            {/* ⬅️ ЛІВА ПАНЕЛЬ: ФІЛЬТРИ */}
            <aside id="catalog-filters" className={`catalog-sidebar ${filtersOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                <h3>Фільтри</h3>
                <button type="button" className="reset-btn" onClick={handleResetFilters}>Скинути</button>
              </div>

              <div className="filter-block">
                <label>Вид тварини</label>
                <CustomDropdown 
                  options={petTypes} 
                  value={filterType} 
                  onChange={setFilterType} 
                />
              </div>

              <div className="filter-block">
                <label>Порода</label>
                <CustomDropdown 
                  options={petBreeds} 
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
                    { value: 'Особливий догляд', label: '❤️‍🩹 Особливий догляд' },
                    { value: 'На лікуванні', label: '💊 На лікуванні' }
                  ]} 
                  value={filterStatus} 
                  onChange={setFilterStatus} 
                />
              </div>
            </aside>

            {/* ➡️ ПРАВА ПАНЕЛЬ: СОРТУВАННЯ + СІТКА КАРТОК */}
            <main className="catalog-main">
              
              <div className="catalog-top-bar">
                <div className="results-count">
                  Знайдено пухнастиків: <strong>{totalItems}</strong>
                </div>
                <div className="sort-control">
                  <span className="sort-label">Сортувати:</span>
                  <div className="sort-dropdown">
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

              {totalItems === 0 ? (
                <div className="empty-catalog">
                  <h3>За вашими критеріями нікого не знайдено 😔</h3>
                  <p>Спробуйте змінити фільтри або скинути їх.</p>
                  <button type="button" className="reset-large-btn" onClick={handleResetFilters}>Показати всіх тваринок</button>
                </div>
              ) : (
                <>
                  <div className="pet-grid">
                    {paginatedPets.map((pet) => (
                      <div key={pet.Id} className="pet-card-wrapper">
                        <UserPetCard
                          id={pet.Id}
                          name={pet.Name}
                          age={pet.Age}
                          gender={pet.Gender}
                          tags={pet.Tags} 
                          image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`}
                          status={pet.Status} 
                        />
                      </div>
                    ))}
                  </div>

                  {/* БЛОК ПАГІНАЦІЇ КОРИСТУВАЧА */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn prev-next"
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
                        className="pagination-btn prev-next"
                      >
                        »
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>

          </div>
        </div>
      </div>
  );
}

export default UserPets;