import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Додали для переходу
import { useAuth } from '../context/AuthContext'; // 👈 Додали для перевірки авторизації
import { supabase } from '../supabaseClient';
import './Reviews.css';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isLoggedIn } = useAuth(); // 👈 Дізнаємося, чи увійшла людина
  const navigate = useNavigate(); // 👈 Інструмент для перенаправлення

  // 1. Функція для завантаження відгуків із Supabase
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('Reviews')
      .select('*')
      .order('Id', { ascending: false });

    if (error) {
      console.error("Помилка завантаження відгуків:", error);
    } else {
      setReviews(data);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 👇 Розумна функція перехоплення кліку для неавторизованих
  const handleInteraction = (e) => {
    if (!isLoggedIn) {
        e.preventDefault(); // Зупиняємо дію
        navigate('/login', { 
            state: { welcomeMsg: '🐾 Будь ласка, увійдіть в систему, щоб залишити відгук' } 
        });
    }
  };

  // 2. Функція відправки нового відгуку в Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Зайва перевірка на випадок, якщо хтось якось обійде блокування
    if (!isLoggedIn) {
        handleInteraction(e);
        return;
    }

    if (!name || !text) return; 
    
    setIsLoading(true);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('uk-UA');

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
      setName(''); 
      setText('');
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
                        // 👇 Динамічний плейсхолдер: підказує гостю, що треба увійти
                        placeholder={isLoggedIn ? "Вкажіть своє ім'я..." : "Увійдіть, щоб писати..."} 
                        required 
                        maxLength="20"
                        value={name}
                        onChange={(e) => setName(e.target.value)} 
                        onClick={handleInteraction} // 👈 Перехоплюємо клік
                        readOnly={!isLoggedIn} // 👈 Блокуємо клавіатуру для гостей
                    />
                    
                    <label htmlFor="review-text" className="form-label">Залиште відгук</label>
                    <div className="submit-container">
                        <textarea 
                            id="review-text" 
                            className="form-textarea review-text" 
                            placeholder={isLoggedIn ? "Введіть текст..." : "Увійдіть, щоб писати..."} 
                            required 
                            maxLength="500"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onClick={handleInteraction} // 👈 Перехоплюємо клік
                            readOnly={!isLoggedIn} // 👈 Блокуємо клавіатуру для гостей
                        ></textarea>
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={isLoading}
                            onClick={handleInteraction} // 👈 Перехоплюємо клік по кнопці
                        >
                            {isLoading ? '...' : <img src="/Send.png" alt="Відправити" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* СПИСОК ВІДГУКІВ З SQL */}
            <div className="review-card-list">
                {reviews.length === 0 && <p style={{textAlign: 'center', color: 'white'}}>Поки що немає відгуків. Будьте першим!</p>}
                
                {reviews.map((review) => (
                    <div className="review-card" key={review.Id}> 
                        <div className="review-header">
                            <span className="review-name">{review.Name}</span> 
                            <span className="review-date">{review.Date}</span> 
                        </div>
                        <p className="review-text">{review.Text}</p> 
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default Reviews;