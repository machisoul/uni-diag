import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AnimatedPingButton.css';

export interface AnimatedPingButtonProps {
  onPing: () => Promise<boolean>; // 返回ping是否成功
  disabled?: boolean;
  className?: string;
}

type PingState = 'idle' | 'loading' | 'success' | 'error';

const AnimatedPingButton: React.FC<AnimatedPingButtonProps> = ({
  onPing,
  disabled = false,
  className = ''
}) => {
  const [pingState, setPingState] = useState<PingState>('idle');

  const handleClick = useCallback(async () => {
    if (disabled || pingState === 'loading') return;

    setPingState('loading');

    try {
      const success = await onPing();

      if (success) {
        setPingState('success');
        // 2秒后恢复到idle状态
        setTimeout(() => setPingState('idle'), 2000);
      } else {
        setPingState('error');
        // 1.5秒后恢复到idle状态
        setTimeout(() => setPingState('idle'), 1500);
      }
    } catch (error) {
      setPingState('error');
      setTimeout(() => setPingState('idle'), 1500);
    }
  }, [onPing, disabled, pingState]);

  const getButtonVariants = () => {
    const baseVariants = {
      idle: {
        backgroundColor: '#6b7280',
        scale: 1,
        x: 0,
        transition: { duration: 0.3 }
      },
      loading: {
        backgroundColor: '#3b82f6',
        scale: 1.05,
        transition: { duration: 0.3 }
      },
      success: {
        backgroundColor: '#10b981',
        scale: 1.1,
        transition: { duration: 0.3 }
      },
      error: {
        backgroundColor: '#ef4444',
        scale: 1,
        x: [0, -10, 10, -10, 10, 0], // 抖动效果
        transition: {
          backgroundColor: { duration: 0.3 },
          x: { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
        }
      }
    };
    return baseVariants;
  };

  const getIconVariants = () => ({
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.2 }
    }
  });

  const spinnerAnimation = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear" as const
    }
  };

  const renderIcon = () => {
    switch (pingState) {
      case 'loading':
        return (
          <motion.div
            key="spinner"
            animate={spinnerAnimation}
            className="ping-spinner"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="32"
              />
            </svg>
          </motion.div>
        );
      case 'success':
        return (
          <motion.div
            key="checkmark"
            variants={getIconVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="ping-icon"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            key="cross"
            variants={getIconVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="ping-icon"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.path
                d="M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            </svg>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getText = () => {
    switch (pingState) {
      case 'loading':
        return 'Pinging...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Failed!';
      default:
        return 'Ping';
    }
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.15, ease: "easeOut" as const }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" as const }
    }
  };

  return (
    <motion.button
      className={`animated-ping-button ${className}`}
      variants={getButtonVariants()}
      animate={pingState}
      onClick={handleClick}
      disabled={disabled || pingState === 'loading'}
      whileHover={pingState === 'idle' ? { scale: 1.05 } : {}}
      whileTap={pingState === 'idle' ? { scale: 0.95 } : {}}
    >
      <div className="button-content">
        <AnimatePresence mode="wait">
          {renderIcon()}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={getText()} // 使用文字内容作为key
            className="button-text"
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {getText()}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

export default AnimatedPingButton;
