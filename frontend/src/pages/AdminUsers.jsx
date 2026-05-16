import { useState, useEffect } from 'react';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setError(null);
            const response = await userService.getAll();
            setUsers(Array.isArray(response.data) ? response.data : (response.data.results || []));
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await userService.assignRole(userId, newRole);
            fetchUsers();
            alert('Rol actualizado exitosamente');
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error al actualizar el rol');
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { class: 'badge-admin', label: 'Administrador' },
            professor: { class: 'badge-professor', label: 'Profesor' },
            student: { class: 'badge-student', label: 'Estudiante' },
        };
        return badges[role] || badges.student;
    };

    if (loading) return <div className="loading"></div>;

    console.log('Current user role:', currentUser?.role);
    console.log('Is admin:', currentUser?.role === 'admin');

    if (currentUser?.role !== 'admin') {
        return (
            <div className="admin-page">
                <div className="access-denied">
                    <h2>Acceso Denegado</h2>
                    <p>Solo los administradores pueden acceder a esta página.</p>
                    <p>Tu rol actual: {currentUser?.role || 'No definido'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Administración de Usuarios</h1>
            </div>

            <div className="info-card">
                <h3>Información de Roles</h3>
                <div className="roles-info">
                    <div className="role-item">
                        <span className="badge badge-admin">Administrador</span>
                        <p>Acceso total al sistema. Puede asignar roles a otros usuarios.</p>
                    </div>
                    <div className="role-item">
                        <span className="badge badge-professor">Profesor</span>
                        <p>Puede crear equipos, agregar y eliminar integrantes.</p>
                    </div>
                    <div className="role-item">
                        <span className="badge badge-student">Estudiante</span>
                        <p>Puede ver equipos, participar en tareas y archivos.</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Nombre</th>
                            <th>Rol Actual</th>
                            <th>Cambiar Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const badge = getRoleBadge(user.role);
                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.first_name?.[0] || user.username?.[0]?.toUpperCase()}
                                            </div>
                                            <span>{user.username}</span>
                                        </div>
                                    </td>
                                    <td>{user.email || '-'}</td>
                                    <td>{user.first_name} {user.last_name}</td>
                                    <td>
                                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                                    </td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="role-select"
                                        >
                                            <option value="admin">Administrador</option>
                                            <option value="professor">Profesor</option>
                                            <option value="student">Estudiante</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
