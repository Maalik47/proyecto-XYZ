from django.db import models
from django.conf import settings
from teams.models import Team


class Channel(models.Model):
    TYPE_CHOICES = [
        ('team', 'Equipo'),
        ('private', 'Privado'),
    ]
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    channel_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='team')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name='channels')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='channels')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Canal'
        verbose_name_plural = 'Canales'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Message(models.Model):
    content = models.TextField()
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Mensaje'
        verbose_name_plural = 'Mensajes'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"


class DirectMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Mensaje Directo'
        verbose_name_plural = 'Mensajes Directos'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} -> {self.receiver}: {self.content[:50]}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('task_due', 'Tarea próxima a vencer'),
        ('task_overdue', 'Tarea vencida'),
        ('team_invite', 'Invitación a equipo'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='task_due')
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_id = models.PositiveIntegerField(null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user}: {self.title}"


class GoogleCalendarToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_calendar_token')
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_uri = models.CharField(max_length=500)
    client_id = models.CharField(max_length=500)
    client_secret = models.CharField(max_length=500)
    scopes = models.TextField()
    token_expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Token de Google Calendar'
        verbose_name_plural = 'Tokens de Google Calendar'

    def __str__(self):
        return f"Google Calendar - {self.user.username}"
