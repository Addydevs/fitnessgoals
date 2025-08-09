import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { theme, setTheme, isDarkMode, colors } = useTheme();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
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
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Account">
          <SettingsItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {}}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => {}}
          />
        </SettingsSection>

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
          <View style={styles.themeSection}>
            <Text style={[styles.themeTitle, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeOptions}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: theme === option.value ? colors.primary : colors.surface,
                      borderColor: colors.border
                    },
                  ]}
                  onPress={() => setTheme(option.value as any)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={theme === option.value ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: theme === option.value ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {}}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
        </SettingsSection>

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
  themeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
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
