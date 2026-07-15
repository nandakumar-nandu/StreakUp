import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors } from '@/constants/theme';

interface AnimatedCheckboxProps {
  /** If true, the checkbox renders in the checked active state */
  checked: boolean;
  /** Triggered when the checkbox is pressed */
  onPress: () => void;
  /** Color of the background fill and outline when checked */
  activeColor: string;
  /** Dimensions (width & height) in density pixels */
  size?: number;
}

export function AnimatedCheckbox({
  checked,
  onPress,
  activeColor,
  size = 32
}: AnimatedCheckboxProps) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  // Initialize a shared value to track the animation's interpolation state.
  // 0.0 represents the unchecked/disabled visual state.
  // 1.0 represents the checked/fully-enabled visual state.
  const animationProgress = useSharedValue(0);

  // Synchronize state updates. Whenever the checked prop updates,
  // we trigger a spring-based animation to update the progress.
  useEffect(() => {
    // withSpring() executes a spring physics simulation on the UI thread.
    // It creates a bouncy, natural motion rather than a linear timeline.
    // damping: controls the speed of oscillation decay.
    // stiffness: controls the speed/force of the spring.
    animationProgress.value = withSpring(checked ? 1 : 0, {
      damping: 12,
      stiffness: 100
    });
  }, [checked, animationProgress]);

  // useAnimatedStyle() creates a dynamic style object that connects 
  // Reanimated shared values to native styling properties on the UI thread.
  const animatedBoxStyle = useAnimatedStyle(() => {
    // "worklet" tells the JS compiler that this code runs directly 
    // inside the native UI thread, guaranteeing 60/120fps styling changes.
    'worklet';

    // interpolateColor() maps a shared value between two ranges to colors.
    // Here, we transition the background color of the box from transparent (when 0)
    // to the active theme color (when 1).
    const backgroundColor = interpolateColor(
      animationProgress.value,
      [0, 1],
      ['transparent', activeColor]
    );

    // Transition the border color from standard theme borders to the active color.
    const borderColor = interpolateColor(
      animationProgress.value,
      [0, 1],
      [themeColors.border, activeColor]
    );

    // Apply a scale bounce effect to the entire checkbox container on toggle.
    // We scale up slightly when checking (using interpolation to hit a peak)
    // or keep it at normal scale when static.
    const scale = 1 + (animationProgress.value * 0.05);

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale }],
    };
  });

  // Animated style for the checkmark icon inside the checkbox.
  // The checkmark scales up from 0 to 1 with spring bounce.
  const animatedCheckStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: animationProgress.value }],
      opacity: animationProgress.value,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          styles.checkbox,
          { width: size, height: size, borderRadius: size / 2 },
          animatedBoxStyle
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedCheckbox;
