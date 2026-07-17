import { createPortal } from 'react-dom';
import BaseDropdown from '../../components/CustomDropdown';

const CustomDropdown = (props) => <BaseDropdown variant="form" {...props} />;

// Модалка додавання/редагування тваринки. Стан живе в AdminPets і передається
// пропсами — цей компонент лише презентаційний.
export default function AdminPetFormModal({
  isModalClosing,
  isUploading,
  closeEditModal,
  editMode,
  handleSavePet,
  petFormData,
  setPetFormData,
  petTypes,
  newType,
  setNewType,
  handleAddNewType,
  petBreeds,
  newBreed,
  setNewBreed,
  handleAddNewBreed,
  petFavoriteFoods,
  newFavoriteFood,
  setNewFavoriteFood,
  handleAddNewFavoriteFood,
  getTodayDate,
  usersList,
  selectedFiles,
  setSelectedFiles,
}) {
  return createPortal(
    <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={() => !isUploading && closeEditModal()}>
      <div className={`admin-modal ${isModalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? "Редагування профілю" : "Новий підопічний"}</h3>
          <button className="close-x" onClick={closeEditModal} title="Закрити">×</button>
        </div>

        <form onSubmit={handleSavePet} className="admin-form">
          <div className="input-group">
            <label>Кличка тваринки</label>
            <input type="text" placeholder="Наприклад: Mars" value={petFormData.Name} onChange={e => setPetFormData({ ...petFormData, Name: e.target.value })} className="form-control" required />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Вид тваринки</label>
              <div className="add-type-row">
                <CustomDropdown
                  options={petTypes.map(type => ({ value: type, label: type }))}
                  value={petFormData.Type}
                  onChange={val => setPetFormData({ ...petFormData, Type: val })}
                />
              </div>
              <div className="add-type-row" style={{ marginTop: '10px' }}>
                <input type="text" placeholder="Інший вид..." value={newType} onChange={e => setNewType(e.target.value)} className="form-control" />
                <button type="button" className="add-type-btn" onClick={handleAddNewType}>+</button>
              </div>
            </div>

            <div className="input-group">
              <label>Порода</label>
              <div className="add-type-row">
                <CustomDropdown
                  options={petBreeds.map(breed => ({ value: breed, label: breed }))}
                  value={petFormData.Breed}
                  onChange={val => setPetFormData({ ...petFormData, Breed: val })}
                />
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
              <CustomDropdown
                options={[
                  { value: 'Хлопчик', label: 'Хлопчик' },
                  { value: 'Дівчинка', label: 'Дівчинка' }
                ]}
                value={petFormData.Gender}
                onChange={val => setPetFormData({ ...petFormData, Gender: val })}
              />
            </div>

            <div className="input-group">
              <label>Вік</label>
              <input type="text" placeholder="Наприклад: 9 місяців" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} className="form-control" required />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Дата прибуття в притулок</label>
              <input type="date" value={petFormData.ArrivalDate} max={getTodayDate()} onChange={e => setPetFormData({ ...petFormData, ArrivalDate: e.target.value })} className="form-control" required />
            </div>
            <div className="input-group">
              <label>Розмір</label>
              <CustomDropdown
                options={[
                  { value: 'Маленький', label: 'Маленький' },
                  { value: 'Середній', label: 'Середній' },
                  { value: 'Великий', label: 'Великий' }
                ]}
                value={petFormData.Size}
                onChange={val => setPetFormData({ ...petFormData, Size: val })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Рівень енергії</label>
              <CustomDropdown
                options={[
                  { value: 'Низький', label: 'Низький' },
                  { value: 'Середній', label: 'Середній' },
                  { value: 'Високий', label: 'Високий' }
                ]}
                value={petFormData.EnergyLevel}
                onChange={val => setPetFormData({ ...petFormData, EnergyLevel: val })}
              />
            </div>
            <div className="input-group">
              <label>Дружелюбність</label>
              <CustomDropdown
                options={[
                  { value: 'Дружелюбний до всіх', label: 'Дружелюбний до всіх' },
                  { value: 'Любить дітей', label: 'Любить дітей' },
                  { value: 'Добрий/а до інших тварин', label: 'Добрий/а до інших тварин' },
                  { value: 'Обережний / Потребує часу', label: 'Обережний / Потребує часу' }
                ]}
                value={petFormData.Friendliness}
                onChange={val => setPetFormData({ ...petFormData, Friendliness: val })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Улюблена їжа</label>
              <div className="add-type-row">
                <CustomDropdown
                  options={petFavoriteFoods.map(food => ({ value: food, label: food }))}
                  value={petFormData.FavoriteFood || "М'яско"}
                  onChange={val => setPetFormData({ ...petFormData, FavoriteFood: val })}
                />
              </div>
              <div className="add-type-row" style={{ marginTop: '10px' }}>
                <input type="text" placeholder="Інша їжа..." value={newFavoriteFood} onChange={e => setNewFavoriteFood(e.target.value)} className="form-control" />
                <button type="button" className="add-type-btn" onClick={handleAddNewFavoriteFood}>+</button>
              </div>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '30px' }}>
              <input type="checkbox" id="needsTraining" checked={petFormData.NeedsTraining} onChange={e => setPetFormData({ ...petFormData, NeedsTraining: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <label htmlFor="needsTraining" style={{ margin: 0, cursor: 'pointer' }}>Потребує дресирування / навчання</label>
            </div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#49109f' }}>Медичний статус</h4>
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input type="checkbox" id="isVaccinated" checked={petFormData.IsVaccinated} onChange={e => setPetFormData({ ...petFormData, IsVaccinated: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <label htmlFor="isVaccinated" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#2E7D32' }}>💉 Тваринка вакцинована</label>
            </div>
            <div className="input-group">
              <label>Медичні нотатки (ліки, особливості)</label>
              <textarea
                placeholder="Наприклад: Потребує гіпоалергенний корм..."
                value={petFormData.MedicalNotes || ''}
                onChange={e => setPetFormData({ ...petFormData, MedicalNotes: e.target.value })}
                className="form-control"
                rows="3"
                maxLength={300}
              />
              <div className="char-counter">
                {petFormData.MedicalNotes?.length || 0} / 300
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Позначка (Статус тваринки)</label>
            <CustomDropdown
              options={[
                { value: 'Шукає дім', label: '🐾 Шукає дім' },
                { value: 'Особливий догляд', label: '❤️‍🩹 Особливий догляд' },
                { value: 'На лікуванні', label: '💊 На лікуванні' },
                { value: 'Вже вдома', label: '🏡 Вже вдома' },
                { value: 'Не вдалось врятувати', label: '😞 Не вдалось врятувати' },
                { value: 'Заброньована', label: '🔒 Заброньована' }
              ]}
              value={petFormData.Status}
              onChange={val => {
                const newStatus = val;
                let updatedFormData = { ...petFormData, Status: newStatus };

                if (newStatus === 'Вже вдома') {
                  if (!updatedFormData.HomeDescription) {
                    updatedFormData.HomeDescription = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                  }
                } else {
                  updatedFormData.HomeDescription = null;
                }
                setPetFormData(updatedFormData);
              }}
            />
          </div>

          {petFormData.Status === 'Вже вдома' && (
            <div className="input-group" style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
              <label style={{ color: '#6847DD', marginBottom: '8px' }}>🏡 Хто прихистив тваринку?</label>
              <CustomDropdown
                placeholder="-- Виберіть користувача --"
                options={usersList.map(user => ({
                  value: user.id,
                  label: `${user.first_name} ${user.last_name} (@${user.nickname})`
                }))}
                value={petFormData.OwnerUserId || ''}
                onChange={val => {
                  const selectedUser = usersList.find(u => u.id === val);
                  setPetFormData({
                    ...petFormData,
                    OwnerUserId: val || null,
                    OwnerName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''
                  });
                }}
              />
            </div>
          )}

          <div className="input-group">
            <label>Теги</label>
            <input type="text" placeholder="#добра #розумна" value={petFormData.Tags} onChange={e => setPetFormData({ ...petFormData, Tags: e.target.value })} className="form-control" />
          </div>

          <div className="input-group">
            <label>Фотографії або відео (можна обрати декілька)</label>
            <label className="file-upload-label">
              <span className="file-upload-text">
                {selectedFiles.length > 0
                  ? `✅ Обрано файлів: ${selectedFiles.length}`
                  : (editMode ? "🖼️ Натисніть, щоб замінити медіа (оберіть всі потрібні файли)" : "📷 Натисніть, щоб обрати photo/відео")}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                style={{ display: 'none' }}
              />
            </label>
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#6847DD', wordBreak: 'break-word', lineHeight: '1.4' }}>
                <strong>Вибрані файли:</strong> {selectedFiles.map(f => f.name).join(', ')}
              </div>
            )}
            {editMode && selectedFiles.length === 0 && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                * Якщо ви не оберете нових файлів, залишаться попередні зображення.
              </div>
            )}
          </div>

          <div className="pet-story-block">
            <div style={{ marginBottom: '20px' }}>
              <h3 className="section-subtitle" style={{ fontSize: '15px' }}>📖 Опис історії та характеру в притулку:</h3>
              <div className="editable-container">
                <textarea
                  value={petFormData.Description || ''}
                  onChange={e => setPetFormData({ ...petFormData, Description: e.target.value })}
                  className="inline-input input-desc"
                  required
                  rows="4"
                  maxLength={700}
                />
              </div>
              <div className="char-counter">
                {petFormData.Description?.length || 0} / 700
              </div>
            </div>

            {petFormData.Status === 'Вже вдома' && (
              <div style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                <h3 className="section-subtitle" style={{ color: '#6847DD', marginBottom: '10px', fontSize: '15px' }}>🏡 Історія успіху (Життя в новій родині):</h3>
                <div className="editable-container">
                  <textarea
                    value={petFormData.HomeDescription || ''}
                    onChange={e => setPetFormData({ ...petFormData, HomeDescription: e.target.value })}
                    className="inline-input input-desc"
                    required
                    rows="4"
                    maxLength={700}
                  />
                </div>
                <div className="char-counter">
                  {petFormData.HomeDescription?.length || 0} / 700
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={isUploading}>Скасувати</button>
            <button type="submit" className="save-btn" disabled={isUploading}>
              {isUploading ? 'Завантаження...' : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
