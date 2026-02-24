import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { colors, fontSizes, borderRadius, spacing, shadows } from '@/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (msg: string, toastType: ToastType = 'success') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(msg);
      setType(toastType);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      timeoutRef.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 3000);
    },
    [translateY]
  );

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} color="#fff" />,
    error: <XCircle size={20} color="#fff" />,
    info: <Info size={20} color="#fff" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: colors.green,
    error: colors.red,
    info: colors.violet,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Animated.View
        style={[
          styles.toast,
          shadows.md,
          {
            top: insets.top + spacing.sm,
            backgroundColor: bgColors[type],
            transform: [{ translateY }],
          },
        ]}
        pointerEvents="none"
      >
        {icons[type]}
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    zIndex: 9999,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: fontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
});
