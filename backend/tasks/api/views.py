from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from ..models import Task, Tag, TaskComment, TaskFile
from teams.models import TeamMember
from .serializers import TaskSerializer, TagSerializer, TaskCommentSerializer, TaskFileSerializer


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all() if self.request.user.role == 'admin' else Task.objects.filter(team__members__user=self.request.user).distinct()
        team_id = self.request.query_params.get('team')
        status_filter = self.request.query_params.get('status')
        if team_id:
            queryset = queryset.filter(team_id=team_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def create(self, request, *args, **kwargs):
        team_id = request.data.get('team')
        if not team_id:
            return Response({'team': ['Este campo es requerido']}, status=status.HTTP_400_BAD_REQUEST)
        
        is_member = TeamMember.objects.filter(team_id=team_id, user=request.user).exists()
        if not is_member:
            return Response(
                {'error': 'Debes ser miembro del equipo para crear tareas'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        new_status = request.data.get('status')
        user = request.user

        if new_status == 'completed' and task.status != 'completed':
            if user.role == 'student':
                return Response(
                    {'error': 'Los estudiantes no pueden marcar tareas como completadas. Contacta a tu profesor o administrador.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if new_status == 'in_progress' and task.status == 'completed':
            if user.role == 'student':
                return Response(
                    {'error': 'Los estudiantes no pueden reopen una tarea completada.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if user.role not in ['admin', 'professor']:
                return Response(
                    {'error': 'Solo administradores y profesores pueden reopen tareas.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def request_completion(self, request, pk=None):
        task = self.get_object()
        
        if request.user.role != 'student':
            return Response(
                {'error': 'Solo estudiantes pueden solicitar completación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status != 'in_progress':
            return Response(
                {'error': 'La tarea no está en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.completion_requested = True
        from django.utils import timezone
        task.completion_requested_at = timezone.now()
        task.save()
        
        return Response({'message': 'Solicitud enviada al profesor'})

    @action(detail=True, methods=['post'])
    def approve_completion(self, request, pk=None):
        task = self.get_object()
        user = request.user

        if user.role not in ['admin', 'professor']:
            return Response(
                {'error': 'Solo administradores y profesores pueden aprobar completaciones.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if task.status != 'in_progress':
            return Response(
                {'error': 'La tarea no está en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = 'completed'
        task.completed_by = user
        task.completion_requested = False
        from django.utils import timezone
        task.completed_at = timezone.now()
        task.save()

        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], serializer_class=TaskCommentSerializer)
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.all()
            serializer = TaskCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], serializer_class=TaskFileSerializer, parser_classes=[MultiPartParser, FormParser])
    def files(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            files = task.files.all()
            serializer = TaskFileSerializer(files, many=True)
            return Response(serializer.data)
        
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No se recibió archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        allow_uploads = task.allow_uploads if task.allow_uploads is not None else (task.team.allow_uploads if task.team else True)
        if not allow_uploads:
            return Response({'error': 'Esta tarea no permite subir archivos'}, status=status.HTTP_403_FORBIDDEN)
        
        ext = uploaded_file.name.split('.')[-1].lower()
        allowed = task.allowed_extensions if task.allowed_extensions else (task.team.allowed_extensions if task.team else [])
        if allowed and ext not in allowed:
            return Response({'error': f'Extensión .{ext} no permitida. Solo se permiten: {", ".join(allowed)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        max_size = (task.max_file_size or task.team.max_file_size or 10) * 1024 * 1024
        if uploaded_file.size > max_size:
            max_mb = task.max_file_size or task.team.max_file_size or 10
            return Response({'error': f'Archivo demasiado grande. Máximo: {max_mb}MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        task_file = TaskFile.objects.create(
            task=task,
            uploaded_by=request.user,
            file=uploaded_file,
            filename=uploaded_file.name
        )
        serializer = TaskFileSerializer(task_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='files/(?P<file_id>[^/.]+)')
    def delete_file(self, request, pk=None, file_id=None):
        task = self.get_object()
        try:
            task_file = task.files.get(id=file_id)
            task_file.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskFile.DoesNotExist:
            return Response({'error': 'Archivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
