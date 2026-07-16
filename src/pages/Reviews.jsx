import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../supabaseClient';
import './Reviews.css';
import { useToast } from '../context/ToastContext'; // 👈 Глобальні тости

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { isLoggedIn, userId, nickname } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast(); // 👈 Ініціалізуємо тости

  // 1. ДИНАМІЧНЕ ЗАВАНТАЖЕННЯ ВІДГУКІВ ТА АКТУАЛЬНИХ ТВАРИН
  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('Reviews')
        .select('*')
        .order('Id', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Тваринки, яких прихистив автор відгуку, рахуємо через Pets.OwnerUserId
      // (Pets читаються публічно; profiles закриті RLS — тому не через них).
      const ownerIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];

      if (ownerIds.length > 0) {
        const { data: petsData, error: petsError } = await supabase
          .from('Pets')
          .select('Id, ImageName, OwnerUserId')
          .in('OwnerUserId', ownerIds)
          .eq('Status', 'Вже вдома');

        if (!petsError && petsData) {
          const currentPetsMap = {};
          petsData.forEach(p => {
            if (!currentPetsMap[p.OwnerUserId]) currentPetsMap[p.OwnerUserId] = [];
            currentPetsMap[p.OwnerUserId].push({ id: p.Id, image: p.ImageName });
          });

          const updatedReviews = reviewsData.map(review => ({
            ...review,
            DynamicPets: currentPetsMap[review.user_id] || []
          }));

          setReviews(updatedReviews);
          return;
        }
      }

      const fallbackReviews = reviewsData.map(review => ({ ...review, DynamicPets: [] }));
      setReviews(fallbackReviews);

    } catch (err) {
      console.error("Помилка завантаження відгуків:", err);
    }
  };

  useEffect(() => {
    fetchReviews();

    if (isLoggedIn) {
        const avatar = localStorage.getItem('profileAvatar') || '/ava.png';
        setCurrentUser({ nickname, avatar });
    } else {
        setCurrentUser(null);
    }
  }, [isLoggedIn, nickname]);

  const handleInteraction = (e) => {
    if (!isLoggedIn) {
      e.preventDefault(); 
      navigate('/login', {
        state: { welcomeMsg: '🐾 Будь ласка, увійдіть в систему, щоб залишити відгук' }
      });
    }
  };

  // 2. ВІДПРАВКА НОВОГО ВІДГУКУ
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      handleInteraction(e);
      return;
    }

    if (!text.trim()) return;
    setIsLoading(true);

    const avatar = localStorage.getItem('profileAvatar') || '/ava.png';
    const today = new Date();
    const formattedDate = today.toLocaleDateString('uk-UA');

    try {
        const { error } = await supabase.from('Reviews').insert([{
            Name: nickname,
            UserNickname: nickname,
            user_id: userId,
            UserAvatar: avatar,
            AdoptedPets: [],
            Text: text,
            Date: formattedDate,
            UserReplies: []
        }]);

        if (error) throw error;

        setText('');
        fetchReviews(); 
    } catch (error) {
        console.error("Помилка збереження:", error.message);
        showToast("❌ Не вдалося відправити відгук. Спробуйте пізніше."); // 👈 Замінено alert
    } finally {
        setIsLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId, existingReplies) => {
    if (!replyText.trim()) return;
    setIsLoading(true);

    const nickname = currentUser.nickname;
    const avatar = currentUser.avatar;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('uk-UA')} ${now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;

    const newReply = {
        id: Date.now().toString(),
        author: nickname,
        avatar: avatar,
        text: replyText,
        date: formattedDate
    };

    const currentReplies = Array.isArray(existingReplies) ? existingReplies : [];
    const updatedReplies = [...currentReplies, newReply];

    try {
        const { error } = await supabase
            .from('Reviews')
            .update({ UserReplies: updatedReplies })
            .eq('Id', reviewId);

        if (error) throw error;

        setReplyingToId(null);
        setReplyText('');
        fetchReviews();
    } catch (error) {
        console.error("Помилка збереження відповіді:", error.message);
        showToast("❌ Не вдалося відправити відповідь."); // 👈 Замінено alert
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="reviews-section">
      <div className="reviews-title-container">
        <h2>Відгуки</h2>
        <img src="/2lapki.png" alt="Лапки" className="title-lapki" />
      </div>

      <div className="reviews-content-wrapper">
        <div className="review-write-container">
          <img src="/catik.png" alt="Котик" className="cat-icon" />
          <img src="/dogik.png" alt="Собачка" className="dog-icon" />

          <form className="modern-review-form" onSubmit={handleSubmit}>
            {isLoggedIn && currentUser ? (
                <div className="current-user-badge">
                    <img src={currentUser.avatar} alt="Ваш аватар" className="current-user-avatar" />
                    <span>Залишити відгук як <strong>{currentUser.nickname}</strong></span>
                </div>
            ) : (
                <div className="current-user-badge guest-badge">
                    <span>👤 Ви гість. Увійдіть, щоб поділитися враженнями.</span>
                </div>
            )}

            <div className="submit-container">
              <textarea
                id="review-text"
                className="form-textarea"
                placeholder={isLoggedIn ? "Поділіться своєю історією про AdoptMe..." : "Увійдіть, щоб писати..."}
                required
                maxLength="500"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onClick={handleInteraction} 
                readOnly={!isLoggedIn} 
              ></textarea>
              <button
                type="submit"
                className={`submit-btn ${!text.trim() ? 'disabled' : ''}`}
                disabled={isLoading || !isLoggedIn}
                onClick={handleInteraction} 
              >
                {isLoading ? '...' : <img src="/Send.png" alt="Відправити" />}
              </button>
            </div>
          </form>
        </div>

        <div className="review-card-list">
          {reviews.length === 0 && <p style={{ textAlign: 'center', color: 'white', fontSize: '20px' }}>Поки що немає відгуків. Будьте першим!</p>}

          {reviews.map((review) => (
            <div className="modern-review-card" key={review.Id}>
              
              <div className="review-header">
                <div className="review-author-group">
                    <div className="avatars-cluster">
                        <img src={review.UserAvatar || '/ava.png'} alt="Аватар" className="review-avatar" />
                        
                        {review.DynamicPets && review.DynamicPets.length > 0 && (
                            <div className="pet-bubbles">
                                {review.DynamicPets.map((petData, idx) => {
                                    const petId = petData.id;
                                    const petImage = petData.image;

                                    const imgElement = (
                                        <img 
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${petImage}`} 
                                            alt="Тваринка" 
                                            className="pet-bubble-img" 
                                            title="Переглянути анкету"
                                        />
                                    );

                                    return petId ? (
                                        <Link to={`/pets/${petId}`} key={idx} className="pet-bubble-link">
                                            {imgElement}
                                        </Link>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="review-author-info">
                        <span className="review-name">{review.UserNickname}</span>
                    </div>
                </div>

                <div className="review-meta">
                    <span className="review-date">{review.Date}</span>
                </div>
              </div>

              <div className="review-body">
                  <p className="review-text">{review.Text}</p>
              </div>

              {review.AdminReply && (
                <div className="admin-reply-box">
                  <strong className="admin-reply-title">🐾 Відповідь адміністрації</strong>
                  <p className="admin-reply-text">
                    {review.AdminReply}
                  </p>
                </div>
              )}

              {review.UserReplies && review.UserReplies.length > 0 && (
                  <div className="user-replies-section">
                      {review.UserReplies.map(reply => (
                          <div className="user-reply-item" key={reply.id}>
                              <img src={reply.avatar || '/ava.png'} alt="Аватар" className="user-reply-avatar" />
                              <div className="user-reply-content">
                                  <div className="user-reply-header">
                                      <span className="user-reply-author">{reply.author}</span>
                                      <span className="user-reply-date">{reply.date}</span>
                                  </div>
                                  <p className="user-reply-text">{reply.text}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <div className="review-actions">
                  <button 
                      className="reply-toggle-btn"
                      onClick={(e) => {
                          if(!isLoggedIn) {
                              handleInteraction(e);
                          } else {
                              setReplyingToId(replyingToId === review.Id ? null : review.Id);
                              setReplyText('');
                          }
                      }}
                  >
                      {replyingToId === review.Id ? 'Скасувати' : '💬 Відповісти'}
                  </button>
              </div>

              {replyingToId === review.Id && (
                  <div className="user-reply-form">
                      <textarea
                          className="reply-textarea"
                          placeholder={`Відповісти ${review.UserNickname}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength="300"
                      />
                      <button 
                          className="send-reply-btn"
                          onClick={() => handleReplySubmit(review.Id, review.UserReplies)}
                          disabled={isLoading || !replyText.trim()}
                      >
                          {isLoading ? '...' : 'Надіслати'}
                      </button>
                  </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reviews;