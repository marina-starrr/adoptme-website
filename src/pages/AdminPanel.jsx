import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

function AdminPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('applications'); // 'applications' або 'pets'
    const [applications, setApplications] = useState([]);
    const [pets, setPets] = useState([]); // Список тварин
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Поля для нової тварини
    const [newPet, setNewPet] = useState({ name: '', type: 'Кіт', age: '', sex: 'Хлопчик', desc: '', image: '' });

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) navigate('/login');

        // Імітація завантаження тварин (заміни на fetch до своєї БД)
        const savedPets = JSON.parse(localStorage.getItem('allPets')) || [
            { id: 1, name: 'Мурчик', type: 'Кіт', age: '2 роки', sex: 'Хлопчик', image: '/cat1.jpg' },
            { id: 2, name: 'Барон', type: 'Собака', age: '1 рік', sex: 'Хлопчик', image: '/dog1.jpg' }
        ];
        setPets(savedPets);
    }, [navigate]);

    // Додавання нової тварини
    const handleAddPet = (e) => {
        e.preventDefault();
        const petWithId = { ...newPet, id: Date.now() };
        const updatedPets = [...pets, petWithId];
        setPets(updatedPets);
        localStorage.setItem('allPets', JSON.stringify(updatedPets)); // Тимчасово зберігаємо в браузері
        setIsModalOpen(false);
        setNewPet({ name: '', type: 'Кіт', age: '', sex: 'Хлопчик', desc: '', image: '' });
        alert('Тваринку успішно додано!');
    };

    const deletePet = (id) => {
        if(window.confirm('Видалити тваринку з каталогу?')) {
            const updated = pets.filter(p => p.id !== id);
            setPets(updated);
            localStorage.setItem('allPets', JSON.stringify(updated));
        }
    };

    return (
        <div className="admin-page page-transition">
            <div className="admin-header">
                <h2>Панель адміністратора 🐾</h2>
                <div className="admin-tabs">
                    <button 
                        className={activeTab === 'applications' ? 'active' : ''} 
                        onClick={() => setActiveTab('applications')}
                    >
                        Заявки
                    </button>
                    <button 
                        className={activeTab === 'pets' ? 'active' : ''} 
                        onClick={() => setActiveTab('pets')}
                    >
                        Наші тварини
                    </button>
                </div>
            </div>

            {activeTab === 'applications' ? (
                <div className="admin-content">
                    {/* Тут код заявок, який ми робили минулого разу */}
                    <div className="applications-grid">
                        {applications.length > 0 ? applications.map(app => (
                            <div className="app-card" key={app.id}>
                                {/* ... контент картки заявки ... */}
                            </div>
                        )) : <p className="empty-msg">Заявок поки немає</p>}
                    </div>
                </div>
            ) : (
                <div className="admin-content">
                    <div className="pets-admin-controls">
                        <button className="add-pet-btn" onClick={() => setIsModalOpen(true)}>+ Додати тварину</button>
                    </div>

                    <div className="admin-pets-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Фото</th>
                                    <th>Ім'я</th>
                                    <th>Вид</th>
                                    <th>Вік</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pets.map(pet => (
                                    <tr key={pet.id}>
                                        <td><img src={pet.image} alt="" className="admin-table-img" /></td>
                                        <td>{pet.name}</td>
                                        <td>{pet.type}</td>
                                        <td>{pet.age}</td>
                                        <td>
                                            <button className="del-btn" onClick={() => deletePet(pet.id)}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ДОДАВАННЯ ТВАРИНИ */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h3>Новий мешканець притулку</h3>
                        <form onSubmit={handleAddPet} className="admin-form">
                            <input type="text" placeholder="Ім'я" required value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} />
                            <div className="form-row">
                                <select value={newPet.type} onChange={e => setNewPet({...newPet, type: e.target.value})}>
                                    <option>Кіт</option>
                                    <option>Собака</option>
                                    <option>Інше</option>
                                </select>
                                <input type="text" placeholder="Вік (напр. 2 роки)" required value={newPet.age} onChange={e => setNewPet({...newPet, age: e.target.value})} />
                            </div>
                            <input type="text" placeholder="Посилання на фото (URL)" required value={newPet.image} onChange={e => setNewPet({...newPet, image: e.target.value})} />
                            <textarea placeholder="Опис тваринки..." required value={newPet.desc} onChange={e => setNewPet({...newPet, desc: e.target.value})}></textarea>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Скасувати</button>
                                <button type="submit" className="save-btn">Зберегти</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;