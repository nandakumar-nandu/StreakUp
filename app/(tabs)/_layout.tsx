import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors } from '@/constants/theme';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const activeColor = colorScheme === 'dark' ? colors.primary.dark : colors.primary.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerStyle: {
          backgroundColor: themeColors.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          color: themeColors.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
          headerTitle: 'Today\'s Streak',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "flash" : "flash-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarLabel: 'Habits',
          headerTitle: 'Habit Tracker',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarLabel: 'Stats',
          headerTitle: 'Activity & Progress',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "bar-chart" : "bar-chart-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarLabel: 'Social',
          headerTitle: 'Social & Accountability',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
