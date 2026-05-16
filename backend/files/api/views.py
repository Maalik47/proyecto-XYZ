from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from ..models import Folder, File
from .serializers import FolderSerializer, FileSerializer


class FolderViewSet(viewsets.ViewSet):
    def list(self, request):
        team_id = request.query_params.get('team')
        if team_id:
            folders = Folder.objects.filter(team_id=team_id)
        else:
            folders = Folder.objects.none()
        serializer = FolderSerializer(folders, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = FolderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
    def retrieve(self, request, pk=None):
        try:
            folder = Folder.objects.get(pk=pk)
        except Folder.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)
        serializer = FolderSerializer(folder)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        try:
            folder = Folder.objects.get(pk=pk)
            folder.delete()
            return Response(status=204)
        except Folder.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)


class FileViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser]

    def list(self, request):
        team_id = request.query_params.get('team')
        if team_id:
            files = File.objects.filter(team_id=team_id)
        else:
            files = File.objects.none()
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No se encontró archivo'}, status=400)
        
        name = request.data.get('name', file_obj.name)
        team_id = request.data.get('team')
        folder_id = request.data.get('folder')
        
        if not team_id:
            return Response({'error': 'Se requiere equipo'}, status=400)
        
        try:
            from files.models import File
            file_instance = File.objects.create(
                name=name,
                file=file_obj,
                team_id=team_id,
                folder_id=folder_id if folder_id else None,
                size=file_obj.size,
                mime_type=file_obj.content_type,
                uploaded_by=request.user
            )
            serializer = FileSerializer(file_instance)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    def retrieve(self, request, pk=None):
        try:
            file_obj = File.objects.get(pk=pk)
        except File.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)
        serializer = FileSerializer(file_obj)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        try:
            file_obj = File.objects.get(pk=pk)
            file_obj.delete()
            return Response(status=204)
        except File.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)
    
    def download(self, request, pk=None):
        try:
            file_obj = File.objects.get(pk=pk)
            response = HttpResponse(file_obj.file, content_type=file_obj.mime_type or 'application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file_obj.name}"'
            return response
        except File.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)
