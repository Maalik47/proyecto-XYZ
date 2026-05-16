import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  
  const getRoleLabel = () => {
    const roles = { admin: 'Administrador', professor: 'Profesor', student: 'Estudiante' };
    return roles[user?.role] || user?.role;
  };
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    photo: null,
  });
  const [preview, setPreview] = useState(user?.photo || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('bio', formData.bio);
      if (formData.photo instanceof File) {
        console.log('Sending photo:', formData.photo.name, formData.photo);
        data.append('photo', formData.photo);
      }

      await userService.updateProfile(data);
      const updatedUser = await userService.getProfile();
      setUser(updatedUser);
      setEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Error desconocido';
      alert('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          {!editing && (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Editar
            </button>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-photo-section">
            {preview ? (
              <img src={preview} alt="Perfil" className="profile-photo-preview" />
            ) : user?.photo ? (
              <img src={user.photo} alt="Perfil" className="profile-photo-preview" />
            ) : (
              <div className="profile-photo-placeholder">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
            )}
            {editing && (
              <label className="profile-photo-upload">
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                Cambiar Foto
              </label>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Nombre</span>
                <span className="info-value">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Usuario</span>
                <span className="info-value">{user?.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Teléfono</span>
                <span className="info-value">{user?.phone || 'No registrado'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Rol</span>
                <span className="info-value role-badge">{getRoleLabel()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Biografía</span>
                <span className="info-value">{user?.bio || 'Sin biografía'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;