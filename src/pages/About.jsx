import './About.css';

function About() {
  return (
    <div className="about-us">
        <div className="about-us-relative-wrapper">
            {/* Заголовок з відображенням */}
            <div className="adopt-me-title-block">
                <div className="adopt-me-title">adopt me</div>
                <div className="adopt-me-title-reflection">adopt me</div>
            </div>

            <div className="overlay-text-container">
                Ми не просто притулок, а дім для тих, хто втратив усе. Ми надаємо прихисток бездомним тваринам, що потребують лікування, любові та догляду.
            </div>    
            
            {/* Картинки з папки public */}
            <img src="/1.png" alt="Зображення 1" className="image-1-positioned" />
            <img src="/2.png" alt="Зображення 2" className="image-2-positioned" />
            
            <div className="image-12-positioned">
                Наша місія — не тільки врятувати, а й знайти для кожного пухнастого друга люблячу сім'ю.
            </div>
            
            <img src="/4.png" alt="Зображення 4" className="image-4-positioned" />
            
            <div className="image-13-positioned">
                Кожна тварина, яка потрапляє до нас, отримує повний ветеринарний огляд, необхідні щеплення та стерилізацію.
            </div>
            
            <img src="/3.png" alt="Зображення 3" className="image-3-positioned" />
            
            <div className="image-14-positioned">
                Наші волонтери щодня дарують їм свою турботу, займаються соціалізацією та підготовкою до життя в родині.
            </div>
            
            <img src="/5.png" alt="Зображення 5" className="image-5-positioned" />
            <img src="/6.png" alt="Зображення 6" className="image-6-positioned" /> 
            
            <div className="image-15-positioned">
                Завдяки вашій підтримці, ми даруємо їм другий шанс на щасливе життя. Допоможіть нам змінити їхню долю.
            </div>
        </div>
    </div>
  );
}

export default About;