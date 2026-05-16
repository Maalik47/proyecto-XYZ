import hashlib
import base64
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_google_credentials(user):
    from chat.models import GoogleCalendarToken
    
    try:
        token_data = GoogleCalendarToken.objects.get(user=user)
    except GoogleCalendarToken.DoesNotExist:
        return None
    
    credentials = Credentials(
        token=token_data.access_token,
        refresh_token=token_data.refresh_token,
        token_uri=token_data.token_uri,
        client_id=token_data.client_id,
        client_secret=token_data.client_secret,
        scopes=token_data.scopes.split(',')
    )
    
    if credentials.expired:
        try:
            credentials.refresh(Request())
            token_data.access_token = credentials.token
            token_data.save(update_fields=['access_token', 'token_expiry'])
        except Exception:
            return None
    
    return credentials


def get_calendar_service(user):
    credentials = get_google_credentials(user)
    if not credentials:
        return None
    return build('calendar', 'v3', credentials=credentials)


def create_oauth_flow(state_data=None):
    from django.conf import settings
    import secrets
    
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')
    
    client_config = {
        'web': {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'redirect_uris': [settings.GOOGLE_REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    return flow, code_verifier, code_challenge


def get_authorization_url(user, code_verifier, code_challenge):
    flow, _, _ = create_oauth_flow()
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        code_challenge=code_challenge,
        code_challenge_method='S256',
        state=str(user.id)
    )
    
    return authorization_url, state


def exchange_code_for_tokens(code, code_verifier):
    from django.conf import settings
    
    client_config = {
        'web': {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'redirect_uris': [settings.GOOGLE_REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    flow.fetch_token(code=code, code_verifier=code_verifier)
    
    return flow


def save_tokens(user, credentials):
    from chat.models import GoogleCalendarToken
    
    GoogleCalendarToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': ','.join(credentials.scopes) if credentials.scopes else '',
            'token_expiry': credentials.expiry
        }
    )


def sync_event_to_google(user, event):
    service = get_calendar_service(user)
    if not service:
        return None
    
    start_dt = event.start_date if hasattr(event, 'start_date') else event.start
    end_dt = event.end_date if hasattr(event, 'end_date') else event.end
    
    if event.all_day:
        event_data = {
            'summary': event.title,
            'description': event.description or '',
            'start': {'date': start_dt.strftime('%Y-%m-%d')},
            'end': {'date': end_dt.strftime('%Y-%m-%d')},
        }
    else:
        event_data = {
            'summary': event.title,
            'description': event.description or '',
            'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'America/Mexico_City'},
            'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'America/Mexico_City'},
        }
    
    try:
        created_event = service.events().insert(calendarId='primary', body=event_data).execute()
        return created_event.get('id')
    except Exception as e:
        print(f"Error syncing event: {e}")
        return None


def sync_all_events(user, events_queryset):
    synced = errors = 0
    for event in events_queryset:
        try:
            if sync_event_to_google(user, event):
                synced += 1
            else:
                errors += 1
        except Exception:
            errors += 1
    return {'synced': synced, 'errors': errors}


def get_google_events(user):
    from django.utils import timezone
    
    service = get_calendar_service(user)
    if not service:
        return []
    
    now = timezone.now()
    
    try:
        events_result = service.events().list(
            calendarId='primary',
            singleEvents=True,
            orderBy='startTime',
            timeMin=now.isoformat(),
            maxResults=50
        ).execute()
        return events_result.get('items', [])
    except Exception:
        return []
