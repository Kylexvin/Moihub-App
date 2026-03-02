import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../theme/Theme';

const SettingsScreen = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/food/vendors/profile');
        setIsOpen(data.vendor.isOpen);
      } catch (error) {
        console.error('Failed to load vendor profile:', error);
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      await axios.patch('/api/food/vendors/availability/toggle', {
        isOpen: !isOpen
      });

      setIsOpen(prev => !prev);
      Alert.alert('✅ Success', `Your shop is now ${!isOpen ? 'open' : 'closed'} for business`);
    } catch (error) {
      console.error('Toggle failed:', error);
      Alert.alert('Error', 'Failed to toggle availability');
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Clear any stored tokens/session
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              // Navigate to Login/Auth screen
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your listings and data will be lost forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive', 
          onPress: deleteVendor 
        },
      ]
    );
  };

  const deleteVendor = async () => {
    setDeleting(true);
    try {
      await axios.delete('/api/food/vendors/profile');
      
      // Clear stored data after successful deletion
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      Alert.alert(
        'Account Deleted',
        'Your vendor account has been removed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Deletion failed:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color={theme.Colors.primary} />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your preferences</Text>
        </View>

        {/* Shop Status Card */}
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(80, 200, 120, 0.1)' }]}>
                <Ionicons name="storefront" size={20} color={theme.Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Shop Status</Text>
                <Text style={styles.cardSubtitle}>Control your shop availability</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? theme.Colors.success : theme.Colors.danger }]} />
              <View>
                <Text style={styles.settingLabel}>Shop is {isOpen ? 'Open' : 'Closed'}</Text>
                <Text style={styles.settingDescription}>
                  {isOpen 
                    ? 'Customers can place orders' 
                    : 'Customers cannot place orders'}
                </Text>
              </View>
            </View>
            {toggling ? (
              <ActivityIndicator size="small" color={theme.Colors.primary} />
            ) : (
              <Switch
                value={isOpen}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: theme.Colors.cardBorder, true: theme.Colors.primary }}
                thumbColor={theme.Colors.white}
                ios_backgroundColor={theme.Colors.cardBorder}
              />
            )}
          </View>
        </LinearGradient>

        {/* Account Actions Card */}
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <Ionicons name="person" size={20} color={theme.Colors.warning} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Account</Text>
                <Text style={styles.cardSubtitle}>Manage your account</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionButtonLeft}>
                <Ionicons name="log-out" size={20} color={theme.Colors.warning} />
                <Text style={styles.actionButtonText}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.Colors.textSecondary} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={confirmDelete}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(231, 76, 60, 0.1)', 'rgba(231, 76, 60, 0.05)']}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionButtonLeft}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.Colors.danger} />
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color={theme.Colors.danger} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Delete Vendor Account
                    </Text>
                  </>
                )}
              </View>
              {!deleting && (
                <Ionicons name="warning" size={20} color={theme.Colors.danger} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={14} color={theme.Colors.textSecondary} />
          <Text style={styles.infoText}>
            Deleting your account is permanent and cannot be reversed
          </Text>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...theme.Typography.body,
    marginTop: theme.Spacing.md,
  },
  scrollContent: {
    padding: theme.Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
  },
  headerTitle: {
    ...theme.Typography.h2,
    marginTop: theme.Spacing.sm,
  },
  headerSubtitle: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    marginTop: theme.Spacing.xs,
  },
  card: {
    ...theme.Components.card,
    marginBottom: theme.Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.cardBorder,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...theme.Typography.h3,
  },
  cardSubtitle: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.Spacing.lg,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
    flex: 1,
  },
  settingLabel: {
    ...theme.Typography.body,
    marginBottom: 2,
  },
  settingDescription: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actionButton: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.Spacing.lg,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  actionButtonText: {
    ...theme.Typography.body,
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: theme.Colors.cardBorder,
  },
  deleteButtonText: {
    color: theme.Colors.danger,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.xs,
    marginTop: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  infoText: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
  },
  versionText: {
    ...theme.Typography.caption,
    color: theme.Colors.textTertiary,
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
  },
});

export default SettingsScreen;