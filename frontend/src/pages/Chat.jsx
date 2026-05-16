import { useState, useEffect, useRef } from 'react';
import { channelService, messageService, teamService, directMessageService } from '../services';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(() => {
        const saved = localStorage.getItem('selectedChannel');
        return saved ? JSON.parse(saved) : null;
    });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [teams, setTeams] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedDMUser, setSelectedDMUser] = useState(() => {
        const saved = localStorage.getItem('selectedDMUser');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('chatActiveTab') || 'channels';
    });
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        channel_type: 'team',
        team: ''
    });
    const [dmFormData, setDmFormData] = useState({
        user_id: '',
        message: ''
    });
    const [dmSearch, setDmSearch] = useState('');
    const [teamSearch, setTeamSearch] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    useEffect(() => {
        if (selectedDMUser) {
            localStorage.setItem('selectedDMUser', JSON.stringify(selectedDMUser));
            localStorage.removeItem('selectedChannel');
        }
    }, [selectedDMUser]);

    useEffect(() => {
        if (selectedChannel) {
            localStorage.setItem('selectedChannel', JSON.stringify(selectedChannel));
            localStorage.removeItem('selectedDMUser');
        }
    }, [selectedChannel]);

    useEffect(() => {
        localStorage.setItem('chatActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (selectedDMUser) {
            setSelectedChannel(null);
            fetchDMMessages(selectedDMUser.id);
        }
    }, [selectedDMUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedDMUser) {
                fetchDMMessages(selectedDMUser.id);
            }
            fetchData();
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedDMUser]);

    const fetchData = async () => {
        try {
            const [channelsRes, teamsRes, convRes, usersRes] = await Promise.all([
                channelService.getAll(),
                teamService.getAll(),
                directMessageService.getConversations(),
                directMessageService.getUsers(),
            ]);
            setChannels(Array.isArray(channelsRes.data) ? channelsRes.data : (channelsRes.data.results || []));
            const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []);
            setTeams(teamsData);
            setConversations(convRes.data || []);
            setAllUsers(usersRes.data || []);
            if (teamsData.length > 0) {
                setFormData(prev => ({ ...prev, team: teamsData[0].id }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (channelId) => {
        try {
            const res = await messageService.getAll(channelId);
            setMessages(res.data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchDMMessages = async (userId) => {
        try {
            const res = await directMessageService.getMessages(userId);
            setMessages(res.data || []);
        } catch (error) {
            console.error('Error fetching DM messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            console.log('Sending to user:', selectedDMUser.id);
            
            if (selectedChannel) {
                await messageService.create({ content: newMessage, channel: selectedChannel.id });
                fetchMessages(selectedChannel.id);
            } else if (selectedDMUser) {
                const result = await directMessageService.send(selectedDMUser.id, newMessage);
                console.log('Message sent:', result);
                fetchDMMessages(selectedDMUser.id);
                fetchData();
            }
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            console.log('Error response:', error.response?.data);
        }
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        try {
            await channelService.create(formData);
            setFormData({
                name: '',
                description: '',
                channel_type: 'team',
                team: teams[0]?.id || ''
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error creating channel:', error);
        }
    };

    const handleDeleteChannel = async (channelId) => {
        try {
            await channelService.delete(channelId);
            if (selectedChannel?.id === channelId) setSelectedChannel(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting channel:', error);
        }
    };

    const handleStartDM = async (e) => {
        e.preventDefault();
        if (!dmFormData.user_id) return;
        const userId = parseInt(dmFormData.user_id);
        const userObj = allUsers.find(u => u.id === userId);
        if (userObj) {
            setSelectedDMUser(userObj);
            setShowNewChat(false);
            setDmFormData({ user_id: '', message: '' });
            setDmSearch('');
        }
    };

    if (loading) return <div className="loading"></div>;

    const renderMessages = () => {
        if (messages.length === 0) {
            return (
                <div className="no-messages">
                    <p>No hay mensajes aún</p>
                </div>
            );
        }
        return messages.map((message) => {
            const isOwn = message.sender?.id === user?.id || message.sender_id === user?.id;
            return (
                <div key={message.id} className={`message ${isOwn ? 'own' : ''}`}>
                    <div className="message-avatar">
                        {(message.sender?.first_name?.[0] || message.sender?.username?.[0] || 'U')}
                    </div>
                    <div className="message-content">
                        {!isOwn && (
                            <div className="message-sender">
                                {message.sender?.first_name || message.sender?.username || 'Usuario'}
                            </div>
                        )}
                        <div className="message-bubble">{message.content}</div>
                        <div className="message-time">
                            {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="chat-page">
            <div className="chat-sidebar">
                <div className="chat-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                    >
                        Canales
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
                        onClick={() => setActiveTab('direct')}
                    >
                        Mensajes
                    </button>
                </div>

                {activeTab === 'channels' && (
                    <>
                        <div className="chat-sidebar-header">
                            <h3>Canales</h3>
                            <button className="add-channel-btn" onClick={() => setShowForm(!showForm)}>
                                +
                            </button>
                        </div>
                        {showForm && (
                            <form className="channel-form" onSubmit={handleCreateChannel}>
                                <input
                                    type="text"
                                    placeholder="Nombre del canal"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <textarea
                                    placeholder="Descripción"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="2"
                                />
                                <div className="custom-select" style={{ position: 'relative' }}>
                                    <div className="custom-select-trigger" onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowTeamDropdown(false); }}>
                                        {formData.channel_type === 'team' ? 'Equipo' : 'General'}
                                    </div>
                                    {showTypeDropdown && (
                                        <div className="custom-select-options">
                                            <div
                                                className={`custom-select-option ${formData.channel_type === 'team' ? 'selected' : ''}`}
                                                onClick={() => { setFormData({ ...formData, channel_type: 'team' }); setShowTypeDropdown(false); }}
                                            >
                                                Equipo
                                            </div>
                                            <div
                                                className={`custom-select-option ${formData.channel_type === 'general' ? 'selected' : ''}`}
                                                onClick={() => { setFormData({ ...formData, channel_type: 'general' }); setShowTypeDropdown(false); }}
                                            >
                                                General
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {formData.channel_type === 'team' && (
                                    <div className="custom-select" style={{ position: 'relative' }}>
                                        <div className="custom-select-trigger" onClick={() => { setShowTeamDropdown(!showTeamDropdown); setShowTypeDropdown(false); }}>
                                            {teams.find(t => t.id === formData.team)?.name || 'Seleccionar equipo'}
                                        </div>
                                        {showTeamDropdown && (
                                            <>
                                                <input
                                                    type="text"
                                                    className="custom-select-search"
                                                    placeholder="Buscar equipo..."
                                                    value={teamSearch}
                                                    onChange={(e) => setTeamSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="custom-select-options">
                                                    {teams
                                                        .filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
                                                        .map(t => (
                                                            <div
                                                                key={t.id}
                                                                className={`custom-select-option ${formData.team === t.id ? 'selected' : ''}`}
                                                                onClick={() => { setFormData({ ...formData, team: t.id }); setShowTeamDropdown(false); setTeamSearch(''); }}
                                                            >
                                                                {t.name}
                                                            </div>
                                                        ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                <button type="submit" className="btn-primary btn-sm">Crear</button>
                            </form>
                        )}
                        <ul className="channel-list">
                            {channels.length === 0 ? (
                                <div className="empty-state">
                                    <p className="empty-state-icon">💬</p>
                                    <p className="empty-state-text">No hay canales aún</p>
                                    <p className="empty-state-sub">Crea un canal para empezar a chatear</p>
                                </div>
                            ) : (
                            channels.map((channel) => (
                                <li
                                    key={channel.id}
                                    className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                                    onClick={() => setSelectedChannel(channel)}
                                >
                                    <span className="channel-icon">#</span>
                                    <span className="channel-name">{channel.name}</span>
                                    {channel.created_by && user && String(channel.created_by.id) === String(user.id) && (
                                        <button
                                            className="channel-delete-btn"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </li>
                            ))
                            )}
                        </ul>
                    </>
                )}

                {activeTab === 'direct' && (
                    <>
                        <div className="chat-sidebar-header">
                            <h3>Mensajes Directos</h3>
                        </div>
                        {showNewChat ? (
                            <div className="channel-form">
                                <input
                                    type="text"
                                    placeholder="Buscar usuario..."
                                    value={dmSearch}
                                    onChange={(e) => { setDmSearch(e.target.value); setDmFormData({ ...dmFormData, user_id: '' }); }}
                                />
                                {dmSearch && (
                                    <ul className="user-search-results">
                                        {allUsers
                                            .filter(u => (u.first_name || u.username).toLowerCase().includes(dmSearch.toLowerCase()))
                                            .map(u => (
                                                <li
                                                    key={u.id}
                                                    onClick={() => { setDmFormData({ ...dmFormData, user_id: u.id }); setDmSearch(`${u.first_name || u.username}`); }}
                                                >
                                                    {u.first_name || u.username}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                                <button type="submit" className="btn-primary btn-full" onClick={handleStartDM} disabled={!dmFormData.user_id}>
                                    Iniciar Chat
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn-secondary btn-sidebar"
                                onClick={() => { setShowNewChat(true); setDmSearch(''); }}
                            >
                                + Nuevo Mensaje
                            </button>
                        )}
                        <ul className="channel-list">
                            {conversations.length === 0 ? (
                                <li style={{ padding: '1rem', color: 'var(--gray)', textAlign: 'center' }}>
                                    No hay conversaciones
                                </li>
                            ) : (
                                conversations.map((conv) => (
                                    <li
                                        key={conv.user.id}
                                        className={`dm-item ${selectedDMUser?.id === conv.user.id ? 'active' : ''}`}
                                        onClick={() => setSelectedDMUser(conv.user)}
                                    >
                                        <div className="dm-avatar">
                                            {conv.user.first_name?.[0] || conv.user.username?.[0] || 'U'}
                                        </div>
                                        <span>{conv.user.first_name || conv.user.username}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </>
                )}
            </div>
            <div className="chat-main">
                {selectedChannel || selectedDMUser ? (
                    <>
                        <div className="chat-header">
                            {selectedChannel ? (
                                <>
                                    <span>#</span>
                                    <h3>{selectedChannel.name}</h3>
                                </>
                            ) : (
                                <>
                                    <div className="dm-header-avatar">
                                        {selectedDMUser.first_name?.[0] || selectedDMUser.username?.[0] || 'U'}
                                    </div>
                                    <h3>{selectedDMUser.first_name || selectedDMUser.username}</h3>
                                </>
                            )}
                        </div>
                        <div className="messages-container">
                            {renderMessages()}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="message-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                            />
                            <button type="submit" className="btn-primary">Enviar</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Selecciona un canal o conversación para empezar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;