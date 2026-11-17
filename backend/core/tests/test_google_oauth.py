"""
Tests for Google OAuth authentication endpoints.
"""
import pytest
from django.test import Client
from django.conf import settings


@pytest.mark.django_db
class TestGoogleOAuthStart:
    """Test the Google OAuth initiation endpoint."""
    
    def test_google_oauth_start_returns_auth_url_when_configured(self, client: Client, monkeypatch):
        """When Google credentials are configured, returns an authorization URL."""
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_ID', 'test-client-id')
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_SECRET', 'test-client-secret')
        monkeypatch.setattr(settings, 'GOOGLE_REDIRECT_URI', 'http://localhost:8000/callback')
        
        response = client.get('/api/v1/auth/google/')
        
        assert response.status_code == 200
        data = response.json()
        assert 'auth_url' in data
        assert 'accounts.google.com' in data['auth_url']
        assert 'test-client-id' in data['auth_url']
        assert 'state=' in data['auth_url']
    
    def test_google_oauth_start_stores_state_in_session(self, client: Client, monkeypatch):
        """State token is stored in session for CSRF protection."""
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_ID', 'test-client-id')
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_SECRET', 'test-client-secret')
        
        response = client.get('/api/v1/auth/google/')
        
        assert response.status_code == 200
        assert 'google_oauth_state' in client.session
        assert len(client.session['google_oauth_state']) > 20
        assert 'google_oauth_initiated_at' in client.session
    
    def test_google_oauth_start_returns_503_when_not_configured(self, client: Client, monkeypatch):
        """When Google credentials are missing, returns 503 Service Unavailable."""
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_ID', '')
        monkeypatch.setattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        
        response = client.get('/api/v1/auth/google/')
        
        assert response.status_code == 503
        data = response.json()
        assert data['error_type'] == 'google_oauth_not_configured'


@pytest.mark.django_db
class TestGoogleOAuthCallback:
    """Test the Google OAuth callback endpoint."""
    
    def test_google_oauth_callback_rejects_missing_state(self, client: Client):
        """Callback without state parameter returns error."""
        response = client.get('/api/v1/auth/google/callback/?code=test-code')
        
        assert response.status_code == 400
        data = response.json()
        assert data['error_type'] == 'google_oauth_csrf_error'
        assert 'redirect_url' in data
    
    def test_google_oauth_callback_rejects_invalid_state(self, client: Client):
        """Callback with wrong state parameter returns error."""
        session = client.session
        session['google_oauth_state'] = 'valid-state-token'
        session.save()
        
        response = client.get('/api/v1/auth/google/callback/?code=test-code&state=wrong-state')
        
        assert response.status_code == 400
        data = response.json()
        assert data['error_type'] == 'google_oauth_csrf_error'
    
    def test_google_oauth_callback_rejects_google_error(self, client: Client):
        """Callback with error from Google returns error."""
        response = client.get('/api/v1/auth/google/callback/?error=access_denied&error_description=User+denied+access')
        
        assert response.status_code == 400
        data = response.json()
        assert data['error_type'] == 'google_oauth_error'
        assert 'User denied access' in data['error']
    
    def test_google_oauth_callback_requires_code(self, client: Client):
        """Callback without authorization code returns error."""
        session = client.session
        session['google_oauth_state'] = 'test-state'
        session.save()
        
        response = client.get('/api/v1/auth/google/callback/?state=test-state')
        
        assert response.status_code == 400
        data = response.json()
        assert data['error_type'] == 'google_oauth_no_code'
