import { Link } from 'react-router-dom';
import './AdminPetCard.css';
import { useToast } from '../context/ToastContext';

// 🌟 Додано пропс breed
function AdminPetCard({ id, name, age, gender, breed, tags, image, onDelete }) {
    return (
        <div className="pet-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <img src={image} alt={name} className="pet-image" style={{ objectFit: 'cover', height: '200px', width: '100%' }} />
            
            <div className="pet-info" style={{ flexGrow: 1, padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#4A148C' }}>{name}</h3>
                <div className="pet-info-chatacter" style={{ color: '#333', fontSize: '14px', marginBottom: '10px' }}>
                    <p style={{ margin: '3px 0' }}><strong>Вік:</strong> {age}</p>
                    <p style={{ margin: '3px 0' }}><strong>Стать:</strong> {gender}</p>
                    {/* 🌟 Виводимо породу */}
                    <p style={{ margin: '3px 0' }}><strong>Порода:</strong> {breed || 'Не вказано'}</p>
                </div>
                
                <div className="pet-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {tags && tags.split('#').filter(t => t).map(tag => (
                        <span key={tag} style={{ background: '#EFE6FF', color: '#6847DD', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            #{tag.trim()}
                        </span>
                    ))}
                </div>
            </div>

            <div className="admin-pet-actions">
                <Link to={`/admin/edit/${id}`} className="edit-pet-btn">
                    ✏️ Редагувати
                </Link>
                
                <button 
                    className="delete-pet-btn" 
                    onClick={(e) => {
                        e.preventDefault();
                        if(window.confirm(`Ви дійсно хочете видалити тваринку "${name}"?`)){
                            onDelete(id);
                        }
                    }}
                >
                    🗑️ Видалити
                </button>
            </div>
        </div>
    );
}

export default AdminPetCard;