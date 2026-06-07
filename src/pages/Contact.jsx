import React from 'react';
import { Link } from 'react-router-dom';
import BackgroundPaws from '../components/BackgroundPaws';
import './Contact.css';

function Contact() {
    return (
        <>
            <div className="contact-section">

                <BackgroundPaws />

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
                                <p className="card-info">(+380) 98 232 65 75</p>
                                <p className="card-info">(+380) 99 789 89 74</p>
                            </div>
                        </div>

                        {/* Картка 2 */}
                        <div className="contact-card">
                            <div className="inner-card">
                                <div className="card-title-row">
                                    <img src="/gps.png" alt="Іконка локації" className="card-icon" />
                                    <h3 className="card-title">Відвідайте нас</h3>
                                </div>
                                <p className="card-info">Київ, вул. Політехнічна, 39</p>
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
                                <p className="card-info">adoptme@ukr.net</p>
                            </div>
                        </div>

                        {/* Картка 4 */}
                        <div className="contact-card">
                            <div className="inner-card">
                                <div className="card-title-row">
                                    <img src="/time.png" alt="Іконка годинника" className="card-icon" />
                                    <h3 className="card-title">Години роботи</h3>
                                </div>
                                <p className="card-info">Пн-Сб: 08:30 – 16:30</p>
                                <p className="card-info">Нд: вихідний</p>
                            </div>
                        </div>
                    </div>

                    {/* ОНОВЛЕНА СЕКЦІЯ: Карта (зліва) та Відео (справа) */}
                    <div className="location-media-container">

                        {/* Ліва колонка: Карта */}
                        <div className="media-block">
                            <h3 className="section-subtitle">Як нас знайти</h3>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.6913246810614!2d30.456745076403454!3d50.44684997159147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4ce9d0d667fd7%3A0x1e0670521190adbb!2sPolitekhnichna%20St%2C%2039%2C%20Kyiv%2C%2002000!5e0!3m2!1sen!2sua!4v1780861772319!5m2!1sen!2sua"
                                width="100%"
                                height="350"
                                style={{ border: 0, borderRadius: '15px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Shelter Location"
                            ></iframe>
                        </div>

                        {/* Права колонка: Відео */}
                        <div className="media-block">
                            <h3 className="section-subtitle">Серце нашого притулку</h3>

                            {/* Варіант 1: Локальне відео (з папки public) */}
                            <video
                                src="/videop.mp4"
                                className="shelter-video"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                Ваш браузер не підтримує тег video.
                            </video>
                        </div>
                    </div>

                    <div className="support-block">
                        <h3 className="support-title">Підтримайте нас:</h3>
                        <div className="support-content">

                            <div className="qr-box">
                                <img src="/qr.jpg" alt="QR-код для підтримки" className="qr-image" />
                                <p className="qr-hint">Відскануйте для швидкого переказу</p>
                            </div>

                            <div className="requisites-box">
                                <div className="req-card">
                                    <h4>Банківська картка</h4>
                                    <p>4149 6090 4390 2669</p>
                                    <span>АТ "ПриватБанк" (Гривня)</span>
                                </div>
                                <div className="req-card">
                                    <h4>IBAN</h4>
                                    <p>UA883052990262046400993678933</p>
                                    <span>Отримувач: БО "Adopt Me"</span>
                                </div>
                                <div className="req-card">
                                    <h4>PayPal</h4>
                                    <p>adoptme.donate@gmail.com</p>
                                </div>
                            </div>

                            <img src="/33.png" alt="Зображення для підтримки" className="support-image" />
                        </div>
                    </div>

                    <div className="more-help-container">
                        <Link to="/help" className="more-help-btn">
                            Як можна ще допомогти?
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
}

export default Contact;