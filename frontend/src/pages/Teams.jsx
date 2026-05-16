import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService, userService, taskService } from '../services';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Teams.css';

const Teams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('members');
    const [teamSettings, setTeamSettings] = useState(null);
    const [settingsForm, setSettingsForm] = useState({ allow_uploads: true, allowed_extensions: [], max_file_size: 10 });
    const [memberSearch, setMemberSearch] = useState('');
    const [memberResults, setMemberResults] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    useEffect(() => {
        fetchTeams();
        fetchAllUsers();

        const handleClickOutside = (e) => {
            if (!e.target.closest('.team-menu-wrapper')) {
                setOpenMenuId(null);
            }
            if (!e.target.closest('.member-search-wrapper')) {
                setMemberResults([]);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleMemberSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setMemberSearch(query);
        
        if (query.length >= 2) {
            const filtered = allUsers
                .filter(u => 
                    (u.username?.toLowerCase().includes(query) || 
                     u.email?.toLowerCase().includes(query) ||
                     u.first_name?.toLowerCase().includes(query))
                )
                .slice(0, 5);
            setMemberResults(filtered);
        } else {
            setMemberResults([]);
        }
    };

    const selectMember = (user) => {
        setMemberSearch(user.username || user.email);
        setMemberResults([]);
        document.getElementById('addMemberInput').value = user.id.toString();
    };

    const fetchAllUsers = async () => {
        try {
            const response = await userService.getAll();
            const users = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setAllUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await teamService.getAll();
            setTeams(Array.isArray(response.data) ? response.data : (response.data.results || []));
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await teamService.create(formData);
            setFormData({ name: '', description: '' });
            setShowForm(false);
            fetchTeams();
        } catch (error) {
            console.error('Error creating team:', error);
            alert('Error al crear el equipo. Solo profesores y administradores pueden crear equipos.');
        }
    };

    const handleLeaveTeam = async (teamId, e) => {
        e.stopPropagation();
        e.preventDefault();
        setConfirmAction({ type: 'leave', teamId });
    };

    const handleDelete = async (teamId, e) => {
        e.stopPropagation();
        e.preventDefault();
        setConfirmAction({ type: 'delete', teamId });
    };

    const handleAddImage = async (teamId, e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                await api.patch(`/teams/${teamId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                fetchTeams();
                setOpenMenuId(null);
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error al subir imagen: ' + (error.response?.data?.message || error.message));
            }
        };
        input.click();
    };

    const openSettings = (team) => {
        setTeamSettings(team);
        setSettingsForm({
            allow_uploads: team.allow_uploads !== false,
            allowed_extensions: team.allowed_extensions || [],
            max_file_size: team.max_file_size || 10
        });
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/teams/${teamSettings.id}/`, settingsForm);
            setTeamSettings(null);
            fetchTeams();
            alert('Configuración guardada');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar configuración');
        }
    };

    const toggleExtension = (ext) => {
        setSettingsForm(prev => ({
            ...prev,
            allowed_extensions: prev.allowed_extensions.includes(ext)
                ? prev.allowed_extensions.filter(e => e !== ext)
                : [...prev.allowed_extensions, ext]
        }));
    };

    const fetchTeamDetails = async (teamId) => {
        try {
            console.log('Fetching team details for:', teamId);
            const [teamRes, membersRes, tasksRes] = await Promise.all([
                teamService.getById(teamId),
                teamService.getMembers(teamId),
                taskService.getAll({ team: teamId })
            ]);
            console.log('Team response:', teamRes.data);
            console.log('Members response:', membersRes.data);
            console.log('Tasks response:', tasksRes.data);
            setSelectedTeam(teamRes.data);
            setTeamMembers(Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data.results || []));
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);
            setTeamTasks(tasksData);
        } catch (error) {
            console.error('Error fetching team details:', error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('¿Eliminar este miembro del equipo?')) return;
        try {
            await teamService.removeMember(selectedTeam.id, memberId);
            fetchTeamDetails(selectedTeam.id);
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error al eliminar el miembro');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        const input = document.getElementById('addMemberInput');
        const userId = input.value;
        
        if (!userId) return;
        
        try {
            await teamService.addMember(selectedTeam.id, parseInt(userId), 'member');
            setMemberSearch('');
            input.value = '';
            fetchTeamDetails(selectedTeam.id);
            setShowModal({ type: 'success', message: 'Miembro agregado exitosamente' });
        } catch (error) {
            console.error('Error adding member:', error);
            const errorMsg = error.response?.data?.error || 'Error al agregar el miembro';
            setShowModal({ type: 'error', message: errorMsg });
        }
    };

    if (loading) return <div className="loading"></div>;

    const canCreateTeams = user?.role === 'admin' || user?.role === 'professor';
    const isProfessor = user?.role === 'professor' || user?.role === 'admin';
    const filteredTeams = teams.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="teams-page">
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{showModal.type === 'success' ? 'Éxito' : 'Error'}</h2>
                        <p>{showModal.message}</p>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={() => setShowModal(null)}>Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAction && (
                <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{confirmAction.type === 'leave' ? 'Salir del Equipo' : 'Eliminar Equipo'}</h2>
                        <p>{confirmAction.type === 'leave' 
                            ? '¿Estás seguro de que quieres salir de este equipo?' 
                            : '¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer.'}</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancelar</button>
                            <button 
                                className={confirmAction.type === 'leave' ? 'btn-primary' : 'btn-danger'}
                                onClick={async () => {
                                    try {
                                        if (confirmAction.type === 'leave') {
                                            await teamService.leaveTeam(confirmAction.teamId);
                                        } else {
                                            await teamService.delete(confirmAction.teamId);
                                        }
                                        fetchTeams();
                                        setOpenMenuId(null);
                                        setSelectedTeam(null);
                                        setShowModal({ 
                                            type: 'success', 
                                            message: confirmAction.type === 'leave' ? 'Has salido del equipo' : 'Equipo eliminado' 
                                        });
                                    } catch (error) {
                                        console.error('Error:', error);
                                        setShowModal({ type: 'error', message: error.response?.data?.error || 'Error' });
                                    }
                                    setConfirmAction(null);
                                }}
                            >
                                {confirmAction.type === 'leave' ? 'Salir' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h1>Mis Equipos</h1>
                {canCreateTeams && (
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : '+ Nuevo Equipo'}
                    </button>
                )}
            </div>

            <div className="teams-search">
                <input
                    type="text"
                    placeholder="Buscar equipos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <span className="search-count">
                        {filteredTeams.length} {filteredTeams.length === 1 ? 'resultado' : 'resultados'}
                    </span>
                )}
            </div>

            {showForm && (
                <form className="team-form" onSubmit={handleSubmit}>
                    <h3>Crear Nuevo Equipo</h3>
                    <div className="form-group">
                        <label>Nombre del equipo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Desarrollo Web"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe el propósito del equipo"
                            rows={3}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Crear Equipo</button>
                </form>
            )}

            {filteredTeams.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">👥</div>
                    {searchQuery ? (
                        <>
                            <h3>No se encontraron equipos</h3>
                            <p>No hay equipos que coincidan con "{searchQuery}"</p>
                        </>
                    ) : (
                        <>
                            <h3>No hay equipos</h3>
                            <p>{canCreateTeams ? 'Crea tu primer equipo para comenzar' : 'Los profesores crean equipos para que te unas'}</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="teams-grid">
                    {filteredTeams.map((team) => (
                        <div key={team.id} className="team-card">
                            <div className="team-card-image" onClick={() => navigate(`/teams/${team.id}/tasks`)}>
                                {team.image ? (
                                    <img src={team.image} alt={team.name} />
                                ) : (
                                    <span className="team-placeholder">+</span>
                                )}
                            </div>
                            <div className="team-card-content">
                                <h3 onClick={() => navigate(`/teams/${team.id}/tasks`)}>{team.name}</h3>
                                <div className="team-menu-wrapper">
                                    <button 
                                        className="team-menu-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === team.id ? null : team.id);
                                        }}
                                    >
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </button>
                                    {openMenuId === team.id && (
                                        <div className="team-menu-dropdown">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setActiveTab('members'); fetchTeamDetails(team.id); }}>
                                                👥 Integrantes
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setActiveTab('tasks'); fetchTeamDetails(team.id); }}>
                                                📋 Ver tareas
                                            </button>
                                            {user?.role === 'professor' && (
                                                <>
                                                    <button onClick={(e) => handleAddImage(team.id, e)}>
                                                        📷 Agregar imagen
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={(e) => handleLeaveTeam(team.id, e)}>
                                                Salir del grupo
                                            </button>
                                            {canCreateTeams && (
                                                <button className="danger" onClick={(e) => handleDelete(team.id, e)}>
                                                    Eliminar grupo
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTeam && (
                <div className="modal-overlay" onClick={() => { setSelectedTeam(null); setActiveTab('members'); }}>
                    <div className="modal-content team-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedTeam.name}</h2>
                            <button className="modal-close" onClick={() => { setSelectedTeam(null); setActiveTab('members'); }}>×</button>
                        </div>
                        {selectedTeam.image && (
                            <img src={selectedTeam.image} alt={selectedTeam.name} className="team-modal-image" />
                        )}
                        <p className="team-description">{selectedTeam.description || 'Sin descripción'}</p>
                        
                        <div className="team-detail-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                                onClick={() => setActiveTab('members')}
                            >
                                Miembros ({teamMembers.length})
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                Tareas ({teamTasks.length})
                            </button>
                        </div>

                        {activeTab === 'members' && (
                            <>
                                {isProfessor && (
                                    <div className="member-search-wrapper">
                                        <form className="add-member-form" onSubmit={handleAddMember}>
                                            <input
                                                id="addMemberInput"
                                                type="text"
                                                placeholder="Buscar usuario..."
                                                value={memberSearch}
                                                onChange={handleMemberSearch}
                                            />
                                            <button type="submit" className="btn-primary btn-sm">Agregar</button>
                                        </form>
                                        {memberResults.length > 0 && (
                                            <ul className="member-search-results">
                                                {memberResults.map(user => (
                                                    <li 
                                                        key={user.id} 
                                                        onClick={() => selectMember(user)}
                                                    >
                                                        <div className="member-avatar">
                                                            {user.first_name?.[0] || user.username?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div>{user.first_name || user.username}</div>
                                                            <div className="member-email">{user.email}</div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                                
                                {teamMembers.length === 0 ? (
                                    <p style={{ color: '#6b7280' }}>No hay miembros en este equipo</p>
                                ) : (
                                    <ul className="member-list">
                                        {teamMembers.map((member) => (
                                            <li key={member.id} className="member-item">
                                                <div className="member-info">
                                                    <div className="member-avatar">
                                                        {(member.user?.first_name?.[0] || member.user?.username?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="member-name">
                                                            {member.user?.first_name || member.user?.username || 'Usuario'}
                                                        </div>
                                                        <div className="member-role">
                                                            {member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Miembro'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isProfessor && member.user?.id !== user?.id && (
                                                    <button 
                                                        className="btn-danger btn-sm"
                                                        onClick={() => handleRemoveMember(member.user?.id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}

                        {activeTab === 'tasks' && (
                            <>
                                {canCreateTeams && (
                                    <button 
                                        className="btn-primary" 
                                        style={{ marginBottom: '1rem' }}
                                        onClick={() => alert('Función de crear tarea en desarrollo')}
                                    >
                                        + Nueva Tarea
                                    </button>
                                )}
                                {teamTasks.length === 0 ? (
                                    <p style={{ color: '#6b7280' }}>No hay tareas en este equipo</p>
                                ) : (
                                    <ul className="task-list-team">
                                        {teamTasks.map(task => (
                                            <li key={task.id} className="task-item-team">
                                                <div className="task-item-info">
                                                    <span className="task-item-title">{task.title}</span>
                                                    <span className={`task-status-badge ${task.status}`}>
                                                        {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                    </span>
                                                </div>
                                                <span className="task-priority-badge">
                                                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                        </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {teamSettings && (
                <div className="modal-overlay" onClick={() => setTeamSettings(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Configurar Archivos</h2>
                            <button className="modal-close" onClick={() => setTeamSettings(null)}>×</button>
                        </div>
                        <form onSubmit={saveSettings}>
                            <div className="form-group">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={settingsForm.allow_uploads}
                                        onChange={(e) => setSettingsForm({...settingsForm, allow_uploads: e.target.checked})}
                                    />
                                    Permitir subir archivos
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Tamaño máximo (MB)</label>
                                <input 
                                    type="number" 
                                    value={settingsForm.max_file_size}
                                    onChange={(e) => setSettingsForm({...settingsForm, max_file_size: parseInt(e.target.value) || 10})}
                                    min="1"
                                    max="100"
                                />
                            </div>
                            <div className="form-group">
                                <label>Extensiones permitidas</label>
                                <div className="extensions-grid">
                                    {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'].map(ext => (
                                        <label key={ext} className="extension-option">
                                            <input 
                                                type="checkbox"
                                                checked={settingsForm.allowed_extensions.includes(ext)}
                                                onChange={() => toggleExtension(ext)}
                                            />
                                            .{ext}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setTeamSettings(null)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
