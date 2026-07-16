import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Слухаємо сесію Supabase Auth (замість localStorage)
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            if (!data.session) setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    // 2. Підвантажуємо профіль (нікнейм + роль) при зміні сесії
    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            if (!session) {
                setProfile(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('id, nickname, first_name, last_name, phone, avatar_url, role')
                .eq('id', session.user.id)
                .single();

            if (!cancelled) {
                setProfile(data ?? null);
                setLoading(false);
            }
        }

        loadProfile();
        return () => { cancelled = true; };
    }, [session]);

    const logout = async () => {
        await supabase.auth.signOut();
        // Прибираємо застарілі ключі старої системи авторизації
        localStorage.removeItem('userNickname');
        localStorage.removeItem('userRole');
        localStorage.removeItem('favorites');
        setSession(null);
        setProfile(null);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const value = {
        session,
        profile,
        loading,
        isLoggedIn: !!session,
        userId: session?.user?.id ?? null,
        nickname: profile?.nickname ?? null,
        role: profile?.role ?? null,
        logout,

        // Зворотна сумісність зі старим кодом (поки переписані не всі місця):
        userRole: profile?.role ?? null,
        userEmail: session?.user?.email ?? null,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
