import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register(formData);
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err.response?.data);
            const errors = err.response?.data;
            let errorMsg = 'Error al registrar. Verifica los datos e intenta nuevamente.';
            if (errors?.username) errorMsg = `Usuario: ${Array.isArray(errors.username) ? errors.username[0] : errors.username}`;
            else if (errors?.email) errorMsg = `Email: ${Array.isArray(errors.email) ? errors.email[0] : errors.email}`;
            else if (errors?.password) errorMsg = `Contraseña: ${Array.isArray(errors.password) ? errors.password[0] : errors.password}`;
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo">C</div>
                    <h1>Crea tu cuenta</h1>
                    <p>Únete a la plataforma de colaboración</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellido</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Tu apellido"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Nombre de usuario"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                </form>

                <p className="auth-link">
                    ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
