from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.api.urls')),
    path('api/teams/', include('teams.api.urls')),
    path('api/tasks/', include('tasks.api.urls')),
    path('api/calendar/', include('calendar_app.api.urls')),
    path('api/chat/', include('chat.api.urls')),
    path('api/calendar/google/', include('calendar_integration.urls')),
    path('api/', include('files.api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
