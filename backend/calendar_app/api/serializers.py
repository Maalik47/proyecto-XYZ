from rest_framework import serializers
from ..models import Event
from users.api.serializers import UserSerializer


class EventSerializer(serializers.ModelSerializer):
    attendees = UserSerializer(many=True, read_only=True)
    attendee_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'all_day', 'location',
                  'team', 'attendees', 'attendee_ids', 'reminder', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        attendee_ids = validated_data.pop('attendee_ids', [])
        validated_data['created_by'] = self.context['request'].user
        event = Event.objects.create(**validated_data)
        if attendee_ids:
            event.attendees.set(attendee_ids)
        return event

    def update(self, instance, validated_data):
        attendee_ids = validated_data.pop('attendee_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if attendee_ids is not None:
            instance.attendees.set(attendee_ids)
        return instance
