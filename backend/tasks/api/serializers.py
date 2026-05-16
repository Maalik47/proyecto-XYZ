from rest_framework import serializers
from ..models import Task, Tag, TaskComment, TaskFile
from users.api.serializers import UserSerializer


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class TaskFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskFile
        fields = ['id', 'file', 'filename', 'uploaded_by', 'created_at']
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'content', 'author', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    created_by = UserSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 'assigned_to', 'assigned_to_id',
                  'team', 'tags', 'tag_ids', 'due_date', 'created_by', 'created_at', 'updated_at',
                  'completed_by', 'completed_at', 'completion_requested', 'completion_requested_at',
                  'comments', 'files', 'allow_uploads', 'allowed_extensions', 'max_file_size']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'completed_by', 'completed_at', 
                            'completion_requested', 'completion_requested_at', 'comments', 'files']

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = 'in_progress'
        task = Task.objects.create(**validated_data)
        if tag_ids:
            task.tags.set(tag_ids)
        return task

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        
        if 'status' in validated_data:
            new_status = validated_data['status']
            if new_status == 'completed' and instance.status != 'completed':
                validated_data['completed_by'] = self.context['request'].user
                from django.utils import timezone
                validated_data['completed_at'] = timezone.now()
            elif new_status == 'in_progress':
                user = self.context['request'].user
                if user.role == 'student':
                    pass
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance
