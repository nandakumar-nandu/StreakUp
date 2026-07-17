import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Habit } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggleComplete: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function HabitCard({ habit, isCompletedToday, onToggleComplete, onDelete, onPress, onLongPress }: HabitCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  // Custom transparent tint of the habit's primary color for emoji background
  const emojiBgTint = `${habit.color}1C`; // ~11% opacity in Hex

  const handleDeletePress = () => {
    if (!onDelete) return;
    
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to permanently delete "${habit.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete }
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card, 
        { 
          backgroundColor: themeColors.card, 
          borderColor: isCompletedToday ? habit.color : themeColors.border 
        }
      ]}
    >
      {/* Accent Left Indicator */}
      <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />

      <View style={styles.contentRow}>
        {/* Emoji Circle */}
        <View style={[styles.emojiCircle, { backgroundColor: emojiBgTint }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>

        {/* Text Details */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
              {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
            </Text>
            {habit.reminderTime && (
              <>
                <Text style={[styles.separator, { color: themeColors.border }]}>•</Text>
                <View style={styles.reminderBadge}>
                  <Ionicons name="notifications-outline" size={12} color={themeColors.textMuted} />
                  <Text style={[styles.reminderText, { color: themeColors.textMuted }]}>
                    {habit.reminderTime}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Right Streak / Action Section */}
        <View style={styles.actionContainer}>
          {/* Streak Indicator */}
          {habit.streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {habit.streak}</Text>
            </View>
          )}
          
          {/* Complete Checkbox */}
          <TouchableOpacity
            style={[
              styles.checkButton,
              { 
                borderColor: habit.color,
                backgroundColor: isCompletedToday ? habit.color : 'transparent',
                marginRight: onDelete ? spacing.sm : 0
              }
            ]}
            onPress={onToggleComplete}
            activeOpacity={0.7}
          >
            {isCompletedToday ? (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            ) : (
              <View style={[styles.innerCircle, { borderColor: habit.color }]} />
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4757" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  colorIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.lg,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emojiText: {
    fontSize: 22,
  },
  detailsContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.sizes.bodySmall,
  },
  separator: {
    marginHorizontal: 6,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: typography.sizes.bodySmall,
    marginLeft: 3,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  streakText: {
    fontSize: typography.sizes.bodySmall,
    color: '#FF4757',
    fontWeight: 'bold',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 14,
    height: 14,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    opacity: 0.3,
  },
  deleteButton: {
    padding: 4,
  },
});
export default HabitCard;
