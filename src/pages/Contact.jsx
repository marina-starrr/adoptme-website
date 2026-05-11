import BackgroundPaws from '../components/BackgroundPaws'; // 👈 1. Імпортуємо лапки
import './Contact.css';

function Contact() {
  return (
    <>
      <div className="contact-section">
          
          {/* 👇 2. Викликаємо лапки! */}
          <BackgroundPaws />

          {/* 👇 3. Обгортаємо весь контент, щоб він був поверх лапок */}
          <div style={{ position: 'relative', zIndex: 2 }}>
              <div className="contact-header">
                  <img src="/brush4.png" alt="Фон" className="header-brush" />
                  <h2 className="header-text">Зворотній зв'язок</h2>
              </div>
              
              <div className="contact-images-container">
                  <img src="/catdog.png" alt="Call us" className="contact-image call-image" />
                  <img src="/line.png" alt="Line" className="contact-image line-image" />
              </div>  
              
              <div className="contact-cards-container">
                  {/* Картка 1 */}
                  <div className="contact-card">
                      <div className="inner-card">
                          <div className="card-title-row">
                              <img src="/tele.png" alt="Іконка телефону" className="card-icon" />
                              <h3 className="card-title">Зателефонуйте нам</h3>
                          </div>
                          <p className="card-info">(+380) 98 532 32 52</p>
                          <p className="card-info">(+380) 63 123 21 31</p>
                      </div>
                  </div>
                  
                  {/* Картка 2 */}
                  <div className="contact-card">
                      <div className="inner-card">
                          <div className="card-title-row">
                              <img src="/gps.png" alt="Іконка локації" className="card-icon" />
                              <h3 className="card-title">Відвідайте нас</h3>
                          </div>
                          <p className="card-info">Житомир, вул. Покровська, 96</p>
                          <p className="card-info">10031</p>
                      </div>
                  </div>
                  
                  {/* Картка 3 */}
                  <div className="contact-card">
                      <div className="inner-card">
                          <div className="card-title-row">
                              <img src="/sms.png" alt="Іконка листа" className="card-icon" />
                              <h3 className="card-title">Напишіть нам</h3>
                          </div>
                          <p className="card-info">adoptme@gmail.com</p>
                          <p className="card-info">meadopt@ukr.net</p>
                      </div>
                  </div>
                  
                  {/* Картка 4 */}
                  <div className="contact-card">
                      <div className="inner-card">
                          <div className="card-title-row">
                              <img src="/time.png" alt="Іконка годинника" className="card-icon" />
                              <h3 className="card-title">Години роботи</h3>
                          </div>
                          <p className="card-info">Пн-Пт: 08:30 – 16:30</p>
                          <p className="card-info">Сб-Нд: вихідний</p>
                      </div>
                  </div>
              </div>

              <div className="support-block">
                  <h3 className="support-title">Підтримайте нас:</h3>
                  <div className="support-content">
                      <img src="/qr.jpg" alt="QR-код для підтримки" className="qr-image" />
                      <img src="/33.png" alt="Зображення для підтримки" className="support-image" />
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}

export default Contact;