import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; 
import { supabase } from '../supabaseClient';
import './Login.css';

function Login() {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // 👇 ДОДАНО: Стан завантаження для форми
    const navigate = useNavigate();
    const location = useLocation();

    const { login } = useAuth();
    const { showToast } = useToast(); 

    useEffect(() => {
        if (location.state?.welcomeMsg) {
            showToast(location.state.welcomeMsg);
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    const restoreAndMergeCart = async (userNickname) => {
        try {
            const { data: dbFavorites, error } = await supabase
                .from('Favorites')
                .select('PetId')
                .eq('UserNickname', userNickname);

            if (error) throw error;

            const dbPetIds = dbFavorites ? dbFavorites.map(f => f.PetId) : [];
            const guestPets = JSON.parse(localStorage.getItem('favorites')) || [];

            if (guestPets.length > 0) {
                for (const guestPet of guestPets) {
                    if (!dbPetIds.includes(guestPet.id)) {
                        await supabase
                            .from('Favorites')
                            .insert([{ UserNickname: userNickname, PetId: guestPet.id }]);
                        dbPetIds.push(guestPet.id);
                    }
                }
            }

            if (dbPetIds.length > 0) {
                const { data: fullPetsData, error: petsError } = await supabase
                    .from('Pets')
                    .select('*')
                    .in('Id', dbPetIds);

                if (petsError) throw petsError;

                const formattedFavorites = fullPetsData.map(pet => ({
                    id: pet.Id,
                    name: pet.Name,
                    image: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`
                }));

                localStorage.setItem('favorites', JSON.stringify(formattedFavorites));
            } else {
                localStorage.removeItem('favorites');
            }

            window.dispatchEvent(new Event('cartUpdated'));

        } catch (err) {
            console.error("Помилка синхронізації обраного:", err.message);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // 👇 Активуємо стан завантаження раніше

        try {
            const { data: user, error } = await supabase
                .from('Users')
                .select('*')
                .eq('Nickname', nickname.trim())
                .eq('Password', password)
                .maybeSingle();

            if (error) {
                showToast('❌ Помилка з’єднання з базою даних!');
                setIsSubmitting(false);
                return;
            }

            if (!user) {
                showToast('❌ Неправильний Нікнейм або Пароль!');
                setIsSubmitting(false);
                return;
            }

            // ⚡ ОНОВЛЕНО ЛОГІКУ: Спочатку у фоні виконуємо всі важкі операції з БД,
            // поки користувач бачить на кнопці текст завантаження.
            await restoreAndMergeCart(user.Nickname);

            // Тільки після того, як дані стовідсотково готові, записуємо роль та нікнейм
            localStorage.setItem('userNickname', user.Nickname);
            localStorage.setItem('userRole', user.Role);

            // Перемикаємо стан авторизації та викликаємо редирект в один момент
            login();
            window.dispatchEvent(new Event('authChanged'));

            if (user.Role === 'admin') {
                navigate('/admin/adoptions', { state: { welcomeMsg: 'Вітаємо в системі, Адміністраторе! 🐾' } });
            } else {
                navigate('/', { state: { welcomeMsg: 'Раді бачити вас знову! 🐾' } });
            }

        } catch (err) {
            showToast('❌ Сталася помилка при вході!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h2>Вхід у акаунт 🐾</h2>
                <p>Увійдіть за своїм індивідуальним нікнеймом</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Нікнейм</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Введіть свій нікнейм..."
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '5px' }}>
                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введіть пароль"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                        <Link to="/forgot-password" style={{ color: '#6d4ce4', fontSize: '14px', textDecoration: 'none' }}>
                            Забули пароль?
                        </Link>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? '🐾 Завантаження...' : 'Увійти'}
                    </button>
                </form>

                <div className="register-link-container" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p>Немає акаунту? <Link to="/register" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Зареєструватися</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Login;