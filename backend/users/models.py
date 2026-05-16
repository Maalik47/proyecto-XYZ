from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ('admin', 'Administrador'),
        ('professor', 'Profesor'),
        ('student', 'Estudiante'),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default='student', verbose_name='Rol')
    photo = models.ImageField(upload_to='users/photos/', null=True, blank=True, verbose_name='Foto')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    bio = models.TextField(blank=True, verbose_name='Biografía')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_professor(self):
        return self.role == 'professor'

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def can_create_teams(self):
        return self.role in ['admin', 'professor']

    @property
    def can_manage_team_members(self):
        return self.role in ['admin', 'professor']

    @property
    def can_assign_roles(self):
        return self.role == 'admin'
