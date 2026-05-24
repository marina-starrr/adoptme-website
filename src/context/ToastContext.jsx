import { createContext, useState, useContext, useCallback, useRef } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    // Використовуємо useRef замість useState для таймера. 
    // Це зберігає ID таймера, але НЕ викликає перемальовування!
    const timerRef = useRef(null);

    const showToast = useCallback((message) => {
        // Очищаємо попередній таймер, якщо він є
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Показуємо повідомлення
        setToast({ message, isVisible: true });

        // Запускаємо новий таймер на 3.5 секунди
        timerRef.current = setTimeout(() => {
            setToast((prev) => ({ ...prev, isVisible: false }));
        }, 3500);
        
    }, []); // Порожній масив залежностей: ця функція тепер створена один раз і назавжди

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={`global-toast ${toast.isVisible ? 'show' : ''}`}>
                {toast.message}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);