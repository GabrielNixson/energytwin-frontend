import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth';
import styles from './Auth.module.scss';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authService.login({ emailId, password });
        if (res.success && res.data) {
          login(res.data);
        } else {
          setError(res.message || 'Login failed');
        }
      } else {
        const res = await authService.signup({ userName, emailId, password });
        if (res.success && res.data) {
          login(res.data);
        } else {
          setError(res.message || 'Signup failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <h2>{isLogin ? 'Login to EnergyTwin' : 'Create an Account'}</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label>Username</label>
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                required 
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label>Email</label>
            <input 
              type="email" 
              value={emailId} 
              onChange={(e) => setEmailId(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            className={styles.authButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} disabled={loading}>
            {isLogin ? 'Sign up here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
