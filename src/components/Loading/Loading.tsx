import React from 'react';
import { motion } from 'framer-motion';
import styles from './Loading.module.scss';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = "Loading data...", fullPage = false }) => {
  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <div className={styles.spinnerWrapper}>
        <motion.div 
          className={styles.outerRing}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className={styles.innerRing}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className={styles.core}
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.div 
        className={styles.text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {message}
      </motion.div>
    </div>
  );
};

export default Loading;
