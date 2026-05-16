import api from './api';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/token/', { username, password });
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/users/register/', userData);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },
    getCurrentUser: async () => {
        const response = await api.get('/users/me/');
        return response.data;
    },
    changePassword: async (oldPassword, newPassword) => {
        const response = await api.post('/users/change_password/', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    },
};

export const userService = {
    getAll: () => api.get('/users/'),
    getById: (id) => api.get(`/users/${id}/`),
    update: (id, data) => api.patch(`/users/${id}/`, data),
    delete: (id) => api.delete(`/users/${id}/`),
    assignRole: (userId, role) => api.post(`/users/${userId}/assign_role/`, { role }),
    getProfile: () => api.get('/users/me/'),
    updateProfile: (data) => api.patch('/users/me/', data),
};

export const teamService = {
    getAll: () => api.get('/teams/'),
    getById: (id) => api.get(`/teams/${id}/`),
    create: (data) => api.post('/teams/', data),
    update: (id, data) => api.patch(`/teams/${id}/`, data),
    delete: (id) => api.delete(`/teams/${id}/`),
    addMember: (teamId, userId, role) => api.post(`/teams/${teamId}/add_member/`, { user_id: userId, role }),
    removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/remove_member/`, { data: { user_id: userId } }),
    leaveTeam: (teamId) => api.delete(`/teams/${teamId}/leave_team/`),
    getMembers: (teamId) => api.get(`/teams/${teamId}/members/`),
    updateImage: (teamId, formData) => api.patch(`/teams/${teamId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const taskService = {
    getAll: (params) => api.get('/tasks/', { params }),
    getById: (id) => api.get(`/tasks/${id}/`),
    create: (data) => api.post('/tasks/', data),
    update: (id, data) => api.patch(`/tasks/${id}/`, data),
    delete: (id) => api.delete(`/tasks/${id}/`),
    addComment: (taskId, content) => api.post(`/tasks/${taskId}/comments/`, { content }),
    requestCompletion: (taskId) => api.post(`/tasks/${taskId}/request_completion/`),
    approveCompletion: (taskId) => api.post(`/tasks/${taskId}/approve_completion/`),
};

export const channelService = {
    getAll: () => api.get('/chat/channels/'),
    getById: (id) => api.get(`/chat/channels/${id}/`),
    create: (data) => api.post('/chat/channels/', data),
    update: (id, data) => api.patch(`/chat/channels/${id}/`, data),
    delete: (id) => api.delete(`/chat/channels/${id}/`),
};

export const messageService = {
    getAll: (channelId) => api.get(`/chat/channels/${channelId}/messages/`),
    create: (data) => api.post('/chat/messages/', data),
};

export const directMessageService = {
    getConversations: () => api.get('/chat/direct/'),
    getMessages: (userId) => api.get(`/chat/direct/users/${userId}/`),
    send: (userId, message) => api.post('/chat/direct/', { receiver_id: userId, content: message }),
    getUsers: () => api.get('/chat/direct/users/'),
};

export const eventService = {
    getAll: (params) => api.get('/calendar/', { params }),
    getById: (id) => api.get(`/calendar/${id}/`),
    create: (data) => api.post('/calendar/', data),
    update: (id, data) => api.patch(`/calendar/${id}/`, data),
    delete: (id) => api.delete(`/calendar/${id}/`),
};

export const notificationService = {
    getAll: () => api.get('/chat/notifications/'),
    getUnreadCount: () => api.get('/chat/notifications/unread_count/'),
    markAsRead: (notificationId) => api.post('/chat/notifications/mark_read/', { notification_id: notificationId }),
    markAllAsRead: () => api.post('/chat/notifications/mark_read/'),
    getTaskReminders: () => api.get('/chat/notifications/task_reminders/'),
};

export const googleCalendarService = {
    getAuthUrl: () => api.get('/calendar/google/auth/'),
    callback: () => api.get('/calendar/google/callback/'),
    getStatus: () => api.get('/calendar/google/status/'),
    disconnect: () => api.post('/calendar/google/disconnect/'),
    sync: (teamId) => api.post('/calendar/google/sync/', { team_id: teamId }),
    import: (teamId) => api.post('/calendar/google/import/', { team_id: teamId }),
};

export const fileService = {
    getAll: (params) => api.get('/files/', { params }),
    getById: (id) => api.get(`/files/${id}/`),
    upload: (formData) => api.post('/files/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/files/${id}/`),
};

export const folderService = {
    getAll: (params) => api.get('/files/folders/', { params }),
    create: (data) => api.post('/files/folders/', data),
    delete: (id) => api.delete(`/files/folders/${id}/`),
};

export default api;