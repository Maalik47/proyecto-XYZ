from rest_framework import serializers
from ..models import Folder, File


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ['id', 'name', 'team', 'parent', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class FileSerializer(serializers.ModelSerializer):
    folder_name = serializers.CharField(source='folder.name', read_only=True, allow_null=True)

    class Meta:
        model = File
        fields = ['id', 'name', 'file', 'folder', 'folder_name', 'team', 'uploaded_by',
                  'size', 'mime_type', 'created_at', 'updated_at']
        read_only_fields = ['id', 'size', 'mime_type', 'created_at', 'updated_at']
