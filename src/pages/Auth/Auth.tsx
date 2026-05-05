import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { authService } from '../../services/auth';
import { SunIcon, MoonIcon } from '../../assets/svg/Misc';
import styles from './Auth.module.scss';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  // Theme is still applied globally, but we remove the manual toggle from this page
  const { theme } = useUIStore();

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // Implementation would typically redirect to backend or use a library such as firebase or supabase
    // window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

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
          setError(res.message || 'Invalid credentials. Please try again.');
        }
      } else {
        const res = await authService.signup({ userName, emailId, password });
        if (res.success && res.data) {
          console.log(res.data);
          login(res.data);
        } else {
          setError(res.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'A connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const formVariants = {
    initial: { opacity: 0, x: isLogin ? -20 : 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isLogin ? 20 : -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div
        className={styles.authBox}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={formVariants.transition}
          >
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className={styles.subtitle}>
              {isLogin
                ? 'Enter your credentials to access EnergyTwin'
                : 'Join us to start managing your energy ecosystem'}
            </p>

            {error && (
              <motion.div
                className={styles.errorMessage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <div className={styles.inputWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: '#666' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter username"
                      style={{ paddingLeft: '40px' }}
                      required
                    />
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: '#666' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  <input
                    type="email"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="name@company.com"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <div className={styles.inputWrapper}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: '#666' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={styles.authButton}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </motion.button>
            </form>

            {/* <div className={styles.divider}>
              <span>Or continue with</span>
            </div>

            <div className={styles.socialButtons}>
              <button 
                className={`${styles.socialButton} ${styles.google}`} 
                type="button" 
                aria-label="Sign in with Google"
                onClick={() => handleSocialLogin('google')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
              <button 
                className={`${styles.socialButton} ${styles.github}`} 
                type="button" 
                aria-label="Sign in with GitHub"
                onClick={() => handleSocialLogin('github')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
              <button 
                className={`${styles.socialButton} ${styles.microsoft}`} 
                type="button" 
                aria-label="Sign in with Microsoft"
                onClick={() => handleSocialLogin('microsoft')}
              >
                <svg viewBox="0 0 23 23">
                  <path fill="#f25022" d="M0 0h11v11H0z"/>
                  <path fill="#7fba00" d="M12 0h11v11H12z"/>
                  <path fill="#00a4ef" d="M0 12h11v11H0z"/>
                  <path fill="#ffb900" d="M12 12h11v11H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div> */}

            <div className={styles.toggleText}>
              {isLogin ? "New to EnergyTwin? " : "Already have an account? "}
              <button
                className={styles.toggleAction}
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                disabled={loading}
              >
                {isLogin ? 'Create one now' : 'Sign in here'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;
