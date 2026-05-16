from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChannelViewSet, MessageViewSet, DirectMessageViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'channels', ChannelViewSet, basename='channel')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'direct', DirectMessageViewSet, basename='direct-message')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
