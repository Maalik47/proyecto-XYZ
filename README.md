# Plataforma de Colaboración para Equipos de Trabajo

## Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso total. Puede asignar roles a otros usuarios. |
| **Profesor** | Crear equipos, agregar/eliminar integrantes. |
| **Estudiante** | Ver equipos, participar en tareas y archivos. |

## Tech Stack

- **Backend**: Django 6 + Django REST Framework + JWT
- **Frontend**: React 18 + Vite + React Router + Axios
- **Base de Datos**: PostgreSQL o MySQL (configurable)

## Instalación

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuración de Base de Datos

### PostgreSQL (Recomendado para producción)

1. Instalar PostgreSQL
2. Crear base de datos:
```bash
psql -U postgres -c "CREATE DATABASE plataforma_db;"
```

3. Configurar en `backend/.env`:
```env
DB_NAME=plataforma_db
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
```

4. Ejecutar migraciones:
```bash
python manage.py migrate
```

### MySQL

1. Instalar MySQL
2. Crear base de datos:
```sql
CREATE DATABASE plataforma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Configurar en `backend/.env`:
```env
DB_ENGINE=django.db.backends.mysql
DB_NAME=plataforma_db
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306
```

4. Instalar conector:
```bash
pip install mysqlclient
```

### SQLite (Desarrollo)

Ya viene configurado por defecto. No requiere configuración adicional.

## Credenciales

- **Usuario**: admin
- **Contraseña**: admin123
- **Rol**: Administrador

Para crear el admin:
```bash
python manage.py shell
>>> from users.models import User
>>> User.objects.create_superuser('admin', 'admin@test.com', 'admin123', role='admin')
```

## Ejecutar

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin Django: http://localhost:8000/admin/

## Estructura de Archivos

```
plataforma_colaborativa/
├── backend/
│   ├── users/          # Modelo de usuarios con roles
│   ├── teams/          # Equipos y membresías
│   ├── tasks/          # Tareas con prioridades
│   ├── calendar_app/   # Eventos
│   ├── chat/           # Canales y mensajes
│   ├── files/          # Archivos y carpetas
│   └── backend/        # Configuración Django
├── frontend/
│   └── src/
│       ├── pages/       # Componentes de página
│       ├── components/  # Componentes reutilizables
│       ├── services/    # API client
│       └── context/     # Auth context
├── database/
│   ├── postgres_schema.sql
│   └── mysql_schema.sql
└── README.md
```
