from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, timedelta
from ..models import Channel, Message, DirectMessage, Notification
from teams.models import TeamMember
from users.models import User
from tasks.models import Task
from .serializers import ChannelSerializer, MessageSerializer, DirectMessageSerializer, DirectMessageCreateSerializer, NotificationSerializer


class ChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        direct_channels = Channel.objects.filter(members=self.request.user)
        user_teams = TeamMember.objects.filter(user=self.request.user).values_list('team_id', flat=True)
        team_channels = Channel.objects.filter(team_id__in=user_teams)
        return (direct_channels | team_channels).distinct()

    def get_serializer_class(self):
        return ChannelSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        channel = self.get_object()
        messages = channel.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        channel_id = self.request.query_params.get('channel')
        if channel_id:
            return Message.objects.filter(channel_id=channel_id, channel__members=self.request.user)
        return Message.objects.filter(channel__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class DirectMessageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        dms = DirectMessage.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).order_by('-created_at')
        
        conversations = {}
        for dm in dms:
            other_user = dm.receiver if dm.sender == request.user else dm.sender
            if other_user.id not in conversations:
                conversations[other_user.id] = {
                    'user': {
                        'id': other_user.id,
                        'username': other_user.username,
                        'first_name': other_user.first_name,
                        'last_name': other_user.last_name,
                    },
                    'last_message': DirectMessageSerializer(dm).data,
                    'unread_count': DirectMessage.objects.filter(
                        sender=other_user,
                        receiver=request.user,
                        read=False
                    ).count()
                }
        
        return Response(list(conversations.values()))

    def create(self, request):
        serializer = DirectMessageCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            dm = serializer.save()
            return Response(DirectMessageSerializer(dm).data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'])
    def with_user(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id es requerido'}, status=400)
        
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
        
        dms = DirectMessage.objects.filter(
            Q(sender=request.user, receiver=other_user) |
            Q(sender=other_user, receiver=request.user)
        ).order_by('created_at')
        
        DirectMessage.objects.filter(sender=other_user, receiver=request.user).update(read=True)
        
        return Response(DirectMessageSerializer(dms, many=True).data)

    @action(detail=False, methods=['get'])
    def users(self, request):
        users = User.objects.exclude(id=request.user.id).values('id', 'username', 'first_name', 'last_name')
        return Response(users)

    @action(detail=False, methods=['get'], url_path='users/(?P<other_id>[^/.]+)')
    def messages_with_user(self, request, other_id=None):
        try:
            other_user = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
        
        dms = DirectMessage.objects.filter(
            Q(sender=request.user, receiver=other_user) |
            Q(sender=other_user, receiver=request.user)
        ).order_by('created_at')
        
        DirectMessage.objects.filter(sender=other_user, receiver=request.user).update(read=True)
        
        return Response(DirectMessageSerializer(dms, many=True).data)


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:20]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        notification_id = request.data.get('notification_id')
        if notification_id:
            Notification.objects.filter(id=notification_id, user=request.user).update(read=True)
        else:
            Notification.objects.filter(user=request.user).update(read=True)
        return Response({'message': 'Notificaciones marcadas como leídas'})

    @action(detail=False, methods=['get'])
    def task_reminders(self, request):
        try:
            from django.utils import timezone
            from tasks.models import Task
            
            now = timezone.now()
            tomorrow = now + timedelta(days=1)
            tomorrow_start = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow_end = tomorrow_start + timedelta(days=1)
            
            user_team_ids = TeamMember.objects.filter(user=request.user).values_list('team_id', flat=True)
            
            incomplete_tasks = Task.objects.filter(
                team_id__in=user_team_ids,
                status__in=['pending', 'in_progress'],
                due_date__isnull=False,
                due_date__gte=tomorrow_start,
                due_date__lt=tomorrow_end
            )

            reminders = []
            for task in incomplete_tasks:
                if not task.due_date:
                    continue
                time_until_due = task.due_date - now
                hours_left = int(time_until_due.total_seconds() / 3600)
                
                reminders.append({
                    'id': task.id,
                    'title': task.title,
                    'due_date': task.due_date.isoformat(),
                    'hours_remaining': hours_left,
                    'team': task.team.name if task.team else None,
                    'priority': task.priority
                })

            return Response(reminders)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
