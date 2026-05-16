from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.cache import cache

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_auth(request):
    from .google_calendar import create_oauth_flow, get_authorization_url
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        flow, code_verifier, code_challenge = create_oauth_flow()
        authorization_url, state = get_authorization_url(request.user, code_verifier, code_challenge)
        
        cache.set(f'google_oauth_{request.user.id}', code_verifier, timeout=300)
        
        return Response({'authorization_url': authorization_url})
    except ValueError as e:
        logger.error(f"ValueError: {e}")
        return Response({'error': str(e)}, status=500)
    except Exception as e:
        logger.error(f"Exception: {e}", exc_info=True)
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    from .google_calendar import exchange_code_for_tokens, save_tokens
    import logging
    logger = logging.getLogger(__name__)
    
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    if not code:
        return Response({'error': 'No se recibió el código'}, status=400)
    
    if not state or not state.isdigit():
        return Response({'error': 'State inválido'}, status=400)
    
    try:
        user = User.objects.get(id=int(state))
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=400)
    
    code_verifier = cache.get(f'google_oauth_{user.id}')
    cache.delete(f'google_oauth_{user.id}')
    
    if not code_verifier:
        return Response({'error': 'Sesión expirada. Intenta de nuevo.'}, status=400)
    
    try:
        flow = exchange_code_for_tokens(code, code_verifier)
        save_tokens(user, flow.credentials)
        
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173/calendar')
        from django.shortcuts import redirect
        return redirect(frontend_url + '?connected=true')
    except Exception as e:
        logger.error(f"Callback error: {e}", exc_info=True)
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173/calendar')
        from django.shortcuts import redirect
        return redirect(frontend_url + '?error=' + str(e))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_status(request):
    from .google_calendar import get_calendar_service
    from chat.models import GoogleCalendarToken
    
    try:
        GoogleCalendarToken.objects.get(user=request.user)
        service = get_calendar_service(request.user)
        return Response({
            'connected': service is not None,
            'email': request.user.email
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'connected': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_disconnect(request):
    from chat.models import GoogleCalendarToken
    
    try:
        GoogleCalendarToken.objects.get(user=request.user).delete()
        return Response({'message': 'Google Calendar desconectado'})
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'No había conexión'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_sync(request):
    from .google_calendar import sync_all_events
    from calendar_app.models import Event
    
    team_id = request.data.get('team_id')
    events = Event.objects.filter(team_id=team_id) if team_id else Event.objects.all()
    result = sync_all_events(request.user, events)
    
    return Response({
        'message': f'Sincronizados {result["synced"]} eventos',
        'synced': result['synced'],
        'errors': result['errors']
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_import(request):
    from .google_calendar import get_google_events
    from calendar_app.models import Event
    from teams.models import Team
    import logging
    from datetime import datetime
    
    logger = logging.getLogger(__name__)
    
    team_id = request.data.get('team_id')
    
    if not team_id:
        return Response({'error': 'Se requiere equipo'}, status=400)
    
    try:
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        return Response({'error': 'Equipo no encontrado'}, status=404)
    
    google_events = get_google_events(request.user)
    
    imported = 0
    skipped = 0
    
    for g_event in google_events:
        try:
            start = g_event.get('start', {})
            end = g_event.get('end', {})
            
            title = g_event.get('summary', 'Sin título')
            
            existing = Event.objects.filter(team=team, title=title).first()
            if existing:
                skipped += 1
                continue
            
            if 'dateTime' in start:
                start_dt = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
                all_day = False
            else:
                start_dt = start.get('date')
                end_dt = end.get('date')
                all_day = True
            
            Event.objects.create(
                team=team,
                title=title,
                description=g_event.get('description', ''),
                start_date=start_dt,
                end_date=end_dt,
                all_day=all_day,
                created_by=request.user
            )
            
            imported += 1
                
        except Exception as e:
            logger.error(f"Error importing event: {e}")
    
    return Response({
        'message': f'Importados {imported} eventos de Google Calendar',
        'imported': imported,
        'skipped': skipped
    })
