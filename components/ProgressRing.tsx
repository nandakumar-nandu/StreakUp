import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming 
} from 'react-native-reanimated';
import { colors, spacing, typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

// Create an animated wrapper around the SVG Circle component.
// This allows Reanimated to update its props directly on the UI thread.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** Completion progress represented as a decimal between 0.0 and 1.0 */
  progress: number;
  /** Size (width/height) of the square SVG viewport canvas in density pixels */
  size?: number;
  /** Width of the ring stroke in density pixels */
  strokeWidth?: number;
  /** Accent color of the completed portion of the progress ring */
  activeColor?: string;
  /** Text description inside the circle (e.g. "3/5") */
  label?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  activeColor,
  label
}: ProgressRingProps) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  // Resolve active theme color if not specified
  const ringColor = activeColor || (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light);
  const trackColor = colorScheme === 'dark' ? '#222530' : '#E8ECEF';

  // Math equations for circular stroke dash arrays
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Initialize a shared value to hold the animated progress state.
  // Shared values are reactive variables that can be modified on the JS thread and read on the native UI thread.
  const animatedProgress = useSharedValue(0);

  // Sync the React component prop changes to the Reanimated shared value.
  // Whenever the parent updates the progress prop, we trigger a smooth timing animation.
  useEffect(() => {
    // withTiming() is a Reanimated function that updates a shared value over time 
    // using an easing curve (defaults to easing out).
    animatedProgress.value = withTiming(progress, { duration: 500 });
  }, [progress, animatedProgress]);

  // useAnimatedProps() is a Reanimated hook that creates a set of animated properties for native views.
  // These properties are updated on the UI thread directly without crossing the JS-Native bridge on every frame.
  const animatedCircleProps = useAnimatedProps(() => {
    // "worklet" is a directive that flags this JS function to compile into C++ 
    // and run asynchronously directly on the native device UI thread.
    'worklet';
    
    // Calculate how much of the stroke to offset.
    // An offset of 0 means the circle is 100% filled.
    // An offset of the full circumference means the circle is 100% empty.
    const strokeDashoffset = circumference * (1 - animatedProgress.value);

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground Animated Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          fill="transparent"
          // Rotate the circle by -90 degrees so the progress starts from the top (12 o'clock position)
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center Label Display */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: themeColors.text }]}>
            {label}
          </Text>
          <Text style={[styles.subText, { color: themeColors.textMuted }]}>
            done
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  subText: {
    fontSize: typography.sizes.caption,
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
export default ProgressRing;
