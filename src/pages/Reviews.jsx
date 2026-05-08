import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // 👈 Додали імпорт Supabase
import './Reviews.css';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Функція для завантаження відгуків із Supabase
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('Reviews')
      .select('*')
      .order('Id', { ascending: false }); // Показувати нові відгуки першими

    if (error) {
      console.error("Помилка завантаження відгуків:", error);
    } else {
      setReviews(data);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 2. Функція відправки нового відгуку в Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !text) return; // Захист від порожніх повідомлень
    
    setIsLoading(true);

    // Отримуємо поточну дату у форматі ДД.ММ.РРРР
    const today = new Date();
    const formattedDate = today.toLocaleDateString('uk-UA');

    // Вставляємо рядок у таблицю Reviews
    const { error } = await supabase
      .from('Reviews')
      .insert([
        { 
          Name: name, 
          Text: text, 
          Date: formattedDate 
        }
      ]);

    setIsLoading(false);

    if (error) {
      console.error("Помилка збереження:", error.message);
      alert("Не вдалося відправити відгук. Спробуйте пізніше.");
    } else {
      // Очищаємо форму
      setName(''); 
      setText('');
      // Завантажуємо оновлений список відгуків з бази
      fetchReviews(); 
    }
  };
  
  return (
    <div className="reviews-section">
        <div className="reviews-title-container">
            <h2>Відгуки</h2>
            <img src="/2lapki.png" alt="Лапки" className="title-lapki" />
        </div>

        <div className="reviews-content-wrapper">
            {/* ФОРМА */}
            <div className="review-card-container">
                <img src="/catik.png" alt="Котик" className="cat-icon" />
                <img src="/dogik.png" alt="Собачка" className="dog-icon" />

                <form className="review-form" onSubmit={handleSubmit}>
                    <label htmlFor="nickname" className="form-label">Нікнейм</label>
                    <input 
                        type="text" 
                        id="nickname" 
                        className="form-input" 
                        placeholder="Вкажіть своє ім'я..." 
                        required 
                        maxLength="20"
                        value={name}
                        onChange={(e) => setName(e.target.value)} 
                    />
                    
                    <label htmlFor="review-text" className="form-label">Залиште відгук</label>
                    <div className="submit-container">
                        <textarea 
                            id="review-text" 
                            className="form-textarea review-text" 
                            placeholder="Введіть текст..." 
                            required 
                            maxLength="500"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        ></textarea>
                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {/* Якщо йде завантаження, ховаємо іконку, щоб користувач не клікав двічі */}
                            {isLoading ? '...' : <img src="/Send.png" alt="Відправити" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* СПИСОК ВІДГУКІВ З SQL */}
            <div className="review-card-list">
                {reviews.length === 0 && <p style={{textAlign: 'center', color: 'white'}}>Поки що немає відгуків. Будьте першим!</p>}
                
                {reviews.map((review) => (
                    <div className="review-card" key={review.Id}> {/* 👈 Змінено на review.Id з великої літери */}
                        <div className="review-header">
                            <span className="review-name">{review.Name}</span> {/* 👈 Змінено на review.Name */}
                            <span className="review-date">{review.Date}</span> {/* 👈 Змінено на review.Date */}
                        </div>
                        <p className="review-text">{review.Text}</p> {/* 👈 Змінено на review.Text */}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default Reviews;