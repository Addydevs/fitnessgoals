import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [user, setUser] = useState({ fullName: 'John Doe', email: 'john@example.com' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load user data when component mounts
  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              router.replace('/(auth)');
            } catch (error) {
              console.log('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const colors = isDarkMode
    ? {
        primary: '#A855F7',
        primaryDark: '#7C3AED',
        background: '#111827',
        surface: '#1F2937',
        card: '#374151',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        textTertiary: '#9CA3AF',
        border: '#4B5563',
        error: '#EF4444',
      }
    : {
        primary: '#A855F7',
        primaryDark: '#7C3AED',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        card: '#FFFFFF',
        text: '#1F2937',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        border: '#E5E7EB',
        error: '#EF4444',
      };

  const SettingsSection = ({ title, children }) => (
    <View
      style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const SettingsItem = ({ icon, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <SettingsSection title="Account">
          <SettingsItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => Alert.alert('Change Password', 'Password change coming soon!')}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => Alert.alert('Privacy & Security', 'Privacy settings coming soon!')}
          />
        </SettingsSection>

        {/* Camera & Photos */}
        <SettingsSection title="Camera & Photos">
          <SettingsItem
            icon="images-outline"
            title="Auto Save to Gallery"
            subtitle="Save progress photos automatically"
            rightElement={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
          />
        </SettingsSection>

        {/* App Settings */}
        <SettingsSection title="App Settings">
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : colors.textTertiary}
              />
            }
          />

          <SettingsItem
            icon={isDarkMode ? 'moon' : 'sunny'}
            title="Dark Mode"
            subtitle={isDarkMode ? 'Dark' : 'Light'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? '#FFFFFF' : colors.textTertiary}
              />
            }
          />

          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Language settings coming soon!')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => Alert.alert('Help & Support', 'Support coming soon!')}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Terms coming soon!')}
          />
          <SettingsItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon!')}
          />
          <SettingsItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('About CaptureFit', 'Fitness progress tracking app')}
          />
        </SettingsSection>

        {/* Logout */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    margin: 16,
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});

