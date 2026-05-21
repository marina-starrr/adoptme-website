import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminReviews.css'; // Створимо цей файл наступним

function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Стейти для відповіді
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Стейти для видалення
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    const showToast = (message) => {
        setToastMsg(message);
        setTimeout(() => setToastMsg(''), 3500);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('Reviews')
                .select('*')
                .order('Id', { ascending: false }); // Нові зверху
            
            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            showToast("❌ Помилка завантаження відгуків: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    // --- ЛОГІКА ВІДПОВІДІ ---
    const handleOpenReply = (review) => {
        setActiveReplyId(review.Id);
        setReplyText(review.AdminReply || ''); // Якщо вже є відповідь, показуємо її
    };

    const handleSaveReply = async (id) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('Reviews')
                .update({ AdminReply: replyText })
                .eq('Id', id);

            if (error) throw error;

            showToast("✅ Відповідь успішно збережено!");
            setActiveReplyId(null);
            setReplyText('');
            fetchReviews(); // Оновлюємо список
        } catch (err) {
            showToast("❌ Помилка збереження: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- ЛОГІКА ВИДАЛЕННЯ ---
    const confirmDeleteClick = (id) => {
        setReviewToDelete(id);
    };

    const executeDelete = async () => {
        if (!reviewToDelete) return;
        try {
            const { error } = await supabase.from('Reviews').delete().eq('Id', reviewToDelete);
            if (error) throw error;

            showToast("🗑️ Відгук успішно видалено!");
            setReviewToDelete(null);
            fetchReviews();
        } catch (err) {
            showToast("❌ Помилка видалення: " + err.message);
            setReviewToDelete(null);
        }
    };

    return (
        <div className="admin-main" style={{ position: 'relative' }}>
            {toastMsg && <div className="custom-toast" style={{ zIndex: 100000 }}>{toastMsg}</div>}

            <div className="admin-page-layout">
                {/* В цій секції сайдбар не потрібен, віддаємо весь простір контенту */}
                <div className="admin-content-area" style={{ width: '100%' }}>
                    <div className="admin-card">
                        <div className="admin-header-box">
                            <div className="admin-title-row">
                                <h2 className="admin-page-title">
                                    <span className="admin-page-title-icon">💬</span> Модерація відгуків
                                </h2>
                            </div>
                            <p style={{ color: '#666680', marginTop: '-15px', marginBottom: '20px' }}>
                                Тут ви можете відповідати клієнтам та видаляти неприйнятні коментарі.
                            </p>
                        </div>

                        {loading ? (
                            <h3 style={{ textAlign: 'center', color: '#4A148C', padding: '40px' }}>Завантаження... 🐾</h3>
                        ) : reviews.length === 0 ? (
                            <div className="empty-reviews-state">
                                <p>Поки що немає жодного відгуку.</p>
                            </div>
                        ) : (
                            <div className="admin-reviews-list">
                                {reviews.map((review) => (
                                    <div key={review.Id} className="admin-review-card">
                                        
                                        <div className="admin-review-header">
                                            <div className="review-author-info">
                                                <strong>{review.Name}</strong>
                                                <span className="review-date-badge">{review.Date}</span>
                                            </div>
                                            <button 
                                                className="delete-review-btn" 
                                                onClick={() => confirmDeleteClick(review.Id)}
                                                title="Видалити відгук"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <p className="admin-review-text">{review.Text}</p>

                                        {/* Блок відповіді */}
                                        <div className="admin-reply-section">
                                            {activeReplyId === review.Id ? (
                                                <div className="reply-editor">
                                                    <textarea 
                                                        className="reply-textarea"
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Напишіть вашу офіційну відповідь..."
                                                        rows="3"
                                                    />
                                                    <div className="reply-actions">
                                                        <button className="cancel-reply-btn" onClick={() => setActiveReplyId(null)}>Скасувати</button>
                                                        <button 
                                                            className="save-reply-btn" 
                                                            onClick={() => handleSaveReply(review.Id)}
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? 'Збереження...' : 'Відповісти'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="reply-display">
                                                    {review.AdminReply ? (
                                                        <div className="existing-reply">
                                                            <strong>🐾 Admin</strong>
                                                            <p>{review.AdminReply}</p>
                                                            <button className="edit-reply-btn" onClick={() => handleOpenReply(review)}>
                                                                ✎ Редагувати відповідь
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button className="add-reply-btn" onClick={() => handleOpenReply(review)}>
                                                            ↪ Додати відповідь
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ (Взято з твого AdminPets для однакового дизайну) */}
            {reviewToDelete && (
                <div className="modal-overlay" onClick={() => setReviewToDelete(null)}>
                    <div className="admin-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px' }}>⚠️ Видалення відгуку</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px' }}>
                            Ви дійсно хочете назавжди видалити цей відгук? Цю дію неможливо скасувати.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={() => setReviewToDelete(null)}>Скасувати</button>
                            <button
                                className="save-btn"
                                style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                                onClick={executeDelete}
                            >
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReviews;