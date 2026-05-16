from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Event.objects.filter(team__members__user=self.request.user).distinct()
        team_id = self.request.query_params.get('team')
        start_date = self.request.query_params.get('start')
        end_date = self.request.query_params.get('end')
        if team_id:
            queryset = queryset.filter(team_id=team_id)
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
