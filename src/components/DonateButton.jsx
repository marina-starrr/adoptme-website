import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonateButton.css';
import { useToast } from '../context/ToastContext'; // 👈 Глобальні тости

function DonateButton() {
    const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const navigate = useNavigate(); 
    const { showToast } = useToast(); // 👈 Ініціалізуємо тости

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast('✅ Реквізити скопійовано!'); // 👈 Замінено alert
    };

    // Закриття модалки на хрестик або клік по фону
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsDonateModalOpen(false);
            setIsClosing(false);
        }, 300);
    };

    // Спеціальна функція для посилання
    const handleHelpClick = (e) => {
        e.preventDefault(); 
        setIsClosing(true); 
        
        setTimeout(() => {
            setIsDonateModalOpen(false);
            setIsClosing(false);
            navigate('/help'); 
        }, 300);
    };

    return (
        <>
            <button 
                className="support-btn donate-btn-main" 
                onClick={() => setIsDonateModalOpen(true)}
            >
                Підтримати <span className="heart-icon">❤</span>
            </button>

            {isDonateModalOpen && (
                <div className={`donate-special-overlay ${isClosing ? 'closing-overlay' : ''}`} onClick={handleClose}>
                    <div className={`donate-modal ${isClosing ? 'closing-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={handleClose}>&times;</button>
                        
                        <h2>Допомогти притулку 🐾</h2>
                        <p className="modal-desc">Кожна ваша гривня — це нагодований хвостик та шанс на нову родину.</p>

                        <div className="donate-content">
                            <div className="qr-section">
                                <img src="/qr.jpg" alt="QR Код для оплати" className="qr-img" />
                                <span>Скануйте для швидкого донату</span>
                            </div>

                            <div className="requisites-section">
                                <div className="req-item">
                                    <label>IBAN:</label>
                                    <div className="copy-box">
                                        <code>UA883052990262046400993678933</code>
                                        <button onClick={() => copyToClipboard('UA883052990262046400993678933')} title="Скопіювати">📋</button>
                                    </div>
                                </div>

                                <div className="req-item">
                                    <label>Номер карти:</label>
                                    <div className="copy-box">
                                        <code>4149 6090 4390 2669</code>
                                        <button onClick={() => copyToClipboard('4149 6090 4390 2669')} title="Скопіювати">📋</button>
                                    </div>
                                </div>

                                <div className="req-item">
                                    <label>Призначення:</label>
                                    <p>Благодійна допомога для AdoptMe</p>
                                </div>
                            </div>
                        </div>

                        <div className="extra-help-section">
                            <a 
                                href="/help" 
                                onClick={handleHelpClick}
                                className="extra-help-link"
                            >
                                Як ще можна допомогти?
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DonateButton;