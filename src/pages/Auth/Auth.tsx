import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth';
import styles from './Auth.module.scss';
import { LogoIcon } from '@/assets/svg/LogoSvg';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  // Theme is still applied globally, but we remove the manual toggle from this page


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
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div
        className={styles.authBox}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div 
          className={styles.logoHeader} 
          onClick={() => navigate('/')}
          title="Go to Home"
        >
          <LogoIcon />
          <span>Energy Twin</span>
        </div>

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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter username"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  <input
                    type="email"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="name@company.com"
                    required
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button 
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
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

            <div className={styles.toggleText}>
              {isLogin ? "New to EnergyTwin? " : "Already have an account? "}
              <button
                className={styles.toggleAction}
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setShowPassword(false);
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
