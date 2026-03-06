// screens/localservices/dashboard/BusinessProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BusinessProfile = ({ navigation: navProp }) => {
  const navHook = useNavigation();
  const navigation = navProp || navHook;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageType, setImageType] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    location: '',
  });

  const [hoursData, setHoursData] = useState({
    monday: { open: '08:00', close: '17:00' },
    tuesday: { open: '08:00', close: '17:00' },
    wednesday: { open: '08:00', close: '17:00' },
    thursday: { open: '08:00', close: '17:00' },
    friday: { open: '08:00', close: '17:00' },
    saturday: { open: '09:00', close: '14:00' },
    sunday: { open: '', close: '' },
  });

  const [socialData, setSocialData] = useState({
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
  });

  const [locationData, setLocationData] = useState({
    latitude: 0,
    longitude: 0,
    address: '',
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const socialPlatforms = [
    { key: 'website', label: 'Website', icon: 'globe', color: Colors.primary },
    { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
    { key: 'twitter', label: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
    { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  ];

  useEffect(() => {
    fetchProfile();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to set your business location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/dashboard/profile');
      setProfileData(response.data);
      
      if (response.data) {
        setFormData({
          businessName: response.data.businessName || '',
          description: response.data.description || '',
          location: response.data.location || '',
        });

        if (response.data.operatingHours) {
          setHoursData(response.data.operatingHours);
        }

        if (response.data.socialLinks) {
          setSocialData(response.data.socialLinks);
        }

        if (response.data.coordinates) {
          setLocationData({
            latitude: response.data.coordinates.latitude || 0,
            longitude: response.data.coordinates.longitude || 0,
            address: response.data.coordinates.address || '',
          });
        }
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const success = await uploadImage(result.assets[0]);
        if (success) {
          setShowImagePicker(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permissions are required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: imageType === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const success = await uploadImage(result.assets[0]);
        if (success) {
          setShowImagePicker(false);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploadingImage(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const formData = new FormData();
      
      const filename = imageAsset.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri,
        name: filename || `${imageType}-image.jpg`,
        type: type,
      });

      const endpoint = imageType === 'profile' 
        ? '/api/services/dashboard/profile/profile-image'
        : '/api/services/dashboard/profile/cover-image';

      const response = await axios.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', response.data.message || 'Image updated successfully');
        
        if (imageType === 'profile') {
          setProfileData(prev => ({ ...prev, profileImage: response.data.profileImage }));
        } else {
          setProfileData(prev => ({ ...prev, coverImage: response.data.coverImage }));
        }
        
        return true;
      }
    } catch (error) {
      console.error('Upload image error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to upload image';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await axios.put('/api/services/dashboard/profile', {
        businessName: formData.businessName.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
      });

      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Profile updated successfully');
        fetchProfile();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await axios.put('/api/services/dashboard/profile', {
        operatingHours: hoursData,
      });

      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Operating hours updated successfully');
        fetchProfile();
        setShowHoursModal(false);
      }
    } catch (error) {
      console.error('Save hours error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await axios.put('/api/services/dashboard/profile', {
        socialLinks: socialData,
      });

      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Social links updated successfully');
        fetchProfile();
        setShowSocialModal(false);
      }
    } catch (error) {
      console.error('Save social error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await axios.put('/api/services/dashboard/profile/location', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Location updated successfully');
        fetchProfile();
        setShowLocationModal(false);
      }
    } catch (error) {
      console.error('Save location error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setLocationData(prev => ({
        ...prev,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
    }
  };

  const toggleDayClosed = (day) => {
    setHoursData(prev => ({
      ...prev,
      [day]: {
        open: hoursData[day].open ? '' : '08:00',
        close: hoursData[day].close ? '' : '17:00',
      },
    }));
  };

  const isDayClosed = (day) => {
    return !hoursData[day].open && !hoursData[day].close;
  };

  const openLocationInMaps = () => {
    if (!locationData.address && locationData.latitude === 0 && locationData.longitude === 0) {
      Alert.alert('No Location', 'Please add a location first');
      return;
    }

    let mapUrl = '';
    const address = locationData.address || '';
    
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      if (Platform.OS === 'ios') {
        mapUrl = `http://maps.apple.com/?q=${encodedAddress}`;
      } else {
        mapUrl = `https://maps.google.com/?q=${encodedAddress}`;
      }
    } else if (locationData.latitude !== 0 || locationData.longitude !== 0) {
      if (Platform.OS === 'ios') {
        mapUrl = `http://maps.apple.com/?ll=${locationData.latitude},${locationData.longitude}`;
      } else {
        mapUrl = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
      }
    }

    if (mapUrl) {
      Linking.openURL(mapUrl).catch((err) => {
        console.log('Failed to open maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCoverImage = () => (
    <View style={styles.coverImageContainer}>
      {profileData?.coverImage ? (
        <Image 
          source={{ uri: profileData.coverImage }} 
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.coverImage, styles.noCoverImage]}>
          <Ionicons name="image" size={48} color={Colors.textSecondary} />
          <Text style={styles.noImageText}>Add Cover Photo</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.editCoverButton}
        onPress={() => {
          setImageType('cover');
          setShowImagePicker(true);
        }}
        disabled={uploadingImage}
      >
        {uploadingImage && imageType === 'cover' ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Ionicons name="camera" size={20} color={Colors.white} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProfileImage = () => (
    <View style={styles.profileImageContainer}>
      <View style={styles.profileImageWrapper}>
        {profileData?.profileImage ? (
          <Image 
            source={{ uri: profileData.profileImage }} 
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.profileImage, styles.noProfileImage]}>
            <Ionicons name="business" size={48} color={Colors.textSecondary} />
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => {
            setImageType('profile');
            setShowImagePicker(true);
          }}
          disabled={uploadingImage}
        >
          {uploadingImage && imageType === 'profile' ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="camera" size={16} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.businessNameContainer}>
          <Text style={styles.businessName} numberOfLines={2}>
            {profileData?.businessName || 'Your Business Name'}
          </Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.businessDescription}>
          {profileData?.description || 'Add a description about your business'}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.reviewsButton}
        onPress={() => navigation.navigate('ReviewsManagement')}
        activeOpacity={0.7}
      >
        <View style={styles.reviewsButtonContent}>
          <View style={styles.reviewsButtonLeft}>
            <Ionicons name="star" size={24} color={Colors.warning} />
            <View>
              <Text style={styles.reviewsButtonTitle}>Manage Reviews</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={24} color={Colors.primary} />
        </View>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        <TouchableOpacity 
          style={styles.sectionContent}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={styles.locationText} numberOfLines={2}>
            {profileData?.location || 'Add your business location'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Operating Hours</Text>
        </View>
        <TouchableOpacity 
          style={styles.sectionContent}
          onPress={() => setShowHoursModal(true)}
        >
          <View>
            {Object.entries(profileData?.operatingHours || {}).slice(0, 2).map(([day, hours]) => (
              <Text key={day} style={styles.hoursText}>
                {day.charAt(0).toUpperCase() + day.slice(1)}: {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Closed'}
              </Text>
            ))}
            {Object.keys(profileData?.operatingHours || {}).length > 2 && (
              <Text style={styles.moreText}>+{Object.keys(profileData?.operatingHours || {}).length - 2} more days</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="share-social" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Social Links</Text>
        </View>
        <TouchableOpacity 
          style={styles.sectionContent}
          onPress={() => setShowSocialModal(true)}
        >
          <View style={styles.socialIcons}>
            {socialPlatforms.map(platform => (
              profileData?.socialLinks?.[platform.key] ? (
                <View key={platform.key} style={styles.socialIcon}>
                  <Ionicons name={platform.icon} size={20} color={platform.color} />
                </View>
              ) : null
            ))}
            {Object.values(profileData?.socialLinks || {}).filter(Boolean).length === 0 && (
              <Text style={styles.noSocialText}>Add social media links</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="images" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Gallery</Text>
        </View>
        <View style={styles.gallerySection}>
          {profileData?.gallery && profileData.gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profileData.gallery.slice(0, 5).map((image, index) => (
                <Image 
                  key={index}
                  source={{ uri: image }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
              {profileData.gallery.length > 5 && (
                <View style={styles.moreImages}>
                  <Text style={styles.moreImagesText}>
                    +{profileData.gallery.length - 5}
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <Text style={styles.noGalleryText}>No gallery images yet</Text>
          )}
        </View>
      </View>
    </View>
  );

const renderEditModal = () => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={showEditModal}
    onRequestClose={() => setShowEditModal(false)}
  >
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Edit Business Info</Text>

        {/* Read-only name section */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Business Name</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {profileData?.businessName || 'Your Business Name'}
            </Text>
            <View style={styles.readOnlyBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.readOnlyBadgeText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.readOnlyHint}>
            Business name is set by admin and cannot be changed here.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your business..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Business address"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowEditModal(false)}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

  const renderHoursModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showHoursModal}
      onRequestClose={() => setShowHoursModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Operating Hours</Text>
          
          {daysOfWeek.map((day) => (
            <View key={day.key} style={styles.hoursRow}>
              <View style={styles.dayContainer}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <TouchableOpacity onPress={() => toggleDayClosed(day.key)}>
                  <Text style={styles.closedToggle}>
                    {isDayClosed(day.key) ? 'Closed' : 'Open'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {!isDayClosed(day.key) && (
                <View style={styles.timeInputs}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Open</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={hoursData[day.key].open}
                      onChangeText={(text) => setHoursData(prev => ({
                        ...prev,
                        [day.key]: { ...prev[day.key], open: text }
                      }))}
                      placeholder="09:00"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                  
                  <Text style={styles.timeSeparator}>-</Text>
                  
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Close</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={hoursData[day.key].close}
                      onChangeText={(text) => setHoursData(prev => ({
                        ...prev,
                        [day.key]: { ...prev[day.key], close: text }
                      }))}
                      placeholder="17:00"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowHoursModal(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveHours}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Hours</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderSocialModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSocialModal}
      onRequestClose={() => setShowSocialModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Social Media Links</Text>
          
          {socialPlatforms.map((platform) => (
            <View key={platform.key} style={styles.socialInputGroup}>
              <View style={styles.socialInputHeader}>
                <Ionicons name={platform.icon} size={20} color={platform.color} />
                <Text style={styles.socialLabel}>{platform.label}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={socialData[platform.key]}
                onChangeText={(text) => setSocialData(prev => ({ ...prev, [platform.key]: text }))}
                placeholder={`Enter your ${platform.label} URL`}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSocialModal(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveSocial}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Links</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLocationModal}
      onRequestClose={() => setShowLocationModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Business Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={locationData.address}
              onChangeText={(text) => setLocationData(prev => ({ ...prev, address: text }))}
              placeholder="Enter your business address"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Coordinates</Text>
            <View style={styles.coordinateInputs}>
              <View style={styles.coordinateGroup}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={locationData.latitude.toString()}
                  onChangeText={(text) => setLocationData(prev => ({ 
                    ...prev, 
                    latitude: parseFloat(text) || 0 
                  }))}
                  placeholder="0.0"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.coordinateGroup}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={locationData.longitude.toString()}
                  onChangeText={(text) => setLocationData(prev => ({ 
                    ...prev, 
                    longitude: parseFloat(text) || 0 
                  }))}
                  placeholder="0.0"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            {currentLocation && (
              <TouchableOpacity 
                style={styles.useLocationButton}
                onPress={useCurrentLocation}
              >
                <Ionicons name="locate" size={16} color={Colors.primary} />
                <Text style={styles.useLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {(locationData.latitude !== 0 || locationData.longitude !== 0) && (
            <View style={styles.locationPreviewContainer}>
              <View style={styles.locationPreview}>
                <Ionicons name="location-sharp" size={48} color={Colors.primary} />
                <Text style={styles.locationPreviewText}>
                  Your Business Location
                </Text>
                <Text style={styles.locationCoordinates}>
                  {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </Text>
                {locationData.address && (
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {locationData.address}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.viewOnMapButton}
                onPress={openLocationInMaps}
              >
                <Ionicons name="map" size={18} color={Colors.text} />
                <Text style={styles.viewOnMapText}>View on Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowLocationModal(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveLocation}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderImagePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showImagePicker}
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerContainer}>
          <Text style={styles.imagePickerTitle}>
            Choose {imageType === 'profile' ? 'Profile' : 'Cover'} Image
          </Text>
          
          <View style={styles.imagePickerOptions}>
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={takePhoto}
              disabled={uploadingImage}
            >
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="camera" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="image" size={32} color={Colors.success} />
              </View>
              <Text style={styles.imagePickerOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.imagePickerCancel}
            onPress={() => setShowImagePicker(false)}
            disabled={uploadingImage}
          >
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderCoverImage()}
        {renderProfileImage()}
        {renderInfoCard()}
      </ScrollView>

      {renderEditModal()}
      {renderHoursModal()}
      {renderSocialModal()}
      {renderLocationModal()}
      {renderImagePickerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  reviewsButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    ...Shadows.medium,
  },
  reviewsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewsButtonTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  coverImageContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  noCoverImage: {
    backgroundColor: Colors.card + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  editCoverButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  profileImageContainer: {
    marginTop: -60,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileImageWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.background,
  },
  noProfileImage: {
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  infoCard: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  infoHeader: {
    marginBottom: Spacing.lg,
  },
  businessNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  businessName: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 28,
    flex: 1,
    marginRight: Spacing.sm,
  },
  editButton: {
    padding: Spacing.xs,
  },
  businessDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  readOnlyField: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: Colors.card,
  borderRadius: BorderRadius.md,
  padding: Spacing.md,
  borderWidth: 1,
  borderColor: Colors.cardBorder,
  opacity: 0.7,
},
readOnlyText: {
  ...Typography.body,
  color: Colors.textSecondary,
  flex: 1,
  fontWeight: '600',
},
readOnlyBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.primary + '20',
  paddingHorizontal: Spacing.sm,
  paddingVertical: 3,
  borderRadius: BorderRadius.sm,
  gap: 4,
},
readOnlyBadgeText: {
  fontSize: 11,
  color: Colors.primary,
  fontWeight: '600',
},
readOnlyHint: {
  ...Typography.caption,
  color: Colors.textSecondary,
  marginTop: Spacing.xs,
  fontStyle: 'italic',
},
  hoursText: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  moreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  socialIcons: {
    flexDirection: 'row',
    flex: 1,
  },
  socialIcon: {
    marginRight: Spacing.md,
  },
  noSocialText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  gallerySection: {
    paddingTop: Spacing.sm,
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  moreImages: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  noGalleryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    marginBottom: 70,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hoursRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  dayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  closedToggle: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timeInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  socialInputGroup: {
    marginBottom: Spacing.lg,
  },
  socialInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  socialLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  coordinateInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  coordinateGroup: {
    flex: 1,
  },
  coordinateLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  coordinateInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  useLocationText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  locationPreviewContainer: {
    marginTop: Spacing.md,
  },
  locationPreview: {
    height: 180,
    backgroundColor: Colors.card + '40',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  locationPreviewText: {
    marginTop: Spacing.sm,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  locationCoordinates: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.text,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  viewOnMapText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: 70,
  },
  imagePickerTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  imagePickerOptions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  imagePickerOption: {
    flex: 1,
    alignItems: 'center',
  },
  imagePickerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  imagePickerOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePickerCancel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default BusinessProfile;