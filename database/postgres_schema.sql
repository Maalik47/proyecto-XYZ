-- ============================================
-- PLATAFORMA COLABORATIVA - BASE DE DATOS
-- PostgreSQL
-- ============================================

-- Crear base de datos
CREATE DATABASE plataforma_db;

-- Conectar a la base de datos
-- \c plataforma_db;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP NULL,
    is_superuser BOOLEAN DEFAULT FALSE,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NULL,
    last_name VARCHAR(150) NULL,
    email VARCHAR(254) NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'professor', 'student')),
    photo VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    bio TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_username_idx ON users(username);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);

-- ============================================
-- TABLA DE EQUIPOS
-- ============================================
CREATE TABLE teams_team (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX teams_name_idx ON teams_team(name);
CREATE INDEX teams_created_by_idx ON teams_team(created_by_id);

-- ============================================
-- TABLA DE MIEMBROS DE EQUIPO
-- ============================================
CREATE TABLE teams_teammember (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams_team(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

CREATE INDEX teammember_team_idx ON teams_teammember(team_id);
CREATE INDEX teammember_user_idx ON teams_teammember(user_id);

-- ============================================
-- TABLA DE ETIQUETAS
-- ============================================
CREATE TABLE tasks_tag (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3788d8'
);

-- ============================================
-- TABLA DE TAREAS
-- ============================================
CREATE TABLE tasks_task (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    team_id INTEGER NOT NULL REFERENCES teams_team(id) ON DELETE CASCADE,
    due_date TIMESTAMP NULL,
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX task_team_idx ON tasks_task(team_id);
CREATE INDEX task_status_idx ON tasks_task(status);
CREATE INDEX task_assigned_idx ON tasks_task(assigned_to_id);
CREATE INDEX task_due_date_idx ON tasks_task(due_date);

-- ============================================
-- TABLA DE RELACIÓN TAREA-ETIQUETAS
-- ============================================
CREATE TABLE tasks_task_tags (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks_task(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tasks_tag(id) ON DELETE CASCADE,
    UNIQUE(task_id, tag_id)
);

-- ============================================
-- TABLA DE EVENTOS (CALENDARIO)
-- ============================================
CREATE TABLE calendar_app_event (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(200) NULL,
    team_id INTEGER NOT NULL REFERENCES teams_team(id) ON DELETE CASCADE,
    reminder BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX event_team_idx ON calendar_app_event(team_id);
CREATE INDEX event_start_date_idx ON calendar_app_event(start_date);

-- ============================================
-- TABLA DE ASISTENTES A EVENTOS
-- ============================================
CREATE TABLE calendar_app_event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES calendar_app_event(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- ============================================
-- TABLA DE CANALES DE CHAT
-- ============================================
CREATE TABLE chat_channel (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    channel_type VARCHAR(20) DEFAULT 'team' CHECK (channel_type IN ('team', 'private')),
    team_id INTEGER NULL REFERENCES teams_team(id) ON DELETE SET NULL,
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX channel_team_idx ON chat_channel(team_id);

-- ============================================
-- TABLA DE MIEMBROS DE CANAL
-- ============================================
CREATE TABLE chat_channel_members (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES chat_channel(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(channel_id, user_id)
);

-- ============================================
-- TABLA DE MENSAJES
-- ============================================
CREATE TABLE chat_message (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    channel_id INTEGER NOT NULL REFERENCES chat_channel(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX message_channel_idx ON chat_message(channel_id);
CREATE INDEX message_sender_idx ON chat_message(sender_id);
CREATE INDEX message_created_idx ON chat_message(created_at);

-- ============================================
-- TABLA DE CARPETAS
-- ============================================
CREATE TABLE files_folder (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER NOT NULL REFERENCES teams_team(id) ON DELETE CASCADE,
    parent_id INTEGER NULL REFERENCES files_folder(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX folder_team_idx ON files_folder(team_id);
CREATE INDEX folder_parent_idx ON files_folder(parent_id);

-- ============================================
-- TABLA DE ARCHIVOS
-- ============================================
CREATE TABLE files_file (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file VARCHAR(100) NOT NULL,
    folder_id INTEGER NULL REFERENCES files_folder(id) ON DELETE SET NULL,
    team_id INTEGER NOT NULL REFERENCES teams_team(id) ON DELETE CASCADE,
    uploaded_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    size INTEGER DEFAULT 0,
    mime_type VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX file_team_idx ON files_file(team_id);
CREATE INDEX file_folder_idx ON files_file(folder_id);
CREATE INDEX file_uploaded_idx ON files_file(uploaded_by_id);

-- ============================================
-- TABLA DE AUTENTICACIÓN (Django)
-- ============================================
CREATE TABLE auth_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE auth_permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL,
    codename VARCHAR(100) NOT NULL,
    UNIQUE(content_type_id, codename)
);

CREATE TABLE auth_group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE(group_id, permission_id)
);

CREATE TABLE auth_user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

CREATE TABLE auth_user_user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
);

-- ============================================
-- TABLAS DE DJANGO (ContentTypes y Sessions)
-- ============================================
CREATE TABLE django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE(app_label, model)
);

CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP NOT NULL
);

CREATE TABLE django_migrations (
    id SERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Crear usuario admin
INSERT INTO users (username, email, password, first_name, last_name, role, is_staff, is_superuser, is_active)
VALUES (
    'admin',
    'admin@test.com',
    'pbkdf2_sha256$870000$...',  -- Reemplazar con hash real
    'Administrador',
    'Sistema',
    'admin',
    TRUE,
    TRUE,
    TRUE
);

-- Para crear la contraseña correctamente, ejecutar en Django:
-- python manage.py shell
-- >>> from users.models import User
-- >>> User.objects.create_superuser('admin', 'admin@test.com', 'admin123', role='admin')

-- ============================================
-- PERMISOS Y GRUPOS
-- ============================================

-- Grupo Administradores
INSERT INTO auth_group (name) VALUES ('Administradores');

-- Grupo Profesores
INSERT INTO auth_group (name) VALUES ('Profesores');

-- Grupo Estudiantes
INSERT INTO auth_group (name) VALUES ('Estudiantes');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de miembros de equipo con información de usuario
CREATE VIEW view_team_members AS
SELECT 
    t.name AS team_name,
    u.username,
    u.first_name,
    u.last_name,
    u.email,
    tm.role AS membership_role,
    tm.joined_at
FROM teams_teammember tm
JOIN teams_team t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id;

-- Vista de tareas con detalles
CREATE VIEW view_tasks_detail AS
SELECT 
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    team.name AS team_name,
    creator.username AS created_by,
    assignee.username AS assigned_to
FROM tasks_task t
JOIN teams_team team ON t.team_id = team.id
JOIN users creator ON t.created_by_id = creator.id
LEFT JOIN users assignee ON t.assigned_to_id = assignee.id;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para contar miembros de un equipo
CREATE OR REPLACE FUNCTION count_team_members(team_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM teams_teammember
    WHERE team_id = $1;
    RETURN member_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tareas por estado
CREATE OR REPLACE FUNCTION get_tasks_by_status(p_status VARCHAR)
RETURNS TABLE(
    task_id INTEGER,
    title VARCHAR,
    status VARCHAR,
    team_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.status, team.name
    FROM tasks_task t
    JOIN teams_team team ON t.team_id = team.id
    WHERE t.status = p_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDICES ADICIONALES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX task_status_priority_idx ON tasks_task(status, priority);
CREATE INDEX event_date_range_idx ON calendar_app_event(start_date, end_date);
CREATE INDEX file_size_idx ON files_file(size);

COMMENT ON TABLE users IS 'Tabla principal de usuarios con roles';
COMMENT ON TABLE teams_team IS 'Equipos de trabajo';
COMMENT ON TABLE tasks_task IS 'Tareas con estados y prioridades';
COMMENT ON TABLE chat_message IS 'Mensajes del chat en tiempo real';
