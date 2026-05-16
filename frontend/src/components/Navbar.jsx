import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { directMessageService, notificationService } from '../services';
import { Bell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [dmNotifications, setDmNotifications] = useState([]);
    const [taskReminders, setTaskReminders] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [tasksViewed, setTasksViewed] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState('all');
    const notifRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            setTasksViewed(false);
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const [dmRes, taskRes, allNotifRes] = await Promise.all([
                directMessageService.getConversations(),
                notificationService.getTaskReminders(),
                notificationService.getAll(),
            ]);
            
            const dms = (dmRes.data || []).filter(c => c && c.unread_count > 0);
            setDmNotifications(dms);
            
            if (!tasksViewed) {
                setTaskReminders(taskRes.data || []);
            }
            
            setAllNotifications(allNotifRes.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleTaskReminderClick = async (taskId) => {
        try {
            if (taskId) {
                await notificationService.markAsRead(taskId);
            } else {
                await notificationService.markAllAsRead();
            }
            setTaskReminders(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
        navigate('/teams');
        setShowNotifications(false);
    };

    const handleDmClick = async (convId) => {
        navigate('/chat');
        setShowNotifications(false);
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setAllNotifications(prev => prev.filter(n => n.read === false));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getInitials = () => {
        const firstName = user?.first_name?.[0] || '';
        const lastName = user?.last_name?.[0] || '';
        return (firstName + lastName).toUpperCase() || (user?.username?.[0] || 'U').toUpperCase();
    };

    const getRoleLabel = () => {
        switch(user?.role) {
            case 'admin': return 'Administrador';
            case 'professor': return 'Profesor';
            case 'student': return 'Estudiante';
            default: return '';
        }
    };

const totalUnread = dmNotifications.reduce((acc, n) => acc + n.unread_count, 0);
    const totalMessagesUnread = dmNotifications.reduce((acc, n) => acc + n.unread_count, 0);

    const handleShowNotifications = async () => {
        if (!showNotifications && !tasksViewed && taskReminders.length > 0) {
            try {
                await notificationService.markAllAsRead();
                setTaskReminders([]);
                setTasksViewed(true);
            } catch (error) {
                console.error('Error marking task reminders as read:', error);
            }
        }
        setShowNotifications(!showNotifications);
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="brand-link">XYZ</Link>
            </div>

<div className="navbar-center">
                <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
                    Equipos
                </Link>
                <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>
                    Calendario
                </Link>
                <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                    Chat
                </Link>
            </div>

            <div className="navbar-right">
                <div className="notification-wrapper" ref={notifRef}>
                    <button 
                        className="notification-btn"
                        onClick={handleShowNotifications}
                    >
                        <span className="notification-icon"><Bell size={24} /></span>
                        {totalUnread > 0 && (
                            <span className="notification-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <span>Notificaciones</span>
                                {allNotifications.some(n => !n.read) && (
                                    <button className="mark-all-read" onClick={handleMarkAllRead}>
                                        Marcar todo como leído
                                    </button>
                                )}
                            </div>
                            <div className="notif-tabs">
                                <button 
                                    className={`notif-tab ${activeNotifTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveNotifTab('all')}
                                >
                                    Todas
                                </button>
                                <button 
                                    className={`notif-tab ${activeNotifTab === 'tasks' ? 'active' : ''}`}
                                    onClick={() => setActiveNotifTab('tasks')}
                                >
                                    Tareas
                                    {taskReminders.length > 0 && <span className="tab-badge">{taskReminders.length}</span>}
                                </button>
                                <button 
                                    className={`notif-tab ${activeNotifTab === 'messages' ? 'active' : ''}`}
                                    onClick={() => setActiveNotifTab('messages')}
                                >
                                    Mensajes
                                    {totalMessagesUnread > 0 && <span className="tab-badge">{totalMessagesUnread}</span>}
                                </button>
                            </div>
                            <div className="notification-list">
                                {activeNotifTab === 'all' && (
                                    <>
                                        {taskReminders.length === 0 && dmNotifications.length === 0 && (
                                            <div className="notification-empty">
                                                No hay notificaciones
                                            </div>
                                        )}
                                        {taskReminders.map((task) => (
                                            <div 
                                                key={`task-${task.id}`} 
                                                className="notification-item task-reminder"
                                                onClick={() => handleTaskReminderClick(task.id)}
                                            >
                                                <div className="notif-avatar" style={{ background: 'linear-gradient(135deg, #FACC15, #EF4444)' }}>
                                                    ⏰
                                                </div>
                                                <div className="notif-content">
                                                    <span className="notif-name">Recordatorio</span>
                                                    <span className="notif-preview">
                                                        {task.title} - ¡Vence pronto!
                                                    </span>
                                                    <span className="notif-time">
                                                        {task.hours_remaining}h restantes
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {dmNotifications.map((conv) => (
                                            <div 
                                                key={`dm-${conv.user.id}`} 
                                                className="notification-item"
                                                onClick={() => handleDmClick(conv.user.id)}
                                            >
                                                <div className="notif-avatar">
                                                    {conv.user.first_name?.[0] || conv.user.username?.[0] || 'U'}
                                                </div>
                                                <div className="notif-content">
                                                    <span className="notif-name">
                                                        {conv.user.first_name || conv.user.username}
                                                    </span>
                                                    <span className="notif-preview">
                                                        {conv.last_message?.content?.substring(0, 30)}...
                                                    </span>
                                                </div>
                                                <span className="notif-count">{conv.unread_count}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {activeNotifTab === 'tasks' && (
                                    <>
                                        {taskReminders.length === 0 ? (
                                            <div className="notification-empty">
                                                No hay recordatorios de tareas
                                            </div>
                                        ) : (
                                            taskReminders.map((task) => (
                                                <div 
                                                    key={`task-${task.id}`} 
                                                    className="notification-item task-reminder"
                                                    onClick={() => handleTaskReminderClick(task.id)}
                                                >
                                                    <div className="notif-avatar" style={{ background: 'linear-gradient(135deg, #FACC15, #EF4444)' }}>
                                                        ⏰
                                                    </div>
                                                    <div className="notif-content">
                                                        <span className="notif-name">{task.title}</span>
                                                        <span className="notif-preview">
                                                            {task.team} - ¡Vence pronto!
                                                        </span>
                                                        <span className="notif-time">
                                                            {task.hours_remaining} horas restantes
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                                {activeNotifTab === 'messages' && (
                                    <>
                                        {totalMessagesUnread === 0 ? (
                                            <div className="notification-empty">
                                                No hay mensajes nuevos
                                            </div>
                                        ) : (
                                            dmNotifications.map((conv) => (
                                                <div 
                                                    key={`dm-${conv.user.id}`} 
                                                    className="notification-item"
                                                    onClick={() => handleDmClick(conv.user.id)}
                                                >
                                                    <div className="notif-avatar">
                                                        {conv.user.first_name?.[0] || conv.user.username?.[0] || 'U'}
                                                    </div>
                                                    <div className="notif-content">
                                                        <span className="notif-name">
                                                            {conv.user.first_name || conv.user.username}
                                                        </span>
                                                        <span className="notif-preview">
                                                            {conv.last_message?.content?.substring(0, 30)}...
                                                        </span>
                                                    </div>
                                                    <span className="notif-count">{conv.unread_count}</span>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-dropdown" ref={dropdownRef}>
                    <button 
                        className="user-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {user.photo ? (
                            <img src={user.photo} alt="Perfil" className="user-avatar-img" />
                        ) : (
                            <div className="user-avatar">{getInitials()}</div>
                        )}
                        <span className="dropdown-arrow">▼</span>
                    </button>
                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <span className="dropdown-name">{user.first_name || user.username}</span>
                                <span className="dropdown-role">{getRoleLabel()}</span>
                                <span className="dropdown-email">{user.email}</span>
                            </div>
                            <div className="dropdown-divider"></div>
                            <Link to="/profile" className={`dropdown-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => setShowDropdown(false)}>
                                Mi Perfil
                            </Link>
                            <Link to="/teams" className={`dropdown-item ${location.pathname === '/teams' ? 'active' : ''}`} onClick={() => setShowDropdown(false)}>
                                Equipos
                            </Link>
                            <Link to="/calendar" className={`dropdown-item ${location.pathname === '/calendar' ? 'active' : ''}`} onClick={() => setShowDropdown(false)}>
                                Calendario
                            </Link>
                            <Link to="/chat" className={`dropdown-item ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => setShowDropdown(false)}>
                                Chat
                            </Link>
                            <div className="dropdown-divider"></div>
                            {user.role === 'admin' && (
                                <>
                                    <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                        Dashboard
                                    </Link>
                                    <Link to="/admin/users" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                        Administración
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}
                            <button className="dropdown-item danger" onClick={() => { logout(); setShowDropdown(false); }}>
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
