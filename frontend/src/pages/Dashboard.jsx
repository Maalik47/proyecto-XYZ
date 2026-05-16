import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService, taskService } from '../services';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        teams: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const fetchData = async () => {
        try {
            const [teamsRes, tasksRes] = await Promise.all([
                teamService.getAll(),
                taskService.getAll(),
            ]);
            const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);
            
            setStats({
                teams: teamsData.length,
                pending: tasksData.filter(t => t.status === 'pending').length,
                inProgress: tasksData.filter(t => t.status === 'in_progress').length,
                completed: tasksData.filter(t => t.status === 'completed').length,
            });
            setTasks(tasksData.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await taskService.update(task.id, { status: newStatus });
            fetchData();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    if (loading) return <div className="loading"></div>;

    if (user?.role === 'student') {
        return (
            <div className="dashboard student-dashboard">
                <div className="student-welcome">
                    <div className="welcome-header">
                        <h1>Bienvenido, {user.first_name || user.username}!</h1>
                        <p className="welcome-subtitle">Plataforma de Colaboración Estudiantil</p>
                    </div>
                    
                    <div className="student-stats-grid">
                        <Link to="/teams" className="student-stat-card">
                            <div className="stat-icon" style={{ background: '#dbeafe' }}>
                                <span>👥</span>
                            </div>
                            <div className="stat-content">
                                <h3>Equipos</h3>
                                <p className="stat-number">{stats.teams}</p>
                            </div>
                        </Link>
                        
                        <Link to="/tasks" className="student-stat-card">
                            <div className="stat-icon" style={{ background: '#fef3c7' }}>
                                <span>📋</span>
                            </div>
                            <div className="stat-content">
                                <h3>Tareas Pendientes</h3>
                                <p className="stat-number">{stats.pending}</p>
                            </div>
                        </Link>
                        
                        <Link to="/calendar" className="student-stat-card">
                            <div className="stat-icon" style={{ background: '#ede9fe' }}>
                                <span>📅</span>
                            </div>
                            <div className="stat-content">
                                <h3>En Progreso</h3>
                                <p className="stat-number">{stats.inProgress}</p>
                            </div>
                        </Link>
                        
                        <Link to="/tasks" className="student-stat-card">
                            <div className="stat-icon" style={{ background: '#d1fae5' }}>
                                <span>✅</span>
                            </div>
                            <div className="stat-content">
                                <h3>Completadas</h3>
                                <p className="stat-number">{stats.completed}</p>
                            </div>
                        </Link>
                    </div>

                    <div className="quick-actions">
                        <h2>Acciones Rápidas</h2>
                        <div className="action-buttons">
                            <Link to="/tasks" className="action-btn primary">
                                Ver Tareas
                            </Link>
                            <Link to="/teams" className="action-btn secondary">
                                Unirse a Equipos
                            </Link>
                            <Link to="/calendar" className="action-btn secondary">
                                Ver Calendario
                            </Link>
                        </div>
                    </div>

                    <div className="recent-activity">
                        <h2>Actividad Reciente</h2>
                        {tasks.length === 0 ? (
                            <div className="no-activity">
                                <p>No hay actividad reciente. ¡Explora los equipos disponibles!</p>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {tasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="activity-item">
                                        <div className={`activity-indicator ${task.status}`}></div>
                                        <div className="activity-content">
                                            <h4>{task.title}</h4>
                                            <span className={`status-tag ${task.status}`}>
                                                {task.status === 'in_progress' ? 'En Progreso' : 
                                                 task.status === 'pending' ? 'Pendiente' : 'Completada'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>Bienvenido</h1>
                <button className="btn-secondary" onClick={fetchData}>Actualizar</button>
            </div>
            <p className="dashboard-subtitle">Resumen de tu actividad</p>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="icon blue">👥</div>
                    <h3>Equipos</h3>
                    <p className="stat-number">{stats.teams}</p>
                </div>
                <div className="stat-card">
                    <div className="icon yellow">⏳</div>
                    <h3>Pendientes</h3>
                    <p className="stat-number">{stats.pending}</p>
                </div>
                <div className="stat-card">
                    <div className="icon purple">🔄</div>
                    <h3>En Progreso</h3>
                    <p className="stat-number">{stats.inProgress}</p>
                </div>
                <div className="stat-card">
                    <div className="icon green">✅</div>
                    <h3>Completadas</h3>
                    <p className="stat-number">{stats.completed}</p>
                </div>
            </div>

            <div className="section-card">
                <div className="section-header">
                    <h2>Tareas Recientes</h2>
                    <Link to="/tasks">Ver todas</Link>
                </div>
                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📋</div>
                        <h3>No hay tareas</h3>
                        <p>Crea tu primera tarea para comenzar</p>
                    </div>
                ) : (
                    <ul className="task-list">
                        {tasks.map((task) => (
                            <li key={task.id} className="task-item">
                                <div className="task-info">
                                    <div
                                        className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}`}
                                        onClick={() => handleStatusToggle(task)}
                                    />
                                    <span className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <div className="task-meta">
                                    <span className={`priority-badge ${task.priority}`}>
                                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                    </span>
                                    <span className={`status-badge ${task.status}`}>
                                        {task.status === 'in_progress' ? 'En Progreso' : task.status === 'pending' ? 'Pendiente' : 'Completada'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
