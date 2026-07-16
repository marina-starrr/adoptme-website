import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';
import { useToast } from '../context/ToastContext';

function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [ready, setReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showToast } = useToast();
    const navigate = useNavigate();

    // Supabase створює тимчасову recovery-сесію з посилання в листі.
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setReady(true);
            }
        });

        // На випадок, якщо подія відпрацювала до підписки
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) setReady(true);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            showToast('❌ Пароль має містити мінімум 6 символів!');
            return;
        }
        if (password !== confirmPassword) {
            showToast('❌ Паролі не збігаються!');
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsSubmitting(false);

        if (error) {
            showToast('❌ Помилка зміни пароля: ' + error.message);
            return;
        }

        await supabase.auth.signOut();
        navigate('/login', {
            state: { welcomeMsg: '✅ Пароль успішно змінено! Тепер увійдіть.' }
        });
    };

    return (
        <div className="login-page" style={{ position: 'relative' }}>
            <div className="login-card">
                <h2>Новий пароль 🔐</h2>

                {!ready ? (
                    <p style={{ textAlign: 'center' }}>
                        Перевіряємо посилання... Якщо ви відкрили цю сторінку не з листа
                        для відновлення пароля, поверніться на сторінку{' '}
                        <Link to="/forgot-password" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>
                            відновлення
                        </Link>.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p>Створіть новий пароль для свого акаунта</p>
                        <div className="input-group">
                            <label>Новий пароль</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Мінімум 6 символів"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="input-group">
                            <label>Повторіть пароль</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Повторіть пароль"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? '🐾 Зберігаємо...' : 'Зберегти пароль'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default UpdatePassword;
