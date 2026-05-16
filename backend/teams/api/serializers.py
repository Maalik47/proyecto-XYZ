from rest_framework import serializers
from ..models import Team, TeamMember
from users.api.serializers import UserSerializer


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'image', 'created_by', 'members_count', 'created_at', 'updated_at',
                  'allowed_extensions', 'max_file_size', 'allow_uploads']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.members.count()


class TeamDetailSerializer(TeamSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)

    class Meta(TeamSerializer.Meta):
        fields = TeamSerializer.Meta.fields + ['members']
