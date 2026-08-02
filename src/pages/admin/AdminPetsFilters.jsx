import BaseDropdown from '../../components/CustomDropdown';

const CustomDropdown = (props) => <BaseDropdown variant="form" {...props} />;

// Ліва панель фільтрів у базі тварин. Стан фільтрів живе в AdminPets.
export default function AdminPetsFilters({
  resetFilters,
  petTypes,
  petBreeds,
  filterType, setFilterType,
  filterBreed, setFilterBreed,
  filterGender, setFilterGender,
  filterSize, setFilterSize,
  filterEnergy, setFilterEnergy,
  filterAge, setFilterAge,
  filterVaccinated, setFilterVaccinated,
  filterTraining, setFilterTraining,
  filterStatus, setFilterStatus,
}) {
  return (
    <aside className="admin-sidebar">
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
            { value: 'Всі', label: 'Будь-яка' },
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
            { value: 'Всі', label: 'Будь-який' },
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
        <label>Позначка (Статус тваринки)</label>
        <CustomDropdown
          options={[
            { value: 'Всі', label: 'Всі статуси' },
            { value: 'Шукає дім', label: '🐾 Шукає дім' },
            { value: 'Особливий догляд', label: '❤️‍🩹 Особливий догляд' },
            { value: 'На лікуванні', label: '💊 На лікуванні' },
            { value: 'Вже вдома', label: '🏡 Вже вдома' },
            { value: 'Не вдалось врятувати', label: '😞 Не вдалось врятувати' }
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </div>
    </aside>
  );
}
