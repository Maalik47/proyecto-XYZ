import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Tasks.css';

export default function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [taskComments, setTaskComments] = useState([]);
    const [taskFiles, setTaskFiles] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const teamsRes = await api.get('/teams/');
            const tasksRes = await api.get('/tasks/');
            
            const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);
            
            setTeams(teamsData);
            setTasks(tasksData);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar datos');
        }
        setLoading(false);
    }

    async function crearTarea(e) {
        e.preventDefault();
        const form = e.target;
        const dueDate = form.due_date.value;
        
        const data = {
            title: form.title.value,
            description: form.description.value,
            team: parseInt(form.team.value),
            priority: form.priority.value,
            status: 'in_progress',
            due_date: dueDate ? new Date(dueDate).toISOString() : null
        };
        
        try {
            await api.post('/tasks/', data);
            form.reset();
            loadData();
        } catch (err) {
            console.error('Error:', err.response?.data);
            const errorMsg = err.response?.data?.error || err.response?.data?.team?.[0] || 'Error al crear tarea. Asegúrate de ser miembro del equipo.';
            alert(errorMsg);
        }
    }

    async function cambiarEstado(id, status) {
        try {
            await api.patch(`/tasks/${id}/`, { status });
            loadData();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al cambiar estado';
            alert(msg);
        }
    }

    async function solicitarCompletar(taskId) {
        try {
            await api.post(`/tasks/${taskId}/request_completion/`);
            alert('Solicitud enviada al profesor para revisión');
            loadData();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al enviar solicitud';
            alert(msg);
        }
    }

    async function aprobarCompletado(taskId) {
        try {
            await api.post(`/tasks/${taskId}/approve_completion/`);
            loadData();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al aprobar';
            alert(msg);
        }
    }

    async function actualizarTarea(e) {
        e.preventDefault();
        const data = {
            title: editFormData.title,
            description: editFormData.description,
            priority: editFormData.priority,
            due_date: editFormData.due_date ? new Date(editFormData.due_date).toISOString() : null
        };
        
        try {
            await api.patch(`/tasks/${editingTask.id}/`, data);
            setEditingTask(null);
            loadData();
        } catch (err) {
            console.error('Error:', err);
            alert('Error al actualizar la tarea');
        }
    }

    async function eliminar(id) {
        if (confirm('¿Eliminar tarea?')) {
            try {
                await api.delete(`/tasks/${id}/`);
                loadData();
            } catch (err) {
                console.error(err);
            }
        }
    }

    const abrirEditor = (task) => {
        const dueDateStr = task.due_date ? 
            new Date(task.due_date).toISOString().slice(0, 16) : '';
        setEditFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            due_date: dueDateStr
        });
        setEditingTask(task);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha límite';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isDueSoon = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        const diff = due - now;
        const oneDay = 24 * 60 * 60 * 1000;
        return diff > 0 && diff <= oneDay;
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'completed') return false;
        return new Date(dueDate) < new Date();
    };

    const canEdit = user?.role === 'professor' || user?.role === 'admin';

    const openTaskDetail = async (task) => {
        setViewingTask(task);
        setTaskComments(task.comments || []);
        setTaskFiles(task.files || []);
        setNewComment('');
    };

    const closeTaskDetail = () => {
        setViewingTask(null);
        setTaskComments([]);
        setTaskFiles([]);
        setNewComment('');
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
            setTaskFiles(res.data.files || []);
        } catch (err) {
            console.error(err);
            alert('Error al subir archivo');
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('¿Eliminar archivo?')) return;
        try {
            await api.delete(`/tasks/${viewingTask.id}/files/${fileId}/`);
            const res = await api.get(`/tasks/${viewingTask.id}/`);
            setTaskFiles(res.data.files || []);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar archivo');
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="tasks-page"><div className="loading"></div></div>;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1>Tareas</h1>
                {teams.length > 0 && (
                    <button className="btn-primary" onClick={() => document.getElementById('form-tarea').classList.toggle('hidden')}>
                        + Nueva Tarea
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <form id="form-tarea" className="task-form hidden" onSubmit={crearTarea}>
                <h3>Crear Nueva Tarea</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Título *</label>
                        <input name="title" required placeholder="Nombre de la tarea" />
                    </div>
                    <div className="form-group">
                        <label>Equipo *</label>
                        <select name="team" required>
                            <option value="">Seleccionar</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Descripción</label>
                    <textarea name="description" rows="2" placeholder="Describe la tarea"></textarea>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Prioridad</label>
                        <select name="priority">
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha Límite</label>
                        <input type="datetime-local" name="due_date" />
                    </div>
                </div>
                <button type="submit" className="btn-primary">Crear</button>
            </form>

            {teams.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">👥</div>
                    <h3>No hay equipos</h3>
                    <p>Crea un equipo primero</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📋</div>
                    <h3>No hay tareas</h3>
                    <p>Crea tu primera tarea</p>
                </div>
            ) : (
                <div className="tasks-list">
                    {tasks.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-card ${isOverdue(task.due_date, task.status) ? 'task-overdue' : ''}`}
                            onClick={() => openTaskDetail(task)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="task-header">
                                <h3>{task.title}</h3>
                                <div className="task-actions">
                                    {canEdit && (
                                        <button className="btn-edit" onClick={() => abrirEditor(task)} title="Editar tarea">
                                            ✏️
                                        </button>
                                    )}
                                    {user?.role === 'student' && task.status !== 'completed' && (
                                        <button 
                                            className="btn-complete-request" 
                                            onClick={() => solicitarCompletar(task.id)}
                                            disabled={task.completion_requested}
                                            title="Solicitar que el profesor revise la tarea"
                                        >
                                            {task.completion_requested ? '✓ Pendiente de aprobación' : '✓ Marcar como completada'}
                                        </button>
                                    )}
                                    {canEdit && task.status === 'in_progress' && task.completion_requested && (
                                        <button 
                                            className="btn-approve" 
                                            onClick={() => aprobarCompletado(task.id)}
                                        >
                                            ✓ Aprobar
                                        </button>
                                    )}
                                    {canEdit && (
                                        <select value={task.status} onChange={(e) => cambiarEstado(task.id, e.target.value)}>
                                            <option value="pending">Pendiente</option>
                                            <option value="in_progress">En Progreso</option>
                                            <option value="completed">Completada</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            {task.description && <p className="task-description">{task.description}</p>}
                            <div className="task-footer">
                                <span className={`task-badge badge-priority ${task.priority}`}>
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                                <span className={`task-badge badge-status ${task.status}`}>
                                    {task.status === 'completed' ? 'Completada' : 'En Progreso'}
                                </span>
                                <span className={`due-date-badge ${isDueSoon(task.due_date) ? 'soon' : ''} ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}>
                                    📅 {formatDate(task.due_date)}
                                </span>
                                <button className="btn-danger btn-sm" onClick={() => eliminar(task.id)}>X</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingTask && (
                <div className="modal-overlay" onClick={() => setEditingTask(null)}>
                    <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Tarea</h2>
                            <button className="modal-close" onClick={() => setEditingTask(null)}>×</button>
                        </div>
                        <form onSubmit={actualizarTarea}>
                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                    rows="3"
                                    placeholder="Describe la tarea"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridad</label>
                                    <select
                                        value={editFormData.priority}
                                        onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fecha Límite</label>
                                    <input
                                        type="datetime-local"
                                        value={editFormData.due_date}
                                        onChange={(e) => setEditFormData({...editFormData, due_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingTask && (
                <div className="modal-overlay" onClick={closeTaskDetail}>
                    <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewingTask.title}</h2>
                            <button className="modal-close" onClick={closeTaskDetail}>×</button>
                        </div>
                        
                        <div className="task-detail-content">
                            <div className="task-detail-section">
                                <h3>Descripción</h3>
                                <p>{viewingTask.description || 'Sin descripción'}</p>
                            </div>
                            
                            <div className="task-detail-meta">
                                <span className={`task-badge badge-status ${viewingTask.status}`}>
                                    {viewingTask.status === 'completed' ? 'Completada' : viewingTask.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                </span>
                                <span className={`task-badge badge-priority ${viewingTask.priority}`}>
                                    {viewingTask.priority === 'high' ? 'Alta' : viewingTask.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                                <span className="due-date-info">📅 {formatDate(viewingTask.due_date)}</span>
                            </div>

                            <div className="task-detail-section">
                                <h3>Archivos</h3>
                                <div className="task-files-list">
                                    {taskFiles.length === 0 ? (
                                        <p className="no-files">No hay archivos</p>
                                    ) : (
                                        taskFiles.map(file => (
                                            <div key={file.id} className="task-file-item">
                                                <span>📎 {file.filename}</span>
                                                <div className="file-actions">
                                                    <a href={file.file} target="_blank" rel="noopener noreferrer">Ver</a>
                                                    {canEdit && (
                                                        <button onClick={() => handleDeleteFile(file.id)}>Eliminar</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="task-file-upload">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleUploadFile}
                                        disabled={uploadingFile}
                                    />
                                    {uploadingFile && <span>Subiendo...</span>}
                                </div>
                            </div>

                            <div className="task-detail-section">
                                <h3>Comentarios</h3>
                                <div className="task-comments-list">
                                    {taskComments.length === 0 ? (
                                        <p className="no-comments">No hay comentarios</p>
                                    ) : (
                                        taskComments.map(comment => (
                                            <div key={comment.id} className="task-comment">
                                                <div className="comment-header">
                                                    <span className="comment-author">
                                                        {comment.author?.first_name || comment.author?.username || 'Usuario'}
                                                    </span>
                                                    <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                                                </div>
                                                <p className="comment-content">{comment.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={handleAddComment} className="comment-form">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Escribe un comentario..."
                                        rows="2"
                                    />
                                    <button type="submit" disabled={commentLoading || !newComment.trim()}>
                                        {commentLoading ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
