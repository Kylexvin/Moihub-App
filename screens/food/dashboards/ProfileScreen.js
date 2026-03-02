import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import theme from '../../theme/Theme';

const baseURL = Platform.OS === 'ios'
  ? 'http://localhost:5000'
  : 'https://moihub.onrender.com';

const VendorProfileScreen = () => {
  const [vendor, setVendor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    phone: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/food/vendors/profile`);
      const data = res.data.vendor;
      setVendor(data);
      setForm({
        shopName: data.shopName || '',
        phone: data.phone || '',
        location: data.location || '',
        description: data.description || ''
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.shopName.trim() || !form.phone.trim()) {
      return Alert.alert('Validation', 'Shop name and phone are required');
    }

    setSaving(true);
    try {
      const res = await axios.put(`${baseURL}/api/food/vendors/profile`, form);
      setVendor(res.data.vendor);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Save profile error:', err);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      shopName: vendor?.shopName || '',
      phone: vendor?.phone || '',
      location: vendor?.location || '',
      description: vendor?.description || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Avatar */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={[theme.Colors.primary, theme.Colors.primaryDark]}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>
                {form.shopName ? form.shopName.charAt(0).toUpperCase() : 'S'}
              </Text>
            </LinearGradient>
            <Text style={styles.headerTitle}>Vendor Profile</Text>
            {!editing && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: vendor?.isActive ? theme.Colors.success : theme.Colors.danger }]} />
                <Text style={styles.statusText}>
                  {vendor?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            )}
          </View>

          {/* Profile Card */}
          <LinearGradient
            colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
            style={styles.profileCard}
          >
            {/* Shop Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="storefront" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Shop Name</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  value={form.shopName}
                  onChangeText={(text) => handleChange('shopName', text)}
                  placeholder="Enter shop name"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Phone Number</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Location</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  value={form.location}
                  onChangeText={(text) => handleChange('location', text)}
                  placeholder="Enter location"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="information-circle" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Description</Text>
              </View>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, styles.textArea, !editing && styles.disabledInputText]}
                  multiline
                  numberOfLines={4}
                  editable={editing}
                  value={form.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Tell customers about your business"
                  placeholderTextColor={theme.Colors.textTertiary}
                  textAlignVertical="top"
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} style={styles.textAreaLock} />
                )}
              </View>
            </View>

            {/* Stats Section */}
            {!editing && vendor && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={16} color={theme.Colors.primary} />
                  <Text style={styles.statLabel}>Member since</Text>
                  <Text style={styles.statValue}>
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color={theme.Colors.primary} />
                  <Text style={styles.statLabel}>Last updated</Text>
                  <Text style={styles.statValue}>
                    {vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                    style={styles.saveButtonGradient}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={theme.Colors.black} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={theme.Colors.black} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <LinearGradient
                  colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create" size={18} color={theme.Colors.black} />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Note */}
          {!editing && (
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={14} color={theme.Colors.textSecondary} />
              <Text style={styles.infoNoteText}>
                Tap Edit Profile to update your information
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
    ...theme.Shadows.medium,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.Colors.black,
  },
  headerTitle: {
    ...theme.Typography.h2,
    marginBottom: theme.Spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  profileCard: {
    ...theme.Components.card,
    padding: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.xs,
  },
  label: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
    paddingHorizontal: theme.Spacing.md,
  },
  disabledInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    ...theme.Typography.body,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.text,
  },
  disabledInputText: {
    color: theme.Colors.textSecondary,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaLock: {
    position: 'absolute',
    top: theme.Spacing.md,
    right: theme.Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: theme.Spacing.md,
    paddingTop: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.Colors.cardBorder,
  },
  statLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  statValue: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.text,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  editButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  editButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
  },
  cancelButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  saveButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.xs,
  },
  infoNoteText: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
});

export default VendorProfileScreen;