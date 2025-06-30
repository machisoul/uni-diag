import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AnimatedSendButton.css';

export interface AnimatedSendButtonProps {
  onSend: () => Promise<{ success: boolean; message?: string }>; // 返回发送结果
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type SendState = 'idle' | 'loading' | 'success' | 'error';

const AnimatedSendButton: React.FC<AnimatedSendButtonProps> = ({
  onSend,
  disabled = false,
  className = '',
  children = '发送'
}) => {
  const [sendState, setSendState] = useState<SendState>('idle');

  const handleClick = useCallback(async () => {
    if (disabled || sendState === 'loading') return;

    setSendState('loading');

    try {
      const result = await onSend();

      if (result.success) {
        setSendState('success');
        // 2秒后恢复到idle状态
        setTimeout(() => setSendState('idle'), 2000);
      } else {
        setSendState('error');
        // 1.5秒后恢复到idle状态
        setTimeout(() => setSendState('idle'), 1500);
      }
    } catch (error) {
      setSendState('error');
      setTimeout(() => setSendState('idle'), 1500);
    }
  }, [onSend, disabled, sendState]);

  const getButtonVariants = () => {
    const baseVariants = {
      idle: {
        backgroundColor: '#3b82f6',
        scale: 1,
        x: 0,
        transition: { duration: 0.3 }
      },
      loading: {
        backgroundColor: '#6366f1',
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
    switch (sendState) {
      case 'loading':
        return (
          <motion.div
            key="spinner"
            animate={spinnerAnimation}
            className="send-spinner"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            key="success"
            variants={getIconVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="send-icon success"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            key="error"
            variants={getIconVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="send-icon error"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="send"
            variants={getIconVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="send-icon idle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        );
    }
  };

  const getText = () => {
    switch (sendState) {
      case 'loading':
        return '发送中...';
      case 'success':
        return '发送成功';
      case 'error':
        return '发送失败';
      default:
        return children;
    }
  };

  const getTextKey = () => {
    switch (sendState) {
      case 'loading':
        return 'loading';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.button
      className={`animated-send-button ${className}`}
      variants={getButtonVariants()}
      animate={sendState}
      onClick={handleClick}
      disabled={disabled || sendState === 'loading'}
      whileHover={sendState === 'idle' ? { scale: 1.05 } : {}}
      whileTap={sendState === 'idle' ? { scale: 0.95 } : {}}
    >
      <div className="button-content">
        <AnimatePresence mode="wait">
          {renderIcon()}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={getTextKey()} // 使用状态作为key
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

export default AnimatedSendButton;
