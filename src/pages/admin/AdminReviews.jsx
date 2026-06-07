import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminReviews.css'; 
import { useToast } from '../../context/ToastContext';

function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Стейти для відповіді
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Стейти для видалення ЦІЛОГО відгуку
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [isModalClosing, setIsModalClosing] = useState(false); 

    // Стейти для видалення ОКРЕМОГО коментаря (користувача або адміна)
    const [replyToDelete, setReplyToDelete] = useState(null);
    const [isReplyModalClosing, setIsReplyModalClosing] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('Reviews')
                .select('*')
                .order('Id', { ascending: false }); 

            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            showToast("❌ Помилка завантаження відгуків: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    // --- ЛОГІКА ВІДПОВІДІ АДМІНА ---
    const handleOpenReply = (review) => {
        setActiveReplyId(review.Id);
        setReplyText(review.AdminReply || ''); 
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
            setReviews(prev => prev.map(r => r.Id === id ? { ...r, AdminReply: replyText } : r));
        } catch (err) {
            showToast("❌ Помилка збереження: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- ЛОГІКА ВИДАЛЕННЯ ЦІЛОГО ВІДГУКУ ---
    const confirmDeleteClick = (id) => {
        setReviewToDelete(id);
    };

    const closeConfirmDialog = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setReviewToDelete(null);
            setIsModalClosing(false);
        }, 300); 
    };

    const executeDelete = async () => {
        if (!reviewToDelete) return;
        closeConfirmDialog();
        try {
            const { error } = await supabase.from('Reviews').delete().eq('Id', reviewToDelete);
            if (error) throw error;

            showToast("🗑️ Відгук успішно видалено!");
            setReviews(prev => prev.filter(r => r.Id !== reviewToDelete));
        } catch (err) {
            showToast("❌ Помилка видалення: " + err.message);
        }
    };

    // --- ЛОГІКА ВИДАЛЕННЯ ОКРЕМИХ КОМЕНТАРІВ ---
    const confirmDeleteUserReplyClick = (reviewId, reply) => {
        setReplyToDelete({ reviewId, replyId: reply.id, type: 'user', author: reply.author, text: reply.text });
    };

    const confirmDeleteAdminReplyClick = (reviewId) => {
        setReplyToDelete({ reviewId, type: 'admin' });
    };

    const closeReplyConfirmDialog = () => {
        setIsReplyModalClosing(true);
        setTimeout(() => {
            setReplyToDelete(null);
            setIsReplyModalClosing(false);
        }, 300);
    };

    const executeReplyDelete = async () => {
        if (!replyToDelete) return;
        const { reviewId, replyId, type, author, text } = replyToDelete;
        closeReplyConfirmDialog();

        try {
            if (type === 'user') {
                const review = reviews.find(r => r.Id === reviewId);
                const updatedReplies = review.UserReplies.filter(r => r.id !== replyId);

                const { error: updateError } = await supabase
                    .from('Reviews')
                    .update({ UserReplies: updatedReplies })
                    .eq('Id', reviewId);

                if (updateError) throw updateError;

                // Формуємо текст сповіщення (обрізаємо надто довгі коментарі)
                const shortText = text.length > 50 ? text.substring(0, 50) + '...' : text;
                const notifMessage = `Ваш коментар «${shortText}» був видалений через неприйнятний вміст.`;

                const { error: notifError } = await supabase
                    .from('FavoriteNotifications')
                    .insert([{
                        UserNickname: author,
                        PetId: 0,
                        PetName: 'Модерація',
                        NewStatus: notifMessage,
                        IsRead: false
                    }]);

                if (notifError) throw notifError;

                showToast("🗑️ Коментар успішно видалено!");
                setReviews(prev => prev.map(r => r.Id === reviewId ? { ...r, UserReplies: updatedReplies } : r));
            } else if (type === 'admin') {
                const { error } = await supabase
                    .from('Reviews')
                    .update({ AdminReply: null })
                    .eq('Id', reviewId);

                if (error) throw error;

                showToast("🗑️ Відповідь успішно видалено!");
                setReviews(prev => prev.map(r => r.Id === reviewId ? { ...r, AdminReply: null } : r));
            }
        } catch (err) {
            showToast("❌ Помилка видалення: " + err.message);
        }
    };

    return (
        <div className="admin-main" style={{ position: 'relative' }}>
            <div className="admin-page-layout">
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
                                                title="Видалити відгук повністю"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <p className="admin-review-text">{review.Text}</p>

                                        {/* Відображення відповідей користувачів для адміна */}
                                        {review.UserReplies && review.UserReplies.length > 0 && (
                                            <div style={{ margin: '15px 0', padding: '15px', background: '#f4f5fa', borderRadius: '12px' }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666680' }}>💬 Коментарі користувачів:</h4>
                                                {review.UserReplies.map(reply => (
                                                    <div key={reply.id} className="user-reply-item">
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <strong style={{ color: '#4A148C' }}>@{reply.author}:</strong>
                                                            <span style={{ color: '#444' }}>{reply.text}</span>
                                                        </div>
                                                        <button 
                                                            className="delete-reply-icon-btn" 
                                                            onClick={() => confirmDeleteUserReplyClick(review.Id, reply)}
                                                            title="Видалити коментар"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Блок відповіді адміна */}
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
                                                            <div className="existing-reply-actions">
                                                                <button className="edit-reply-btn" onClick={() => handleOpenReply(review)}>
                                                                    ✎ Редагувати
                                                                </button>
                                                                <button className="delete-admin-reply-btn" onClick={() => confirmDeleteAdminReplyClick(review.Id)}>
                                                                    × Видалити
                                                                </button>
                                                            </div>
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

            {/* ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ЦІЛОГО ВІДГУКУ */}
            {reviewToDelete && (
                <div 
                    className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} 
                    onClick={closeConfirmDialog}
                    style={{ zIndex: 10000 }}
                >
                    <div 
                        className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} 
                        style={{ maxWidth: '400px', textAlign: 'center' }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: '#ef4444', fontSize: '24px', margin: '0 0 15px 0', fontWeight: '800' }}>⚠️ Видалення відгуку</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
                            Ви дійсно хочете назавжди видалити цей відгук? Цю дію неможливо скасувати.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={closeConfirmDialog}>Скасувати</button>
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

            {/* ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ КОМЕНТАРЯ (ЮЗЕРА АБО АДМІНА) */}
            {replyToDelete && (
                <div 
                    className={`modal-overlay ${isReplyModalClosing ? 'closing' : ''}`} 
                    onClick={closeReplyConfirmDialog}
                    style={{ zIndex: 10001 }}
                >
                    <div 
                        className={`admin-modal confirm-modal ${isReplyModalClosing ? 'closing' : ''}`} 
                        style={{ maxWidth: '400px', textAlign: 'center' }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: '#ef4444', fontSize: '24px', margin: '0 0 15px 0', fontWeight: '800' }}>⚠️ Видалення коментаря</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
                            {replyToDelete.type === 'user' 
                                ? `Ви дійсно хочете видалити коментар від @${replyToDelete.author}? Користувач отримає сповіщення із текстом видаленого коментаря.`
                                : `Ви дійсно хочете видалити свою офіційну відповідь?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={closeReplyConfirmDialog}>Скасувати</button>
                            <button
                                className="save-btn"
                                style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                                onClick={executeReplyDelete}
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