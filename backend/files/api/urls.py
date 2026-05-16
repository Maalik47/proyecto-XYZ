from django.urls import path
from .views import FolderViewSet, FileViewSet

urlpatterns = [
    path('files/', FileViewSet.as_view({'get': 'list', 'post': 'create'}), name='file-list'),
    path('files/<int:pk>/', FileViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='file-detail'),
    path('files/<int:pk>/download/', FileViewSet.as_view({'get': 'download'}), name='file-download'),
    path('folders/', FolderViewSet.as_view({'get': 'list', 'post': 'create'}), name='folder-list'),
    path('folders/<int:pk>/', FolderViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='folder-detail'),
]
