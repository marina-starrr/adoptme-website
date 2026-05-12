import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(() => {
        // При завантаженні перевіряємо, чи є запис у пам'яті
        return localStorage.getItem('isAdmin') === 'true';
    });

    const login = () => {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);