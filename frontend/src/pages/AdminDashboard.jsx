import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService, taskService, userService } from '../services';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTeams: 0,
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        admins: 0,
        professors: 0,
        students: 0,
    });
    const [recentTasks, setRecentTasks] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, teamsRes, tasksRes] = await Promise.all([
                userService.getAll(),
                teamService.getAll(),
                taskService.getAll(),
            ]);

            const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || []);
            const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);

            setStats({
                totalUsers: usersData.length,
                totalTeams: teamsData.length,
                totalTasks: tasksData.length,
                pendingTasks: tasksData.filter(t => t.status === 'pending').length,
                inProgressTasks: tasksData.filter(t => t.status === 'in_progress').length,
                completedTasks: tasksData.filter(t => t.status === 'completed').length,
                admins: usersData.filter(u => u.role === 'admin').length,
                professors: usersData.filter(u => u.role === 'professor').length,
                students: usersData.filter(u => u.role === 'student').length,
            });

            setRecentTasks(tasksData.slice(0, 5));
            setRecentUsers(usersData.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading"></div>;

    const completionRate = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
        : 0;

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <h1>Panel de Administración</h1>
                <button className="btn-secondary" onClick={fetchData}>Actualizar</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card admin">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Total Usuarios</h3>
                        <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                </div>
                <div className="stat-card admin">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-info">
                        <h3>Total Equipos</h3>
                        <p className="stat-number">{stats.totalTeams}</p>
                    </div>
                </div>
                <div className="stat-card admin">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <h3>Total Tareas</h3>
                        <p className="stat-number">{stats.totalTasks}</p>
                    </div>
                </div>
                <div className="stat-card admin highlight">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>Tasa de Completado</h3>
                        <p className="stat-number">{completionRate}%</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="section-card admin">
                    <h2>Usuarios por Rol</h2>
                    <div className="role-stats">
                        <div className="role-item">
                            <span className="role-badge admin">Administrador</span>
                            <span className="role-count">{stats.admins}</span>
                        </div>
                        <div className="role-item">
                            <span className="role-badge professor">Profesor</span>
                            <span className="role-count">{stats.professors}</span>
                        </div>
                        <div className="role-item">
                            <span className="role-badge student">Estudiante</span>
                            <span className="role-count">{stats.students}</span>
                        </div>
                    </div>
                    <Link to="/admin/users" className="view-all-link">Ver todos los usuarios →</Link>
                </div>

                <div className="section-card admin">
                    <h2>Estado de Tareas</h2>
                    <div className="task-status-list">
                        <div className="task-status-item">
                            <span className="status-dot pending"></span>
                            <span>Pendientes</span>
                            <span className="status-count">{stats.pendingTasks}</span>
                        </div>
                        <div className="task-status-item">
                            <span className="status-dot in-progress"></span>
                            <span>En Progreso</span>
                            <span className="status-count">{stats.inProgressTasks}</span>
                        </div>
                        <div className="task-status-item">
                            <span className="status-dot completed"></span>
                            <span>Completadas</span>
                            <span className="status-count">{stats.completedTasks}</span>
                        </div>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${completionRate}%` }}
                        ></div>
                    </div>
                    <Link to="/tasks" className="view-all-link">Ver todas las tareas →</Link>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="section-card admin">
                    <div className="section-header">
                        <h2>Últimos Usuarios</h2>
                        <Link to="/admin/users">Ver todos</Link>
                    </div>
                    {recentUsers.length === 0 ? (
                        <p className="empty-message">No hay usuarios registrados</p>
                    ) : (
                        <ul className="recent-list">
                            {recentUsers.map(user => (
                                <li key={user.id} className="recent-item">
                                    <div className="user-avatar-small">
                                        {user.first_name?.[0] || user.username?.[0] || 'U'}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{user.first_name} {user.last_name}</span>
                                        <span className="user-username">@{user.username}</span>
                                    </div>
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role === 'admin' ? 'Admin' : user.role === 'professor' ? 'Profesor' : 'Estudiante'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="section-card admin">
                    <div className="section-header">
                        <h2>Tareas Recientes</h2>
                        <Link to="/tasks">Ver todas</Link>
                    </div>
                    {recentTasks.length === 0 ? (
                        <p className="empty-message">No hay tareas</p>
                    ) : (
                        <ul className="recent-list">
                            {recentTasks.map(task => (
                                <li key={task.id} className="recent-item">
                                    <div className={`task-indicator ${task.status}`}></div>
                                    <div className="task-info">
                                        <span className="task-title">{task.title}</span>
                                        <span className="task-team">{task.team_name || 'Sin equipo'}</span>
                                    </div>
                                    <span className={`status-badge ${task.status}`}>
                                        {task.status === 'pending' ? 'Pendiente' : 
                                         task.status === 'in_progress' ? 'En Progreso' : 'Completada'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="quick-links">
                <h2>Acciones Rápidas</h2>
                <div className="links-grid">
                    <Link to="/admin/users" className="quick-link">
                        <span>👥</span>
                        <span>Gestionar Usuarios</span>
                    </Link>
                    <Link to="/teams" className="quick-link">
                        <span>🏫</span>
                        <span>Ver Equipos</span>
                    </Link>
                    <Link to="/tasks" className="quick-link">
                        <span>📋</span>
                        <span>Administrar Tareas</span>
                    </Link>
                    <Link to="/calendar" className="quick-link">
                        <span>📅</span>
                        <span>Ver Calendario</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;