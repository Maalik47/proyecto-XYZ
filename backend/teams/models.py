from django.db import models
from django.conf import settings 


class Team(models.Model):
    ALLOWED_EXTENSIONS = [
        ('pdf', 'PDF'),
        ('doc', 'Word'),
        ('docx', 'Word'),
        ('xls', 'Excel'),
        ('xlsx', 'Excel'),
        ('ppt', 'PowerPoint'),
        ('pptx', 'PowerPoint'),
        ('txt', 'Texto'),
        ('zip', 'ZIP'),
        ('rar', 'RAR'),
        ('jpg', 'Imagen'),
        ('jpeg', 'Imagen'),
        ('png', 'Imagen'),
        ('gif', 'Imagen'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='teams/images/', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_teams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    allowed_extensions = models.JSONField(default=list, blank=True, verbose_name='Extensiones permitidas')
    max_file_size = models.IntegerField(default=10, verbose_name='Tamaño máximo (MB)')
    allow_uploads = models.BooleanField(default=True, verbose_name='Permitir subir archivos')

    class Meta:
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Propietario'),
        ('admin', 'Administrador'),
        ('member', 'Miembro'),
    ]
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Miembro de Equipo'
        verbose_name_plural = 'Miembros de Equipos'
        unique_together = ['team', 'user']

    def __str__(self):
        return f"{self.user} - {self.team}"
