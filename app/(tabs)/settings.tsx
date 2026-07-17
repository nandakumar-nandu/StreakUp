import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Ionicons 
            name="settings-outline" 
            size={40} 
            color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} 
          />
          <View style={styles.titleContainer}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Settings</Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.textMuted }]}>Manage profile & synchronization</Text>
          </View>
        </View>

        {/* User Account Info */}
        {user ? (
          <View style={[styles.profileSection, { borderColor: themeColors.border }]}>
            <Text style={[styles.sectionHeader, { color: themeColors.textMuted }]}>SIGNED IN AS</Text>
            <Text style={[styles.displayName, { color: themeColors.text }]}>
              {user.displayName || 'No Name Set'}
            </Text>
            <Text style={[styles.email, { color: themeColors.textMuted }]}>
              {user.email}
            </Text>
          </View>
        ) : null}

        {/* Action Button Section */}
        {user ? (
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: colors.primary.light }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        ) : null}

        {/* Version Info */}
        <View style={[styles.badge, { backgroundColor: themeColors.border }]}>
          <Text style={[styles.badgeText, { color: themeColors.text }]}>
            ⚙️ Version 0.4.0 (Firebase Persistent)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  titleContainer: {
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  profileSection: {
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  displayName: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
  },
  email: {
    fontSize: typography.sizes.bodyMedium,
    marginTop: 2,
  },
  logoutBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  badge: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'semibold',
  },
});
