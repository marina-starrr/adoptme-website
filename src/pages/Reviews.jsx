import { useState, useEffect } from 'react';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  // Стан для форми (щоб React запам'ятовував, що ти друкуєш)
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  // Функція для завантаження відгуків
  const fetchReviews = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error("Помилка завантаження:", err));
  };

  // Завантажуємо відгуки один раз при відкритті сторінки
  useEffect(() => {
    fetchReviews();
  }, []);

  // Функція відправки нового відгуку
  const handleSubmit = (e) => {
    e.preventDefault(); // Зупиняє перезавантаження сторінки
    
    const newReview = { name: name, text: text };

    fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
    })
    .then(res => {
        if (res.ok) {
            // Очищаємо форму
            setName(''); 
            setText('');
            // Завантажуємо оновлений список відгуків з бази
            fetchReviews(); 
        }
    });
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
                        <button type="submit" className="submit-btn">
                            <img src="/Send.png" alt="Відправити" />
                        </button>
                    </div>
                </form>
            </div>

            {/* СПИСОК ВІДГУКІВ З SQL */}
            <div className="review-card-list">
                {reviews.length === 0 && <p style={{textAlign: 'center', color: 'white'}}>Поки що немає відгуків. Будьте першим!</p>}
                
                {reviews.map((review) => (
                    <div className="review-card" key={review.id}>
                        <div className="review-header">
                            <span className="review-name">{review.name}</span>
                            <span className="review-date">{review.date}</span>
                        </div>
                        <p className="review-text">{review.text}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default Reviews;