import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState('');
    const [dbQuestion, setDbQuestion] = useState('');
    const [dbAnswer, setDbAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [toastMsg, setToastMsg] = useState('');
    const navigate = useNavigate();

    const showToast = (message) => {
        setToastMsg(message);
        setTimeout(() => setToastMsg(''), 3500);
    };

    // Крок 1: Шукаємо користувача за нікнеймом
    const handleFindUser = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('Users')
                .select('SecretQuestion, SecretAnswer')
                .eq('Nickname', nickname.trim())
                .maybeSingle();

            if (error || !data) {
                showToast('❌ Користувача з таким нікнеймом не знайдено!');
                return;
            }

            if (!data.SecretQuestion) {
                showToast('❌ У цього акаунта не налаштоване секретне запитання.');
                return;
            }

            setDbQuestion(data.SecretQuestion);
            setDbAnswer(data.SecretAnswer);
            setStep(2); // Переходимо на крок 2
        } catch (err) {
            showToast('❌ Помилка з’єднання!');
        }
    };

    // Крок 2: Перевірка відповіді
    const handleVerifyAnswer = (e) => {
        e.preventDefault();
        // Порівнюємо у нижньому регістрі, щоб уникнути помилок з великими літерами
        if (userAnswer.trim().toLowerCase() === dbAnswer) {
            setStep(3); // Переходимо на крок 3 (введення нового пароля)
        } else {
            showToast('❌ Неправильна відповідь!');
        }
    };

    // Крок 3: Зміна пароля
    const handleResetPassword = async (e) => {
    e.preventDefault();

    // ДОДАЙ ЦЮ ПЕРЕВІРКУ:
    if (newPassword !== confirmPassword) {
        showToast('❌ Паролі не збігаються!');
        return;
    }

    if (newPassword.length < 6) {
        showToast('❌ Пароль має містити мінімум 6 символів!');
        return;
    }

    try {
        const { error } = await supabase
            .from('Users')
            .update({ Password: newPassword })
            .eq('Nickname', nickname.trim());

        if (error) {
            console.error("Помилка Supabase:", error); // Це допоможе побачити, що саме не так
            showToast('❌ Помилка при зміні пароля! Перевірте RLS.');
            return;
        }

        navigate('/login', {
            state: { welcomeMsg: '✅ Пароль успішно змінено! Тепер ви можете увійти.' }
        });

    } catch (err) {
        showToast('❌ Сталася помилка!');
    }
};

    return (
        <div className="login-page" style={{ position: 'relative' }}>
            {toastMsg && <div className="custom-toast">{toastMsg}</div>}

            <div className="login-card">
                <h2>Відновлення пароля 🔐</h2>

                {step === 1 && (
                    <form onSubmit={handleFindUser}>
                        <p>Введіть ваш Нікнейм, щоб ми знайшли ваш акаунт</p>
                        <div className="input-group">
                            <label>Нікнейм</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Ваш унікальний нікнейм"
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">Знайти акаунт</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyAnswer}>
                        <p style={{ fontWeight: 'bold', color: '#6d4ce4', marginBottom: '15px' }}>
                            Запитання: {dbQuestion}
                        </p>
                        <div className="input-group">
                            <label>Ваша відповідь</label>
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Введіть відповідь..."
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">Підтвердити</button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'gray', marginTop: '10px', cursor: 'pointer', width: '100%' }}>
                            Повернутися назад
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p>Відповідь правильна! Створіть новий пароль.</p>
                        <div className="input-group">
                            <label>Новий пароль</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Мінімум 6 символів"
                                required
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
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">Зберегти пароль</button>
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