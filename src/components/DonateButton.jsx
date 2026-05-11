import { useState } from 'react';
import './DonateButton.css'; // 👈 Додаємо імпорт стилів

function DonateButton() {
    const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Реквізити скопійовано!');
    };

    return (
        <>
            {/* КНОПКА ПІДТРИМАТИ */}
            {/* Додаємо твій клас support-btn, щоб зберегти розташування в хедері, та новий donate-btn-main для дизайну */}
            <button 
                className="support-btn donate-btn-main" 
                onClick={() => setIsDonateModalOpen(true)}
            >
                Підтримати <span className="heart-icon">❤</span>
            </button>

            {/* МОДАЛЬНЕ ВІКНО */}
            {isDonateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsDonateModalOpen(false)}>
                    <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setIsDonateModalOpen(false)}>&times;</button>
                        
                        <h2>Допомогти притулку 🐾</h2>
                        <p className="modal-desc">Кожна ваша гривня — це нагодований хвостик та шанс на нову родину.</p>

                        <div className="donate-content">
                            {/* ЛІВА ЧАСТИНА: QR-код */}
                            <div className="qr-section">
                                <img src="/qr.jpg" alt="QR Код для оплати" className="qr-img" />
                                <span>Скануйте для швидкого донату</span>
                            </div>

                            {/* ПРАВА ЧАСТИНА: Реквізити */}
                            <div className="requisites-section">
                                <div className="req-item">
                                    <label>IBAN:</label>
                                    <div className="copy-box">
                                        <code>UA123456789012345678901234567</code>
                                        <button onClick={() => copyToClipboard('UA123456789012345678901234567')} title="Скопіювати">📋</button>
                                    </div>
                                </div>

                                <div className="req-item">
                                    <label>Номер карти:</label>
                                    <div className="copy-box">
                                        <code>4441 1111 2222 3333</code>
                                        <button onClick={() => copyToClipboard('4441 1111 2222 3333')} title="Скопіювати">📋</button>
                                    </div>
                                </div>

                                <div className="req-item">
                                    <label>Призначення:</label>
                                    <p>Благодійна допомога для AdoptMe</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DonateButton;