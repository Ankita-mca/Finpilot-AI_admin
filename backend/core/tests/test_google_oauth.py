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


@pytest.mark.django_db
class TestGoogleOAuthClockSkew:
    """Test clock skew handling in Google OAuth callback."""
    
    def test_clock_skew_error_redirects_without_creating_user(self, client: Client, monkeypatch):
        """When ID token verification fails due to clock skew, no user is created and redirect is returned."""
        from unittest.mock import patch, MagicMock
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        initial_user_count = User.objects.count()
        
        # Set up session state
        session = client.session
        session['google_oauth_state'] = 'test-state'
        session.save()
        
        # Mock settings
        monkeypatch.setattr('django.conf.settings.GOOGLE_CLIENT_ID', 'test-client-id')
        monkeypatch.setattr('django.conf.settings.GOOGLE_CLIENT_SECRET', 'test-secret')
        monkeypatch.setattr('django.conf.settings.GOOGLE_REDIRECT_URI', 'http://localhost:8000/callback')
        monkeypatch.setattr('django.conf.settings.GOOGLE_OAUTH_CLOCK_SKEW_SECONDS', 10)
        
        # Mock the requests.post for token exchange to return a valid response
        mock_token_response = MagicMock()
        mock_token_response.json.return_value = {'id_token': 'fake-token'}
        mock_token_response.raise_for_status = MagicMock()
        
        # Mock verify_oauth2_token to raise clock skew error
        with patch('requests.post', return_value=mock_token_response):
            with patch('google.oauth2.id_token.verify_oauth2_token') as mock_verify:
                mock_verify.side_effect = ValueError("Token used too early, 1794996878 < 1794996882")
                
                response = client.get('/api/v1/auth/google/callback/?code=test-code&state=test-state')
        
        # Assert response
        assert response.status_code == 400
        data = response.json()
        assert data['error_type'] == 'google_oauth_verification_error'
        assert 'redirect_url' in data
        assert 'google_error=verification_failed' in data['redirect_url']
        
        # Assert no user was created
        assert User.objects.count() == initial_user_count
        
        # Assert no session was set (user not logged in)
        assert '_auth_user_id' not in client.session
    
    def test_valid_token_with_future_iat_passes_with_clock_skew(self, client: Client, monkeypatch):
        """A token with iat 5s in the future passes when clock_skew is 10."""
        from unittest.mock import patch, MagicMock
        from django.contrib.auth import get_user_model
        import time
        
        User = get_user_model()
        
        # Set up session state
        session = client.session
        session['google_oauth_state'] = 'test-state'
        session.save()
        
        # Mock settings
        monkeypatch.setattr('django.conf.settings.GOOGLE_CLIENT_ID', 'test-client-id')
        monkeypatch.setattr('django.conf.settings.GOOGLE_CLIENT_SECRET', 'test-secret')
        monkeypatch.setattr('django.conf.settings.GOOGLE_REDIRECT_URI', 'http://localhost:8000/callback')
        monkeypatch.setattr('django.conf.settings.GOOGLE_OAUTH_CLOCK_SKEW_SECONDS', 10)
        
        # Mock the requests.post for token exchange
        mock_token_response = MagicMock()
        mock_token_response.json.return_value = {'id_token': 'fake-token'}
        mock_token_response.raise_for_status = MagicMock()
        
        # Mock verify_oauth2_token to return valid user info with future iat
        # (simulating a token issued 5 seconds in the future)
        future_iat = int(time.time()) + 5
        mock_idinfo = {
            'sub': 'google-user-123',
            'email': 'test@example.com',
            'email_verified': True,
            'given_name': 'Test',
            'family_name': 'User',
            'name': 'Test User',
            'iss': 'accounts.google.com',
            'iat': future_iat,
        }
        
        with patch('requests.post', return_value=mock_token_response):
            with patch('google.oauth2.id_token.verify_oauth2_token', return_value=mock_idinfo) as mock_verify:
                response = client.get('/api/v1/auth/google/callback/?code=test-code&state=test-state')
        
        # Assert verify was called with clock_skew_in_seconds parameter
        mock_verify.assert_called_once()
        call_kwargs = mock_verify.call_args[1]
        assert 'clock_skew_in_seconds' in call_kwargs
        assert call_kwargs['clock_skew_in_seconds'] == 10
        
        # Assert response is a redirect (successful login)
        assert response.status_code == 302
        assert response.url == 'http://localhost:5173'
        
        # Assert user was created
        user = User.objects.get(email='test@example.com')
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
        
        # Assert user is logged in
        assert '_auth_user_id' in client.session
