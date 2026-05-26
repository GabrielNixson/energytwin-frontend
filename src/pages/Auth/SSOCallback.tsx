import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Handles the OAuth/SSO redirect from the backend.
 * Backend redirects to: /auth/sso-success?accessToken=<jwt>
 * On error:            /auth/error?message=SSO+authentication+failed
 */
const SSOCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken, checkAuth } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const error = searchParams.get('message');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      setStatus('error');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (!token) {
      setErrorMsg('No access token received from SSO provider.');
      setStatus('error');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    // Save the token then verify with /api/auth/me
    setAccessToken(token);
    checkAuth().then(() => {
      navigate('/', { replace: true });
    });
  }, [searchParams, navigate, setAccessToken, checkAuth]);

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: '1rem',
        color: 'var(--text-primary)', background: 'var(--background)'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>SSO Authentication Failed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{errorMsg}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '1rem',
      color: 'var(--text-primary)', background: 'var(--background)'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Completing sign-in...</p>
    </div>
  );
};

export default SSOCallback;
