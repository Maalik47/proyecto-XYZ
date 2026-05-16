-- ============================================
-- PLATAFORMA COLABORATIVA - BASE DE DATOS
-- MySQL
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS plataforma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE plataforma_db;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME NULL,
    is_superuser TINYINT(1) DEFAULT 0,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NULL,
    last_name VARCHAR(150) NULL,
    email VARCHAR(254) NULL,
    is_staff TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'student',
    photo VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    bio TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE EQUIPOS
-- ============================================
CREATE TABLE teams_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_by (created_by_id),
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE MIEMBROS DE EQUIPO
-- ============================================
CREATE TABLE teams_teammember (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_team (team_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE ETIQUETAS
-- ============================================
CREATE TABLE tasks_tag (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3788d8'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE TAREAS
-- ============================================
CREATE TABLE tasks_task (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to_id INT NULL,
    team_id INT NOT NULL,
    due_date DATETIME NULL,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status_priority (status, priority),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE RELACIÓN TAREA-ETIQUETAS
-- ============================================
CREATE TABLE tasks_task_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    UNIQUE KEY unique_task_tag (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks_task(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tasks_tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE EVENTOS (CALENDARIO)
-- ============================================
CREATE TABLE calendar_app_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    all_day TINYINT(1) DEFAULT 0,
    location VARCHAR(200) NULL,
    team_id INT NOT NULL,
    reminder TINYINT(1) DEFAULT 1,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    INDEX idx_start_date (start_date),
    INDEX idx_date_range (start_date, end_date),
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE ASISTENTES A EVENTOS
-- ============================================
CREATE TABLE calendar_app_event_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    UNIQUE KEY unique_event_user (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES calendar_app_event(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE CANALES DE CHAT
-- ============================================
CREATE TABLE chat_channel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    channel_type VARCHAR(20) DEFAULT 'team',
    team_id INT NULL,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE MIEMBROS DE CANAL
-- ============================================
CREATE TABLE chat_channel_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    user_id INT NOT NULL,
    UNIQUE KEY unique_channel_user (channel_id, user_id),
    FOREIGN KEY (channel_id) REFERENCES chat_channel(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE MENSAJES
-- ============================================
CREATE TABLE chat_message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    channel_id INT NOT NULL,
    sender_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_channel (channel_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (channel_id) REFERENCES chat_channel(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE CARPETAS
-- ============================================
CREATE TABLE files_folder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INT NOT NULL,
    parent_id INT NULL,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES files_folder(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE ARCHIVOS
-- ============================================
CREATE TABLE files_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file VARCHAR(100) NOT NULL,
    folder_id INT NULL,
    team_id INT NOT NULL,
    uploaded_by_id INT NOT NULL,
    size BIGINT DEFAULT 0,
    mime_type VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team (team_id),
    INDEX idx_folder (folder_id),
    INDEX idx_uploaded (uploaded_by_id),
    INDEX idx_size (size),
    FOREIGN KEY (folder_id) REFERENCES files_folder(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams_team(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE AUTENTICACIÓN (Django)
-- ============================================
CREATE TABLE auth_group (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INT NOT NULL,
    codename VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_content_codename (content_type_id, codename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_group_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    permission_id INT NOT NULL,
    UNIQUE KEY unique_group_permission (group_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_user_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    UNIQUE KEY unique_user_group (user_id, group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_user_user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE DJANGO
-- ============================================
CREATE TABLE django_content_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_app_model (app_label, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data MEDIUMTEXT NOT NULL,
    expire_date DATETIME NOT NULL,
    INDEX idx_expire_date (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE django_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================

DELIMITER //

-- Contar miembros de un equipo
CREATE PROCEDURE count_team_members(IN p_team_id INT)
BEGIN
    SELECT COUNT(*) AS member_count
    FROM teams_teammember
    WHERE team_id = p_team_id;
END //

-- Obtener tareas por estado
CREATE PROCEDURE get_tasks_by_status(IN p_status VARCHAR(20))
BEGIN
    SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, 
           team.name AS team_name, u.username AS created_by
    FROM tasks_task t
    JOIN teams_team team ON t.team_id = team.id
    JOIN users u ON t.created_by_id = u.id
    WHERE t.status = p_status
    ORDER BY t.created_at DESC;
END //

-- Estadísticas del dashboard
CREATE PROCEDURE get_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM teams_team) AS total_teams,
        (SELECT COUNT(*) FROM tasks_task WHERE status = 'pending') AS pending_tasks,
        (SELECT COUNT(*) FROM tasks_task WHERE status = 'in_progress') AS in_progress_tasks,
        (SELECT COUNT(*) FROM tasks_task WHERE status = 'completed') AS completed_tasks,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM chat_message WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS messages_today;
END //

DELIMITER ;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Grupos de roles
INSERT INTO auth_group (name) VALUES ('Administradores');
INSERT INTO auth_group (name) VALUES ('Profesores');
INSERT INTO auth_group (name) VALUES ('Estudiantes');
