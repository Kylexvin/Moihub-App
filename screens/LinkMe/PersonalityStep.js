import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

const INTEREST_OPTIONS = [
  'music', 'gym', 'books', 'movies', 'travel', 'cooking',
  'photography', 'art', 'sports', 'gaming', 'dancing',
  'hiking', 'technology', 'fashion', 'food', 'nature', 'coding', 'sherehe'
];

const PersonalityStep = ({ navigation }) => {
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    bio: '',
    interests: '',
  });
  const { token } = useAuth();

  // Validation states
  const [bioTouched, setBioTouched] = useState(false);
  const [interestsTouched, setInterestsTouched] = useState(false);

  // Animated values for validation feedback
  const [bioErrorAnim] = useState(new Animated.Value(0));
  const [interestsErrorAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    validateForm();
  }, [bio, selectedInterests]);

  const validateForm = () => {
    const errors = {
      bio: '',
      interests: '',
    };

    // Bio validation
    if (bioTouched) {
      if (!bio.trim()) {
        errors.bio = 'Bio is required';
      } else if (bio.trim().length < 10) {
        errors.bio = `Bio needs ${10 - bio.trim().length} more characters (minimum 10)`;
      }
    }

    // Interests validation
    if (interestsTouched) {
      if (selectedInterests.length < 3) {
        errors.interests = `Select ${3 - selectedInterests.length} more interest${3 - selectedInterests.length === 1 ? '' : 's'}`;
      }
    }

    setValidationErrors(errors);

    // Animate error messages
    if (errors.bio) {
      Animated.sequence([
        Animated.timing(bioErrorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bioErrorAnim, {
          toValue: 0,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (errors.interests) {
      Animated.sequence([
        Animated.timing(interestsErrorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(interestsErrorAnim, {
          toValue: 0,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      Alert.alert('Maximum Interests', 'You can select up to 5 interests only.');
    }
    
    if (!interestsTouched) {
      setInterestsTouched(true);
    }
  };

  const isFormValid = () => {
    return bio.trim().length >= 10 && selectedInterests.length >= 3;
  };

  const getProgressPercentage = () => {
    let percentage = 0;
    if (bio.trim().length >= 10) percentage += 50;
    if (selectedInterests.length >= 3) percentage += 50;
    return percentage;
  };

  const handleContinue = async () => {
    // Mark all fields as touched on submit attempt
    setBioTouched(true);
    setInterestsTouched(true);
    
    if (!isFormValid()) {
      // Show specific error messages
      const errorMessages = [];
      if (bio.trim().length < 10) {
        errorMessages.push(`• Bio needs at least 10 characters (current: ${bio.length})`);
      }
      if (selectedInterests.length < 3) {
        errorMessages.push(`• Select ${3 - selectedInterests.length} more interest${3 - selectedInterests.length === 1 ? '' : 's'}`);
      }
      
      Alert.alert(
        'Complete Your Profile',
        `Please fix the following:\n\n${errorMessages.join('\n')}`,
        [{ text: 'Got it' }]
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.patch(
        `${API_URL}/linkme/profile`,
        {
          bio: bio.trim(),
          interests: selectedInterests,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigation.navigate('SelfieStep');
      }
    } catch (error) {
      console.error('Error updating personality:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Failed to update your profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
              <Text style={styles.step}>Step 2 of 4</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {getProgressPercentage() === 100 ? 'Ready to continue!' : `${getProgressPercentage()}% complete`}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              Share what makes you unique and what you're passionate about
            </Text>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bio</Text>
                <Text style={[
                  styles.sectionStatus,
                  bio.trim().length >= 10 && styles.statusValid
                ]}>
                  {bio.trim().length >= 10 ? '✓' : 'Required'}
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.bioInput,
                    validationErrors.bio && bioTouched && styles.inputError
                  ]}
                  placeholder="Write a short bio about yourself..."
                  placeholderTextColor="#999"
                  value={bio}
                  onChangeText={setBio}
                  onFocus={() => setBioTouched(true)}
                  onBlur={() => setBioTouched(true)}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <View style={styles.inputGlow} />
              </View>
              
              {bioTouched && validationErrors.bio && (
                <Animated.View 
                  style={[
                    styles.errorMessage,
                    {
                      transform: [{
                        translateX: bioErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 5]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.errorText}>⚠️ {validationErrors.bio}</Text>
                </Animated.View>
              )}
              
              <View style={styles.charCountContainer}>
                <Text style={[
                  styles.charCount,
                  bio.length < 10 && styles.charCountWarning
                ]}>
                  {bio.length}/500 {bio.length < 10 && '(min. 10)'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Interests ({selectedInterests.length}/5)
                </Text>
                <Text style={[
                  styles.sectionStatus,
                  selectedInterests.length >= 3 && styles.statusValid
                ]}>
                  {selectedInterests.length >= 3 ? '✓' : `${selectedInterests.length}/3`}
                </Text>
              </View>
              
              <Text style={styles.sectionSubtitle}>
                Select at least 3 interests that describe you
              </Text>
              
              {interestsTouched && validationErrors.interests && (
                <Animated.View 
                  style={[
                    styles.errorMessage,
                    {
                      transform: [{
                        translateX: interestsErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 5]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.errorText}>⚠️ {validationErrors.interests}</Text>
                </Animated.View>
              )}
              
              <View style={styles.interestsGrid}>
                {INTEREST_OPTIONS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      selectedInterests.includes(interest) && styles.interestChipSelected
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <LinearGradient
                      colors={
                        selectedInterests.includes(interest)
                          ? ['#7b20a1', '#9d4edd', '#c77dff']
                          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.optionGradient}
                    >
                      <Text
                        style={[
                          styles.interestText,
                          selectedInterests.includes(interest) && styles.interestTextSelected
                        ]}
                      >
                        {interest}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedInterests.length < 5 && (
                <Text style={styles.interestsHelper}>
                  {5 - selectedInterests.length} interest{5 - selectedInterests.length === 1 ? '' : 's'} remaining
                </Text>
              )}
            </View>

            {/* Quick tips section */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>✨ Quick Tips</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Write about your passions, hobbies, and what makes you unique</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Choose interests that reflect your personality</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>More specific interests help find better matches</Text>
              </View>
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
            disabled={loading}
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
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>
                    {isFormValid() ? 'Continue →' : 'Complete Required Fields'}
                  </Text>
                  {!isFormValid() && (
                    <Text style={styles.buttonHelper}>
                      {bio.trim().length < 10 && selectedInterests.length < 3 
                        ? 'Bio & interests needed'
                        : bio.trim().length < 10 
                        ? 'Bio too short' 
                        : 'Select more interests'}
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
    marginBottom: 4,
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
  progressText: {
    color: '#b19cd9',
    fontSize: 12,
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
    marginBottom: 12,
    textShadowColor: 'rgba(123, 32, 161, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(123, 32, 161, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  sectionStatus: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  statusValid: {
    color: '#4cd964',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#b19cd9',
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  bioInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
  },
  inputGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    borderRadius: 15,
    zIndex: -1,
  },
  charCountContainer: {
    marginTop: 6,
  },
  charCount: {
    color: '#b19cd9',
    fontSize: 14,
    textAlign: 'right',
  },
  charCountWarning: {
    color: '#ff9f43',
  },
  errorMessage: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '500',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  interestChip: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 80,
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  interestChipSelected: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  optionGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  interestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  interestTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  interestsHelper: {
    color: '#b19cd9',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    borderRadius: 15,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
  },
  tipsTitle: {
    color: '#c77dff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    color: '#9d4edd',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  tipText: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
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
});

export default PersonalityStep;