import { useState, useEffect, useRef } from 'react';
import { fileService, folderService, teamService } from '../services';
import api from '../services/api';
import './Files.css';

const Files = () => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        if (selectedTeam) {
            fetchData();
        }
    }, [selectedTeam, currentFolder]);

    const fetchTeams = async () => {
        try {
            const response = await teamService.getAll();
            const teamsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setTeams(teamsData);
            if (teamsData.length > 0 && !selectedTeam) {
                setSelectedTeam(teamsData[0].id);
            }
        } catch (error) {
            console.error('Error fetching teams:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const teamId = parseInt(selectedTeam);
            if (!teamId) return;
            
            const params = { team: teamId };
            if (currentFolder) {
                params.folder = parseInt(currentFolder);
            }
            
            const [filesRes, foldersRes] = await Promise.all([
                fileService.getAll(params),
                folderService.getAll(params),
            ]);
            setFiles(Array.isArray(filesRes.data) ? filesRes.data : (filesRes.data.results || []));
            setFolders(Array.isArray(foldersRes.data) ? foldersRes.data : (foldersRes.data.results || []));
        } catch (error) {
            console.error('Error fetching data:', error.response?.data || error.message);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('team', parseInt(selectedTeam));
        if (currentFolder) {
            formData.append('folder', parseInt(currentFolder));
        }
        
        try {
            await fileService.upload(formData);
            fetchData();
        } catch (error) {
            console.error('Error uploading file:', error.response?.data || error.message);
            alert('Error al subir archivo: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        try {
            const data = { name: folderName, team: parseInt(selectedTeam) };
            if (currentFolder) {
                data.parent = parseInt(currentFolder);
            }
            await folderService.create(data);
            setFolderName('');
            setShowFolderForm(false);
            fetchData();
        } catch (error) {
            console.error('Error creating folder:', error.response?.data || error.message);
            alert('Error al crear carpeta: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (window.confirm('¿Eliminar este archivo?')) {
            try {
                await fileService.delete(fileId);
                fetchData();
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }
    };

    const handleDeleteFolder = async (folderId) => {
        if (window.confirm('¿Eliminar esta carpeta y todo su contenido?')) {
            try {
                await folderService.delete(folderId);
                fetchData();
            } catch (error) {
                console.error('Error deleting folder:', error);
            }
        }
    };

    const openFolder = (folder) => {
        setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
    };

    const goToBreadcrumb = (index) => {
        if (index === -1) {
            setBreadcrumb([]);
            setCurrentFolder(null);
        } else {
            const newBreadcrumb = breadcrumb.slice(0, index + 1);
            setBreadcrumb(newBreadcrumb);
            setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDownload = async (file) => {
        try {
            const response = await api.get(`files/${file.id}/download/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    if (loading) return <div className="loading"></div>;

    return (
        <div className="files-page">
            <div className="page-header">
                <h1>Archivos</h1>
                <div className="header-actions">
                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(parseInt(e.target.value))}>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <label className="upload-btn">
                        {uploading ? 'Subiendo...' : '+ Subir Archivo'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                    <button className="btn-secondary" onClick={() => setShowFolderForm(!showFolderForm)}>
                        + Nueva Carpeta
                    </button>
                </div>
            </div>

            {breadcrumb.length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-dark)' }}>
                    <button className="btn-back" onClick={() => goToBreadcrumb(-1)} style={{ marginBottom: 0 }}>
                        Inicio
                    </button>
                    {breadcrumb.map((item, index) => (
                        <span key={item.id}>
                            <span style={{ color: 'var(--gray)' }}>/</span>
                            <button
                                className="btn-back"
                                onClick={() => goToBreadcrumb(index)}
                                style={{
                                    marginBottom: 0,
                                    background: index === breadcrumb.length - 1 ? 'var(--primary)' : 'var(--gray-light)',
                                    color: index === breadcrumb.length - 1 ? 'white' : 'var(--dark)'
                                }}
                            >
                                {item.name}
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {showFolderForm && (
                <form className="folder-form" onSubmit={handleCreateFolder}>
                    <input
                        type="text"
                        placeholder="Nombre de la carpeta"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary">Crear</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowFolderForm(false)}>
                        Cancelar
                    </button>
                </form>
            )}

            <div className="files-container">
                {folders.length === 0 && files.length === 0 ? (
                    <div className="no-files">
                        <div className="icon">📂</div>
                        <h3>No hay archivos</h3>
                        <p>Sube tu primer archivo o crea una carpeta</p>
                    </div>
                ) : (
                    <>
                        {folders.length > 0 && (
                            <div className="folders-section">
                                <h3 className="section-title">📁 Carpetas</h3>
                                <div className="folders-grid">
                                    {folders.map((folder) => (
                                        <div key={folder.id} className="folder-item">
                                            <span className="folder-icon">📁</span>
                                            <div className="folder-info">
                                                <div className="folder-name">{folder.name}</div>
                                            </div>
                                            <div className="file-actions">
                                                <button className="delete-btn" onClick={() => handleDeleteFolder(folder.id)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                            <button
                                                style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                                onClick={() => openFolder(folder)}
                                            >
                                                Abrir
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className="files-section">
                                <h3 className="section-title">📄 Archivos</h3>
                                <div className="files-grid">
                                    {files.map((file) => (
                                        <div key={file.id} className="file-item">
                                            <span className="file-icon">📄</span>
                                            <div className="file-info">
                                                <div className="file-name">{file.name}</div>
                                                <div className="file-meta">{formatFileSize(file.size || 0)}</div>
                                            </div>
                                            <div className="file-actions">
                                                <button className="download-btn" onClick={() => handleDownload(file)}>
                                                    Descargar
                                                </button>
                                                <button className="delete-btn" onClick={() => handleDeleteFile(file.id)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Files;
