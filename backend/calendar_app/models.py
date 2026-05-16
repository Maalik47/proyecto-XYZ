from django.db import models
from django.conf import settings
from teams.models import Team


class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=200, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='events')
    attendees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='events')
    reminder = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['start_date']

    def __str__(self):
        return self.title
