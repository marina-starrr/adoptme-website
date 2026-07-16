import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';
import { useToast } from '../context/ToastContext';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/update-password`,
        });

        setIsSubmitting(false);

        if (error) {
            showToast('❌ Не вдалося надіслати листа. Спробуйте пізніше.');
            return;
        }

        // Навмисно не розкриваємо, чи існує такий email (проти енумерації)
        setSent(true);
    };

    return (
        <div className="login-page" style={{ position: 'relative' }}>
            <div className="login-card">
                <h2>Відновлення пароля 🔐</h2>

                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '10px' }}>
                            Якщо акаунт із такою поштою існує, ми надіслали на неї
                            посилання для зміни пароля.
                        </p>
                        <p style={{ color: '#6d4ce4', fontSize: '14px' }}>
                            Перевірте вхідні та теку «Спам».
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p>Введіть email, вказаний при реєстрації</p>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vash@mail.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? '🐾 Надсилаємо...' : 'Надіслати посилання'}
                        </button>
                    </form>
                )}

                <div className="register-link-container" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: '#6d4ce4', fontWeight: 'bold' }}> повернутися до Входу</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
