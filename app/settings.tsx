import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [user, setUser] = useState({ fullName: 'User', email: 'user@example.com' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      console.log('📱 Loading all settings...');

      const userData = await AsyncStorage.getItem('user');
      console.log('👤 User data from storage:', userData);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 Set user to:', parsedUser);
      }

      const darkMode = await AsyncStorage.getItem('darkMode');
      const notifications = await AsyncStorage.getItem('notifications');
      const autoSaveGallery = await AsyncStorage.getItem('autoSave');

      console.log('🌙 Dark mode from storage:', darkMode);
      console.log('🔔 Notifications from storage:', notifications);
      console.log('📸 Auto save from storage:', autoSaveGallery);

      if (darkMode !== null) {
        const darkModeValue = JSON.parse(darkMode);
        setIsDarkMode(darkModeValue);
        console.log('🌙 Set dark mode to:', darkModeValue);
      }
      if (notifications !== null) {
        const notificationsValue = JSON.parse(notifications);
        setNotificationsEnabled(notificationsValue);
        console.log('🔔 Set notifications to:', notificationsValue);
      }
      if (autoSaveGallery !== null) {
        const autoSaveValue = JSON.parse(autoSaveGallery);
        setAutoSave(autoSaveValue);
        console.log('📸 Set auto save to:', autoSaveValue);
      }

      console.log('✅ All settings loaded successfully');
    } catch (error) {
      console.log('❌ Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      console.log(`💾 Saving ${key}:`, value);
      await AsyncStorage.setItem(key, JSON.stringify(value));
      console.log(`✅ Successfully saved ${key} to AsyncStorage`);
      return true;
    } catch (error) {
      console.log(`❌ Error saving ${key}:`, error);
      return false;
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    console.log('🌙 Dark mode toggle called with value:', value);
    setIsDarkMode(value);
    const saveSuccess = await saveSetting('darkMode', value);

    if (saveSuccess) {
      Alert.alert('Theme Changed', `Switched to ${value ? 'dark' : 'light'} mode`, [{ text: 'OK' }]);
    } else {
      Alert.alert('Error', 'Failed to save dark mode setting');
      setIsDarkMode(!value);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    console.log('🔔 Notifications toggle called with value:', value);
    setNotificationsEnabled(value);
    const saveSuccess = await saveSetting('notifications', value);

    if (saveSuccess) {
      if (value) {
        Alert.alert('Notifications Enabled', 'You will receive workout reminders and progress updates', [{ text: 'OK' }]);
      } else {
        Alert.alert('Notifications Disabled', 'You will no longer receive push notifications', [{ text: 'OK' }]);
      }
    } else {
      Alert.alert('Error', 'Failed to save notification setting');
      setNotificationsEnabled(!value);
    }
  };

  const handleAutoSaveToggle = async (value: boolean) => {
    console.log('📸 Auto save toggle called with value:', value);
    setAutoSave(value);
    const saveSuccess = await saveSetting('autoSave', value);

    if (saveSuccess) {
      Alert.alert('Auto Save Settings', value ? 'Progress photos will be saved to your gallery automatically' : 'Photos will only be saved in the app', [{ text: 'OK' }]);
    } else {
      Alert.alert('Error', 'Failed to save auto save setting');
      setAutoSave(!value);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout? This will clear all your data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚪 Logging out...');
            await AsyncStorage.multiRemove(['user', 'darkMode', 'notifications', 'autoSave']);
            console.log('🗑️ All data cleared from AsyncStorage');
            // router.replace('/(auth)');
          } catch (error) {
            console.log('❌ Error logging out:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
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

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );

  interface SettingsItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isLast?: boolean;
  }

  const SettingsItem = ({ icon, title, subtitle, onPress, rightElement, isLast = false }: SettingsItemProps) => (
    <TouchableOpacity
      style={[
        styles.settingsItem,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}> 
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingsItemTextContainer}>
          <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: colors.text, fontSize: 16 }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.userSection, { backgroundColor: colors.primary }]}> 
        <View style={styles.userContent}> 
          <View style={styles.avatar}> 
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userInfo}> 
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="ACCOUNT">
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
            isLast
          />
        </SettingsSection>

        <SettingsSection title="CAMERA & PHOTOS">
          <SettingsItem
            icon="images-outline"
            title="Auto Save to Gallery"
            subtitle={autoSave ? 'Photos saved to gallery' : 'Photos saved in app only'}
            rightElement={
              <Switch
                value={autoSave}
                onValueChange={(value) => {
                  console.log('📸 Auto save switch toggled to:', value);
                  handleAutoSaveToggle(value);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection title="APP SETTINGS">
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle={notificationsEnabled ? 'Workout reminders enabled' : 'All notifications disabled'}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  console.log('🔔 Notifications switch toggled to:', value);
                  handleNotificationsToggle(value);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
          />
          <SettingsItem
            icon={isDarkMode ? 'moon' : 'sunny'}
            title="Appearance"
            subtitle={isDarkMode ? 'Dark mode active' : 'Light mode active'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={(value) => {
                  console.log('🌙 Dark mode switch toggled to:', value);
                  handleDarkModeToggle(value);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
          />
          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Language settings coming soon!')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="SUPPORT">
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
            onPress={() => Alert.alert('About CaptureFit', 'AI-powered fitness progress tracking app')}
            isLast
          />
        </SettingsSection>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              console.log('🚪 Logout button pressed');
              handleLogout();
            }}
          >
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
  userSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  userContent: {
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
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    margin: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 60,
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
  settingsItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
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

