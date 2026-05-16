import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');
            
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            
            if (token) {
                try {
                    const userData = await authService.getCurrentUser();
                    const userWithRoles = {
                        ...userData,
                        is_admin: userData.role === 'admin',
                        is_professor: userData.role === 'professor',
                        is_student: userData.role === 'student'
                    };
                    setUser(userWithRoles);
                    localStorage.setItem('user', JSON.stringify(userWithRoles));
                } catch (error) {
                    console.error('Error fetching user:', error);
                    authService.logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username, password) => {
        await authService.login(username, password);
        const userData = await authService.getCurrentUser();
        const userWithRoles = {
            ...userData,
            is_admin: userData.role === 'admin',
            is_professor: userData.role === 'professor',
            is_student: userData.role === 'student'
        };
        setUser(userWithRoles);
        localStorage.setItem('user', JSON.stringify(userWithRoles));
    };

    const logout = () => {
        authService.logout();
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
