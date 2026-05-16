import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './TeamTasks.css';

const TeamTasks = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewingTask, setViewingTask] = useState(null);
    const [taskComments, setTaskComments] = useState([]);
    const [taskFiles, setTaskFiles] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);
    const [taskSettings, setTaskSettings] = useState(null);
    const [taskSettingsForm, setTaskSettingsForm] = useState({ allow_uploads: true, allowed_extensions: [], max_file_size: 10 });
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [createTaskForm, setCreateTaskForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
    const [creatingTask, setCreatingTask] = useState(false);
    const [notification, setNotification] = useState(null);

    const canEdit = user?.role === 'professor' || user?.role === 'admin';

    const toggleTaskExtension = (ext) => {
        setTaskSettingsForm(prev => ({
            ...prev,
            allowed_extensions: prev.allowed_extensions.includes(ext)
                ? prev.allowed_extensions.filter(e => e !== ext)
                : [...prev.allowed_extensions, ext]
        }));
    };

    const openTaskSettings = (task) => {
        setTaskSettings(task);
        setTaskSettingsForm({
            allow_uploads: task.allow_uploads !== false,
            allowed_extensions: task.allowed_extensions || [],
            max_file_size: task.max_file_size || 10
        });
    };

    const saveTaskSettings = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/tasks/${taskSettings.id}/`, {
                allow_uploads: taskSettingsForm.allow_uploads,
                allowed_extensions: taskSettingsForm.allowed_extensions,
                max_file_size: taskSettingsForm.max_file_size
            });
            setTaskSettings(null);
            fetchData();
            alert('Configuración de tarea guardada');
        } catch (error) {
            console.error('Error saving task settings:', error);
            alert('Error al guardar configuración');
        }
    };

    useEffect(() => {
        fetchData();
    }, [teamId]);

    async function fetchData() {
        setLoading(true);
        try {
            const [teamRes, tasksRes] = await Promise.all([
                api.get(`/teams/${teamId}/`),
                api.get(`/tasks/?team=${teamId}`)
            ]);
            setTeam(teamRes.data);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);
            setTasks(tasksData);
        } catch (err) {
            console.error('Error:', err);
        }
        setLoading(false);
    }

    async function solicitarCompletar(taskId) {
        try {
            await api.post(`/tasks/${taskId}/request_completion/`);
            alert('Solicitud enviada al profesor para revisión');
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al enviar solicitud';
            alert(msg);
        }
    }

    async function aprobarCompletado(taskId) {
        try {
            await api.post(`/tasks/${taskId}/approve_completion/`);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al aprobar';
            alert(msg);
        }
    }

    async function handleCreateTask(e) {
        e.preventDefault();
        if (!createTaskForm.title.trim()) {
            alert('El título es requerido');
            return;
        }
        setCreatingTask(true);
        try {
            await api.post('/tasks/', {
                ...createTaskForm,
                team: teamId
            });
            setShowCreateTask(false);
            setCreateTaskForm({ title: '', description: '', priority: 'medium', due_date: '' });
            fetchData();
            alert('Tarea creada exitosamente');
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al crear tarea';
            alert(msg);
        } finally {
            setCreatingTask(false);
        }
    }

    useEffect(() => {
        console.log('viewingTask changed:', viewingTask);
    }, [viewingTask]);

    const openTaskDetail = async (task) => {
        setViewingTask(task);
        try {
            const res = await api.get(`/tasks/${task.id}/`);
            setTaskFiles(res.data.files || []);
            setTaskComments(res.data.comments || []);
        } catch (error) {
            console.error('Error loading task details:', error);
        }
    };

    const closeTaskDetail = () => {
        setViewingTask(null);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setCommentLoading(true);
        try {
            await api.post(`/tasks/${viewingTask.id}/comments/`, { content: newComment });
            const res = await api.get(`/tasks/${viewingTask.id}/`);
            setTaskComments(res.data.comments || []);
            setNewComment('');
        } catch (err) {
            console.error(err);
            alert('Error al agregar comentario');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleUploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/tasks/${viewingTask.id}/files/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const res = await api.get(`/tasks/${viewingTask.id}/`);
            const updatedTask = res.data;
            setTaskFiles(updatedTask.files || []);
            setViewingTask(updatedTask);
            setNotification({ type: 'success', message: 'Archivo subido exitosamente' });
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al subir archivo';
            setNotification({ type: 'error', message: msg });
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="team-tasks-page"><div className="loading"></div></div>;

    return (
        <div className="team-tasks-page">
            {notification && (
                <div className={`notification-toast ${notification.type}`}>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)}>×</button>
                </div>
            )}
            <div className="page-header">
                <button className="btn-secondary" onClick={() => navigate('/teams')}>← Volver a Equipos</button>
                <h1>{team?.name || 'Equipo'}</h1>
                {canEdit && (
                    <button className="btn-primary" onClick={() => setShowCreateTask(true)}>
                        + Nueva Tarea
                    </button>
                )}
            </div>

            <div className="tasks-list">
                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay tareas en este equipo</p>
                    </div>
                ) : tasks.map(task => (
                    <div 
                        key={task.id} 
                        className="task-card"
                        onClick={() => openTaskDetail(task)}
                    >
                        <div className="task-info">
                            <h3>{task.title}</h3>
                            <div className="task-meta">
                                <span className={`status-badge ${task.status}`}>
                                    {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                </span>
                                <span className={`priority-badge ${task.priority}`}>
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                                <span className="due-date">📅 {formatDate(task.due_date)}</span>
                            </div>
                        </div>
                        <div className="task-actions">
                            {canEdit && (
                                <button 
                                    className="btn-settings"
                                    onClick={(e) => { e.stopPropagation(); openTaskSettings(task); }}
                                    title="Configurar archivos"
                                >
                                    ⚙️
                                </button>
                            )}
                            {task.completion_requested && canEdit && (
                                <button className="btn-approve" onClick={(e) => { e.stopPropagation(); aprobarCompletado(task.id); }}>
                                    ✓ Aprobar
                                </button>
                            )}
                            {user?.role === 'student' && task.status !== 'completed' && (
                                <button 
                                    className="btn-complete-request"
                                    onClick={(e) => { e.stopPropagation(); solicitarCompletar(task.id); }}
                                    disabled={task.completion_requested}
                                >
                                    {task.completion_requested ? 'Pendiente' : 'Marcar completada'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {viewingTask && (
                <div className="modal-overlay" onClick={closeTaskDetail}>
                    <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewingTask.title}</h2>
                            <button className="modal-close" onClick={closeTaskDetail}>×</button>
                        </div>
                        <div className="task-detail-content">
                            <p>{viewingTask.description || 'Sin descripción'}</p>
                            <div className="task-detail-meta">
                                <span className={`status-badge ${viewingTask.status}`}>
                                    {viewingTask.status === 'completed' ? 'Completada' : viewingTask.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                </span>
                                <span className={`priority-badge ${viewingTask.priority}`}>
                                    {viewingTask.priority === 'high' ? 'Alta' : viewingTask.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                            </div>

                            <div className="task-section">
                                <h3>Archivos</h3>
                                {taskFiles.length === 0 ? <p className="no-files">No hay archivos</p> : (
                                    taskFiles.map(file => (
                                        <div key={file.id} className="task-file-item">
                                            <span>📎 {file.filename}</span>
                                            <a href={file.file} target="_blank" rel="noopener noreferrer">Ver</a>
                                        </div>
                                    ))
                                )}
                                {viewingTask?.allow_uploads !== false ? (
                                    <input type="file" onChange={handleUploadFile} disabled={uploadingFile} />
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Esta tarea no permite subir archivos</p>
                                )}
                            </div>

                            <div className="task-section">
                                <h3>Comentarios</h3>
                                {taskComments.length === 0 ? <p className="no-comments">No hay comentarios</p> : (
                                    taskComments.map(comment => (
                                        <div key={comment.id} className="task-comment">
                                            <div className="comment-header">
                                                <span className="comment-author">{comment.author?.first_name || comment.author?.username}</span>
                                                <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                                            </div>
                                            <p>{comment.content}</p>
                                        </div>
                                    ))
                                )}
                                <form onSubmit={handleAddComment} className="comment-form">
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario..." rows="2" />
                                    <button type="submit" disabled={commentLoading || !newComment.trim()}>Enviar</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {taskSettings && (
                <div className="modal-overlay" onClick={() => setTaskSettings(null)}>
                    <div className="task-settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Configurar Archivos - {taskSettings.title}</h2>
                            <button className="modal-close" onClick={() => setTaskSettings(null)}>×</button>
                        </div>
                        <form onSubmit={saveTaskSettings}>
                            <div className="form-group">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={taskSettingsForm.allow_uploads}
                                        onChange={(e) => setTaskSettingsForm({...taskSettingsForm, allow_uploads: e.target.checked})}
                                    />
                                    Permitir subir archivos
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Tamaño máximo (MB)</label>
                                <input 
                                    type="number" 
                                    value={taskSettingsForm.max_file_size}
                                    onChange={(e) => setTaskSettingsForm({...taskSettingsForm, max_file_size: parseInt(e.target.value) || 10})}
                                    min="1"
                                    max="100"
                                />
                            </div>
                            <div className="form-group">
                                <label>Extensiones permitidas (selecciona las que se permitirán)</label>
                                <div className="extensions-grid">
                                    {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'].map(ext => (
                                        <label key={ext} className="extension-option">
                                            <input 
                                                type="checkbox"
                                                checked={taskSettingsForm.allowed_extensions.includes(ext)}
                                                onChange={() => toggleTaskExtension(ext)}
                                            />
                                            .{ext}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setTaskSettings(null)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateTask && (
                <div className="modal-overlay" onClick={() => setShowCreateTask(false)}>
                    <div className="create-task-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nueva Tarea</h2>
                            <button className="modal-close" onClick={() => setShowCreateTask(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label>Título</label>
                                <input 
                                    type="text" 
                                    value={createTaskForm.title}
                                    onChange={(e) => setCreateTaskForm({...createTaskForm, title: e.target.value})}
                                    placeholder="Título de la tarea"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea 
                                    value={createTaskForm.description}
                                    onChange={(e) => setCreateTaskForm({...createTaskForm, description: e.target.value})}
                                    placeholder="Descripción de la tarea"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Prioridad</label>
                                <select 
                                    value={createTaskForm.priority}
                                    onChange={(e) => setCreateTaskForm({...createTaskForm, priority: e.target.value})}
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fecha de vencimiento</label>
                                <input 
                                    type="datetime-local" 
                                    value={createTaskForm.due_date}
                                    onChange={(e) => setCreateTaskForm({...createTaskForm, due_date: e.target.value})}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateTask(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={creatingTask}>
                                    {creatingTask ? 'Creando...' : 'Crear Tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamTasks;