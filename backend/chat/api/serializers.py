from rest_framework import serializers
from ..models import Channel, Message, DirectMessage, Notification
from users.api.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'channel', 'sender', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'sender', 'receiver', 'content', 'read', 'created_at']
        read_only_fields = ['id', 'sender', 'read', 'created_at']


class DirectMessageCreateSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField()
    content = serializers.CharField()

    def create(self, validated_data):
        sender = self.context['request'].user
        from users.models import User
        receiver = User.objects.get(id=validated_data['receiver_id'])
        return DirectMessage.objects.create(
            sender=sender,
            receiver=receiver,
            content=validated_data['content']
        )


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = ['id', 'name', 'description', 'channel_type', 'team', 'members', 'member_ids',
                  'created_by', 'last_message', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_last_message(self, obj):
        message = obj.messages.last()
        if message:
            return MessageSerializer(message).data
        return None

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        team = validated_data.get('team')
        validated_data['created_by'] = self.context['request'].user
        channel = Channel.objects.create(**validated_data)
        channel.members.add(self.context['request'].user)
        if member_ids:
            channel.members.add(*member_ids)
        if team:
            team_members = team.members.all()
            for tm in team_members:
                channel.members.add(tm.user)
        return channel


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'related_id', 'read', 'created_at']
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'related_id', 'read', 'created_at']
