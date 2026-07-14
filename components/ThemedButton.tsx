import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ActivityIndicator 
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  loading?: boolean;
}

export function ThemedButton({ 
  title, 
  variant = 'primary', 
  loading = false, 
  style, 
  disabled, 
  ...props 
}: ThemedButtonProps) {
  const colorScheme = useColorScheme();
  
  // Resolve colors based on theme mode and variant
  let backgroundColor = colors.primary.light;
  let textColor = '#FFFFFF';
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'primary') {
    backgroundColor = colorScheme === 'dark' ? colors.primary.dark : colors.primary.light;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    backgroundColor = colorScheme === 'dark' ? colors.secondary.dark : colors.secondary.light;
    textColor = '#FFFFFF';
  } else if (variant === 'accent') {
    backgroundColor = colorScheme === 'dark' ? colors.accent.dark : colors.accent.light;
    textColor = '#FFFFFF';
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    textColor = colorScheme === 'dark' ? colors.dark.text : colors.light.text;
    borderColor = colorScheme === 'dark' ? colors.dark.border : colors.light.border;
    borderWidth = 1;
  }

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor, 
          borderColor, 
          borderWidth,
          opacity: isDisabled ? 0.6 : 1 
        },
        style
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  text: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
  },
});
