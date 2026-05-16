import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService, teamService, googleCalendarService } from '../services';
import { useAuth } from '../context/AuthContext';
import './Calendar.css';

const Calendar = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        all_day: false,
        team: ''
    });
    const [loading, setLoading] = useState(true);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deletingEvent, setDeletingEvent] = useState(false);

    useEffect(() => {
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');
        
        if (connected === 'true') {
            refreshGoogleStatus();
            setNotification({ type: 'success', message: 'Google Calendar conectado exitosamente!' });
            setSearchParams({});
        } else if (error) {
            setNotification({ type: 'error', message: 'Error al conectar: ' + error });
            setSearchParams({});
        }
        
        fetchData();
        checkGoogleStatus();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const checkGoogleStatus = async () => {
        try {
            const response = await googleCalendarService.getStatus();
            setGoogleConnected(response.data.connected);
        } catch (error) {
            console.error('Error checking Google status:', error);
        }
    };

    const refreshGoogleStatus = async () => {
        await checkGoogleStatus();
    };

    const fetchData = async () => {
        try {
            const [teamsRes] = await Promise.all([teamService.getAll()]);
            const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []);
            setTeams(teamsData);
            if (teamsData.length > 0) {
                setFormData(prev => ({ ...prev, team: teamsData[0].id }));
            }
            fetchEvents();
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
            const response = await eventService.getAll({ start, end });
            setEvents(Array.isArray(response.data) ? response.data : (response.data.results || []));
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.team) {
            setNotification({ type: 'error', message: 'Por favor selecciona un equipo' });
            return;
        }
        try {
            await eventService.create(formData);
            setFormData({
                title: '',
                description: '',
                start_date: '',
                end_date: '',
                all_day: false,
                team: teams[0]?.id || ''
            });
            setShowForm(false);
            fetchEvents();
            setNotification({ type: 'success', message: 'Evento creado exitosamente' });
        } catch (error) {
            console.error('Error creating event:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Error al crear el evento';
            setNotification({ type: 'error', message: errorMsg });
        }
    };

const connectGoogleCalendar = async () => {
        try {
            const response = await googleCalendarService.getAuthUrl();
            if (response.data.error) {
                setNotification({ type: 'error', message: response.data.error });
            } else {
                window.location.href = response.data.authorization_url;
            }
        } catch (error) {
            console.error('Error connecting to Google:', error);
            const errorMsg = error.response?.data?.error || 'Error al conectar con Google Calendar.';
            setNotification({ type: 'error', message: errorMsg });
        }
    };

    const disconnectGoogleCalendar = async () => {
        try {
            await googleCalendarService.disconnect();
            setGoogleConnected(false);
            setConfirmDisconnect(false);
            setNotification({ type: 'success', message: 'Google Calendar desconectado' });
        } catch (error) {
            console.error('Error disconnecting:', error);
            setNotification({ type: 'error', message: 'Error al desconectar Google Calendar' });
        }
    };

    const handleDisconnectClick = () => {
        setConfirmDisconnect(true);
    };

    const cancelDisconnect = () => {
        setConfirmDisconnect(false);
    };

    const openEventDetail = (event) => {
        setViewingEvent(event);
    };

    const closeEventDetail = () => {
        setViewingEvent(null);
        setEditingEvent(null);
    };

    const startEditEvent = () => {
        const event = viewingEvent;
        setEditingEvent({
            id: event.id,
            title: event.title,
            description: event.description || '',
            start_date: event.start_date ? event.start_date.slice(0, 16) : '',
            end_date: event.end_date ? event.end_date.slice(0, 16) : '',
            all_day: event.all_day || false,
            team: event.team
        });
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            await eventService.update(editingEvent.id, editingEvent);
            setNotification({ type: 'success', message: 'Evento actualizado exitosamente' });
            fetchEvents();
            closeEventDetail();
        } catch (error) {
            console.error('Error updating event:', error);
            setNotification({ type: 'error', message: 'Error al actualizar el evento' });
        }
    };

    const handleDeleteEvent = async () => {
        try {
            await eventService.delete(viewingEvent.id);
            setNotification({ type: 'success', message: 'Evento eliminado exitosamente' });
            setDeletingEvent(false);
            fetchEvents();
            closeEventDetail();
        } catch (error) {
            console.error('Error deleting event:', error);
            setNotification({ type: 'error', message: 'Error al eliminar el evento' });
        }
    };

    const syncToGoogle = async () => {
        setSyncing(true);
        try {
            const response = await googleCalendarService.sync(formData.team);
            setNotification({ type: 'success', message: response.data.message });
        } catch (error) {
            console.error('Error syncing:', error);
            setNotification({ type: 'error', message: 'Error al sincronizar. Asegúrate de estar conectado a Google Calendar.' });
        } finally {
            setSyncing(false);
        }
    };

    const importFromGoogle = async () => {
        setImporting(true);
        try {
            const response = await googleCalendarService.import(formData.team);
            setNotification({ type: 'success', message: response.data.message });
            fetchEvents();
        } catch (error) {
            console.error('Error importing:', error);
            setNotification({ type: 'error', message: 'Error al importar. Selecciona un equipo.' });
        } finally {
            setImporting(false);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push({ date: new Date(year, month, -i), isOtherMonth: true });
        }
        days.reverse();
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isOtherMonth: false });
        }
        
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isOtherMonth: true });
        }
        
        return days;
    };

    const getEventsForDay = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start_date).toDateString();
            return eventDate === date.toDateString();
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (loading) return <div className="loading"></div>;

    return (
        <div className="calendar-page">
            <div className="page-header">
                <div>
                    <h1>Calendario</h1>
                    {googleConnected && (
                        <div className="google-connected-badge">
                            <span className="google-dot"></span>
                            Conectado a Google Calendar
                        </div>
                    )}
                </div>
                <div className="calendar-header-actions">
                    {googleConnected ? (
                        <>
                            <button 
                                className="btn-google-sync"
                                onClick={syncToGoogle}
                                disabled={syncing || !formData.team}
                            >
                                {syncing ? 'Sincronizando...' : '⬆️ Exportar a Google'}
                            </button>
                            <button 
                                className="btn-google-sync"
                                onClick={importFromGoogle}
                                disabled={importing || !formData.team}
                            >
                                {importing ? 'Importando...' : '⬇️ Importar de Google'}
                            </button>
                            <button 
                                className="btn-google-disconnect"
                                onClick={handleDisconnectClick}
                            >
                                Desconectar
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn-google-connect"
                            onClick={connectGoogleCalendar}
                        >
                            <img 
                                src="https://www.gstatic.com/images/branding/product/1x/calendar_512dp.png" 
                                alt="Google" 
                                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                            />
                            Conectar Google Calendar
                        </button>
                    )}
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : '+ Nuevo Evento'}
                    </button>
                </div>
            </div>

            {showForm && (
                <form className="event-form" onSubmit={handleSubmit}>
                    <h3>Crear Nuevo Evento</h3>
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nombre del evento"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha inicio *</label>
                            <input
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha fin *</label>
                            <input
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Equipo *</label>
                        <select
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: parseInt(e.target.value) })}
                            required
                        >
                            <option value="">Seleccionar equipo</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="all_day"
                                checked={formData.all_day}
                                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                            />
                            <label htmlFor="all_day">Evento de todo el día</label>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary">Crear Evento</button>
                </form>
            )}

            <div className="calendar-container">
                <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={prevMonth}>←</button>
                    <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                    <button className="calendar-nav-btn" onClick={nextMonth}>→</button>
                </div>
                <div className="calendar-grid">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    {getDaysInMonth().map((day, index) => {
                        const dayEvents = getEventsForDay(day.date);
                        return (
                            <div key={index} className={`calendar-day ${day.isOtherMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''}`}>
                                <span className="day-number">{day.date.getDate()}</span>
                                <div className="day-events">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div 
                                            key={event.id} 
                                            className="event-item" 
                                            title={event.title}
                                            onClick={() => openEventDetail(event)}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="event-more">+{dayEvents.length - 3} más</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {notification && (
                <div className="notification-modal" onClick={() => setNotification(null)}>
                    <div className="notification-content" onClick={(e) => e.stopPropagation()}>
                        <div className={`notification-icon ${notification.type}`}>
                            {notification.type === 'success' ? '✓' : '✕'}
                        </div>
                        <p>{notification.message}</p>
                        <button onClick={() => setNotification(null)} className="notification-close">
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {confirmDisconnect && (
                <div className="modal-overlay" onClick={cancelDisconnect}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>¿Desconectar Google Calendar?</h2>
                        <p>Ya no se sincronizarán automáticamente tus eventos.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={cancelDisconnect}>
                                Cancelar
                            </button>
                            <button className="btn-danger" onClick={disconnectGoogleCalendar}>
                                Desconectar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingEvent && !editingEvent && (
                <div className="modal-overlay" onClick={closeEventDetail}>
                    <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewingEvent.title}</h2>
                            <button className="modal-close" onClick={closeEventDetail}>×</button>
                        </div>
                        <div className="event-detail-content">
                            <p><strong>Descripción:</strong> {viewingEvent.description || 'Sin descripción'}</p>
                            <p><strong>Fecha inicio:</strong> {viewingEvent.start_date ? new Date(viewingEvent.start_date).toLocaleString() : 'N/A'}</p>
                            <p><strong>Fecha fin:</strong> {viewingEvent.end_date ? new Date(viewingEvent.end_date).toLocaleString() : 'N/A'}</p>
                            <p><strong>Todo el día:</strong> {viewingEvent.all_day ? 'Sí' : 'No'}</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeEventDetail}>Cerrar</button>
                            <button className="btn-primary" onClick={startEditEvent}>Editar</button>
                            <button className="btn-danger" onClick={() => setDeletingEvent(true)}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {editingEvent && (
                <div className="modal-overlay" onClick={closeEventDetail}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Evento</h2>
                            <button className="modal-close" onClick={closeEventDetail}>×</button>
                        </div>
                        <form onSubmit={handleUpdateEvent}>
                            <div className="form-group">
                                <label>Título</label>
                                <input 
                                    type="text" 
                                    value={editingEvent.title}
                                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea 
                                    value={editingEvent.description}
                                    onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha inicio</label>
                                <input 
                                    type="datetime-local" 
                                    value={editingEvent.start_date}
                                    onChange={(e) => setEditingEvent({...editingEvent, start_date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha fin</label>
                                <input 
                                    type="datetime-local" 
                                    value={editingEvent.end_date}
                                    onChange={(e) => setEditingEvent({...editingEvent, end_date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={editingEvent.all_day}
                                        onChange={(e) => setEditingEvent({...editingEvent, all_day: e.target.checked})}
                                    />
                                    Evento de todo el día
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeEventDetail}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingEvent && (
                <div className="modal-overlay" onClick={() => setDeletingEvent(false)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>¿Eliminar Evento?</h2>
                        <p>Esta acción no se puede deshacer.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeletingEvent(false)}>Cancelar</button>
                            <button className="btn-danger" onClick={handleDeleteEvent}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
