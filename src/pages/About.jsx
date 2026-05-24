import './About.css';
import { useToast } from '../context/ToastContext';

function About() {
  return (
    <div className="about-us">
        <div className="about-us-relative-wrapper">
            
            {/* БЛОК 1: ВІЗУАЛЬНА ЧАСТИНА (Збережено вашу стилістику) */}
            <div className="absolute-visuals-container">
                <div className="adopt-me-title-block">
                    <div className="adopt-me-title">adopt me</div>
                    <div className="adopt-me-title-reflection">adopt me</div>
                </div>

                <div className="overlay-text-container">
                    Ми не просто притулок — ми перевалочний пункт між минулим, сповненим болю, та щасливим майбутнім. Ми даруємо прихисток, лікування та безмежну любов тим, хто втратив усе.
                </div>    
                
                <img src="/1.png" alt="Зображення 1" className="image-1-positioned" />
                <img src="/2.png" alt="Зображення 2" className="image-2-positioned" />
                
                <div className="image-12-positioned">
                    Наша місія — не тільки врятувати життя, а й знайти для кожного пухнастого друга його справжню, люблячу сім'ю.
                </div>
                
                <img src="/4.png" alt="Зображення 4" className="image-4-positioned" />
                
                <div className="image-13-positioned">
                    Кожна тварина, яка потрапляє до нас, проходить повний ветеринарний огляд, отримує необхідні щеплення, обробку від паразитів та стерилізацію.
                </div>
                
                <img src="/3.png" alt="Зображення 3" className="image-3-positioned" />
                
                <div className="image-14-positioned">
                    Наші волонтери щодня працюють з хвостиками: соціалізують їх, вчать довіряти людям та готують до комфортного життя в домі.
                </div>
                
                <img src="/5.png" alt="Зображення 5" className="image-5-positioned" />
                <img src="/6.png" alt="Зображення 6" className="image-6-positioned" /> 
                
                <div className="image-15-positioned">
                    Завдяки вашій підтримці ми даруємо їм другий шанс. Допоможіть нам змінити їхню долю — прихистіть друга!
                </div>
            </div>

            {/* БЛОК 2: НОВИЙ РОЗДІЛ "УМОВИ АДАПТАЦІЇ" */}
            <div className="adaptation-section">
                <div className="adaptation-header">
                    <h2>Шлях до нового життя</h2>
                    <p>Як ми піклуємося про тварин і як допомогти їм адаптуватися у вашому домі</p>
                </div>

                <div className="adaptation-grid">
                    {/* Етап 1 */}
                    <div className="adapt-card">
                        <div className="adapt-icon-wrapper">
                            <span className="adapt-icon">🏥</span>
                        </div>
                        <h3>Перші дні в притулку</h3>
                        <p>Нові тваринки проходять обов'язковий карантин. Ми забезпечуємо їм спокій, тепло та тишу, щоб знизити рівень стресу. Ветеринари проводять огляд та призначають лікування, якщо це необхідно.</p>
                    </div>

                    {/* Етап 2 */}
                    <div className="adapt-card">
                        <div className="adapt-icon-wrapper">
                            <span className="adapt-icon">🤝</span>
                        </div>
                        <h3>Соціалізація</h3>
                        <p>Після карантину починається найважливіше — відновлення довіри. Волонтери поступово привчають їх до рук, повідця та інших тварин. Любов і терпіння допомагають подолати будь-які страхи.</p>
                    </div>

                    {/* Етап 3 */}
                    <div className="adapt-card">
                        <div className="adapt-icon-wrapper">
                            <span className="adapt-icon">🏡</span>
                        </div>
                        <h3>Переїзд у новий дім</h3>
                        <p>У перші дні вдома тваринка може ховатися або відмовлятися від їжі. Це нормально! Не змушуйте її до контакту. Облаштуйте їй затишний куточок-укриття і дайте час звикнути до нових запахів та звуків.</p>
                    </div>

                    {/* Етап 4 */}
                    <div className="adapt-card">
                        <div className="adapt-icon-wrapper">
                            <span className="adapt-icon">❤️</span>
                        </div>
                        <h3>Життя в родині</h3>
                        <p>Встановіть чіткий графік годування та прогулянок — рутина дає тваринам відчуття безпеки. Забезпечте якісний корм та безмежну любов. Пам'ятайте: куратори притулку завжди на зв'язку, щоб підтримати вас!</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}

export default About;