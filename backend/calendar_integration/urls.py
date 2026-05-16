from django.urls import path
from . import views

urlpatterns = [
    path('auth/', views.google_auth, name='google_auth'),
    path('callback/', views.google_callback, name='google_callback'),
    path('status/', views.google_status, name='google_status'),
    path('disconnect/', views.google_disconnect, name='google_disconnect'),
    path('sync/', views.google_sync, name='google_sync'),
    path('import/', views.google_import, name='google_import'),
]
