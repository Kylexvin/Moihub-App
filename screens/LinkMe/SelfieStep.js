import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

const SelfieStep = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const showImagePicker = () => {
    Alert.alert(
      'Select Selfie',
      'Choose how you want to add your selfie',
      [
        {
          text: '📸 Camera',
          onPress: () => openCamera(),
        },
        {
          text: '🖼️ Photo Library',
          onPress: () => openImageLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera access helps you take a verification selfie. This is required for Moi University verification.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'selfie.jpg',
          fileSize: asset.fileSize || 0,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Photo library access lets you select a verification selfie. This is required for Moi University verification.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'selfie.jpg',
          fileSize: asset.fileSize || 0,
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', 'Failed to open photo library. Please try again.');
    }
  };

  const validateImage = (image) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.fileSize > maxSize) {
      Alert.alert(
        'File Too Large',
        'Please select an image smaller than 5MB to ensure quick upload'
      );
      return false;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(image.type)) {
      Alert.alert(
        'Invalid File Type',
        'Please select a JPEG, JPG, or PNG image for best quality'
      );
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!selectedImage) {
      Alert.alert(
        'Selfie Required',
        '📸 Please take or select a verification selfie to continue.\n\nThis helps us verify you\'re a Moi University student.'
      );
      return;
    }

    if (!validateImage(selectedImage)) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('selfie', {
        uri: selectedImage.uri,
        type: selectedImage.type,
        name: selectedImage.fileName || 'selfie.jpg',
      });

      const response = await fetch(`${API_URL}/linkme/upload-selfie`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        navigation.navigate('ProfilePhotoStep');
      } else {
        Alert.alert(
          'Upload Failed',
          data.message || 'Failed to upload selfie. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error uploading selfie:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload selfie. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid = () => {
    return selectedImage !== null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Hearts */}
        <View style={styles.heartsContainer}>
          <Text style={[styles.floatingHeart, styles.heart1]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart2]}>💙</Text>
          <Text style={[styles.floatingHeart, styles.heart3]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart4]}>💙</Text>
        </View>

        {/* Glowing Orbs */}
        <View style={[styles.glowOrb, styles.orb1]} />
        <View style={[styles.glowOrb, styles.orb2]} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.stepContainer}>
              <Text style={styles.step}>Step 3 of 4</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%' }]} />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Verify Your Identity</Text>
            <Text style={styles.subtitle}>
              Take a verification selfie within Moi University premises
            </Text>

            {/* Moi University Notice */}
            <View style={styles.universityNotice}>
              <LinearGradient
                colors={['rgba(123, 32, 161, 0.2)', 'rgba(157, 78, 221, 0.1)']}
                style={styles.noticeGradient}
              >
                <View style={styles.noticeIconContainer}>
                  <Text style={styles.noticeIcon}>🎓</Text>
                </View>
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>Moi University Verification</Text>
                  <Text style={styles.noticeText}>
                    Selfie must be taken within university premises. This confirms you're a current student.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Security & Privacy Card */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
              </View>
              
              <View style={styles.privacyFeatures}>
                <View style={styles.privacyFeature}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>
                    <Text style={styles.featureBold}>Verification only</Text> - Never shared publicly
                  </Text>
                </View>
                
                <View style={styles.privacyFeature}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>
                    <Text style={styles.featureBold}>Screenshot protected</Text> - Can't be captured
                  </Text>
                </View>
                
                <View style={styles.privacyFeature}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>
                    <Text style={styles.featureBold}>Secure storage</Text> - Encrypted & confidential
                  </Text>
                </View>
              </View>

              <View style={styles.screenshotWarning}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  LinkMe screenshots are disabled for your security
                </Text>
              </View>
            </View>

            {/* Image Upload Section */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionLabel}>Upload Your Selfie</Text>
              
              <TouchableOpacity
                style={[
                  styles.imageContainer,
                  selectedImage && styles.imageContainerSelected
                ]}
                onPress={showImagePicker}
              >
                {selectedImage ? (
                  <>
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.overlayText}>Tap to change</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderIcon}>📸</Text>
                    <Text style={styles.placeholderTitle}>Add Your Selfie</Text>
                    <Text style={styles.placeholderSubtext}>
                      Tap to take a photo or choose from gallery
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {selectedImage && (
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={showImagePicker}
                >
                  <Text style={styles.changePhotoText}>⟲ Take Different Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Requirements with explanations */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>✅ Photo Requirements</Text>
              
              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>📍</Text>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementMain}>Moi University Location</Text>
                  <Text style={styles.requirementDetail}>
                    Must be taken on campus (library, hostels, classes, etc.)
                  </Text>
                </View>
              </View>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>👤</Text>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementMain}>Clear Face Visible</Text>
                  <Text style={styles.requirementDetail}>
                    No masks, sunglasses, or heavy filters
                  </Text>
                </View>
              </View>

              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>📱</Text>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementMain}>Good Quality</Text>
                  <Text style={styles.requirementDetail}>
                    Well-lit, clear image under 5MB
                  </Text>
                </View>
              </View>
            </View>

            {/* Why we need this */}
            <View style={styles.whyContainer}>
              <Text style={styles.whyTitle}>Why verification is required:</Text>
              <Text style={styles.whyText}>
                • Confirms you're a current Moi University student{'\n'}
                • Prevents fake profiles and bots{'\n'}
                • Creates a safer community for everyone{'\n'}
                • Helps find genuine campus connections
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid() && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={loading || !isFormValid()}
          >
            <LinearGradient
              colors={
                isFormValid()
                  ? ['#7b20a1', '#9d4edd', '#c77dff']
                  : ['#333', '#555', '#666']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>Uploading securely...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>
                    {isFormValid() ? 'Continue →' : 'Add Selfie to Continue'}
                  </Text>
                  {!isFormValid() && (
                    <Text style={styles.buttonHelper}>
                      Verification required for Moi University students
                    </Text>
                  )}
                </>
              )}
              {isFormValid() && <View style={styles.buttonGlow} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.2,
  },
  heart1: {
    top: '15%',
    left: '15%',
    transform: [{ rotate: '15deg' }],
  },
  heart2: {
    top: '30%',
    right: '10%',
    transform: [{ rotate: '-10deg' }],
  },
  heart3: {
    top: '70%',
    left: '10%',
    transform: [{ rotate: '25deg' }],
  },
  heart4: {
    top: '85%',
    right: '20%',
    transform: [{ rotate: '-15deg' }],
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.08,
  },
  orb1: {
    width: 100,
    height: 100,
    backgroundColor: '#7b20a1',
    top: '10%',
    right: '-15%',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  orb2: {
    width: 80,
    height: 80,
    backgroundColor: '#c77dff',
    bottom: '20%',
    left: '-10%',
    shadowColor: '#c77dff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#c77dff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContainer: {
    alignItems: 'flex-end',
  },
  step: {
    color: '#b19cd9',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7b20a1',
    borderRadius: 2,
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(123, 32, 161, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b19cd9',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  universityNotice: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
  },
  noticeGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  noticeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 32, 161, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noticeIcon: {
    fontSize: 20,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c77dff',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#b19cd9',
    lineHeight: 20,
  },
  privacyCard: {
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  privacyFeatures: {
    marginBottom: 12,
  },
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    color: '#4cd964',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  featureText: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
  },
  featureBold: {
    fontWeight: '700',
    color: '#c77dff',
  },
  screenshotWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    color: '#ffd700',
    fontSize: 13,
    flex: 1,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(123, 32, 161, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainerSelected: {
    borderColor: '#4cd964',
    borderWidth: 2,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 64,
    color: '#b19cd9',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  changePhotoButton: {
    marginTop: 15,
    padding: 10,
  },
  changePhotoText: {
    color: '#c77dff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  requirementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  requirementIcon: {
    fontSize: 20,
    width: 30,
    color: '#c77dff',
  },
  requirementContent: {
    flex: 1,
  },
  requirementMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  requirementDetail: {
    fontSize: 13,
    color: '#b19cd9',
  },
  whyContainer: {
    backgroundColor: 'rgba(123, 32, 161, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  whyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#c77dff',
    marginBottom: 8,
  },
  whyText: {
    fontSize: 13,
    color: '#b19cd9',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    zIndex: 2,
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueButtonDisabled: {
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  buttonHelper: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelfieStep;