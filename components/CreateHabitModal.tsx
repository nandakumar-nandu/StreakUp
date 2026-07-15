import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Habit } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completions'>) => void;
}

const PRESET_EMOJIS = [
  '🏃', '🏋️', '🚴', '🧘', '💧', '🥗', '🍎', '😴', 
  '📚', '✍️', '🧠', '🎯', '💻', '🎨', '🎵', '💼', 
  '🧹', '🚿', '🪴', '🔑'
];

const PRESET_COLORS = [
  '#FF4757', // Coral Red
  '#2ED573', // Emerald Green
  '#1e90ff', // Electric Blue
  '#FFA502', // Sun Yellow/Orange
  '#9b59b6', // Amethyst Purple
  '#ff4785', // Rose Pink
  '#1abc9c', // Turquoise Teal
  '#34495e', // Slate Gray
];

const FREQUENCIES: ('daily' | 'weekdays' | 'weekends' | 'custom')[] = [
  'daily', 'weekdays', 'weekends', 'custom'
];

export function CreateHabitModal({ visible, onClose, onSave }: CreateHabitModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  // Form State
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(PRESET_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  
  // Custom Time Picker State
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('30');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

  const handleSave = () => {
    if (!name.trim()) return;
    
    const reminderTime = reminderEnabled ? `${hour}:${minute} ${amPm}` : null;
    
    onSave({
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      frequency,
      reminderTime,
    });
    
    // Reset Form
    setName('');
    setSelectedEmoji(PRESET_EMOJIS[0]);
    setSelectedColor(PRESET_COLORS[0]);
    setFrequency('daily');
    setReminderEnabled(false);
    setHour('08');
    setMinute('30');
    setAmPm('AM');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.overlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.title, { color: themeColors.text }]}>New Habit</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Name Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>HABIT NAME</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: themeColors.background, 
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }]}
                  placeholder="e.g., Drink Water"
                  placeholderTextColor={themeColors.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={40}
                />
              </View>

              {/* Emoji Grid */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>SELECT EMOJI</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        selectedEmoji === emoji && [styles.selectedEmojiButton, { borderColor: selectedColor }]
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Preset Picker */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>THEME ACCENT</Text>
                <View style={styles.colorRow}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorCircle
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Frequency Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>FREQUENCY</Text>
                <View style={[styles.frequencySegment, { backgroundColor: themeColors.background }]}>
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.freqButton,
                        frequency === freq && [styles.selectedFreqButton, { backgroundColor: selectedColor }]
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text style={[
                        styles.freqText,
                        { color: frequency === freq ? '#FFFFFF' : themeColors.textMuted }
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reminder Section */}
              <View style={[styles.section, styles.reminderRow]}>
                <View>
                  <Text style={[styles.sectionTitle, { color: themeColors.textMuted, marginBottom: 2 }]}>REMINDER TIME</Text>
                  <Text style={[styles.reminderSubText, { color: themeColors.textMuted }]}>Receive push notifications</Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: themeColors.border, true: selectedColor }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Custom Pure JS Time Picker */}
              {reminderEnabled && (
                <View style={[styles.timePickerContainer, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                  {/* Hours Selector */}
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeColumnLabel, { color: themeColors.textMuted }]}>Hour</Text>
                    <View style={styles.timeOptionRow}>
                      {['05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04'].map((h) => (
                        <TouchableOpacity 
                          key={h} 
                          style={[
                            styles.timeOption, 
                            hour === h && { backgroundColor: selectedColor }
                          ]}
                          onPress={() => setHour(h)}
                        >
                          <Text style={[styles.timeOptionText, { color: hour === h ? '#FFFFFF' : themeColors.text }]}>{h}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Minutes Selector */}
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeColumnLabel, { color: themeColors.textMuted }]}>Minute</Text>
                    <View style={styles.timeOptionRow}>
                      {['00', '15', '30', '45'].map((m) => (
                        <TouchableOpacity 
                          key={m} 
                          style={[
                            styles.timeOption, 
                            minute === m && { backgroundColor: selectedColor }
                          ]}
                          onPress={() => setMinute(m)}
                        >
                          <Text style={[styles.timeOptionText, { color: minute === m ? '#FFFFFF' : themeColors.text }]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* AM/PM Toggle */}
                  <View style={styles.amPmContainer}>
                    <TouchableOpacity 
                      style={[styles.amPmButton, amPm === 'AM' && { backgroundColor: selectedColor }]} 
                      onPress={() => setAmPm('AM')}
                    >
                      <Text style={[styles.amPmText, { color: amPm === 'AM' ? '#FFFFFF' : themeColors.text }]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.amPmButton, amPm === 'PM' && { backgroundColor: selectedColor }]} 
                      onPress={() => setAmPm('PM')}
                    >
                      <Text style={[styles.amPmText, { color: amPm === 'PM' ? '#FFFFFF' : themeColors.text }]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Actions Footer */}
            <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.cancelBtn, { borderColor: themeColors.border }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  styles.saveBtn, 
                  { backgroundColor: selectedColor, opacity: name.trim() ? 1 : 0.6 }
                ]} 
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.bodyLarge,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEmojiButton: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  emojiText: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorCircle: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  frequencySegment: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
  },
  freqButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  selectedFreqButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  freqText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'bold',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reminderSubText: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 2,
  },
  timePickerContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  timeColumn: {
    marginBottom: spacing.md,
  },
  timeColumnLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  timeOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'medium',
  },
  amPmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  amPmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amPmText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    marginRight: spacing.md,
    borderWidth: 1,
  },
  saveBtn: {},
  btnText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
  },
});
