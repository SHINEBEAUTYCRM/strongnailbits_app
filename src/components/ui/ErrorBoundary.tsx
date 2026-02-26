import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, fontSizes, spacing, borderRadius } from '@/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <AlertTriangle size={48} color={colors.amber} />
          <Text style={styles.title}>Щось пішло не так</Text>
          <Text style={styles.subtitle}>
            Сталася помилка. Спробуйте ще раз.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <RefreshCw size={18} color="#fff" />
            <Text style={styles.buttonText}>Спробувати ще</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.pearl,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: 'Unbounded-Medium',
    color: colors.dark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontFamily: 'Inter-Regular',
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontFamily: 'Inter-SemiBold',
  },
});
