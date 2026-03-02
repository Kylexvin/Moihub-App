import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');
const BACKEND_URL = 'https://moihub.onrender.com';

const RegisterScreen = ({ navigation }) => {
  const { register, socialLogin, loading } = useAuth(); 
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Notification Permission Function
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        setShowPermissionModal(false);
        Alert.alert(
          'Thank you!',
          'You\'ll receive important updates and notifications.',
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        setPermissionGranted(false);
        Alert.alert(
          'Notifications Disabled',
          'You can enable them later in Settings. Some features may be limited.',
          [{ text: 'OK', onPress: () => setShowPermissionModal(false) }]
        );
      }
      return status;
    } catch (error) {
      console.error('Permission error:', error);
      return 'undetermined';
    }
  };

// Google Auth Hook Configuration - Fixed for Register
const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
  androidClientId: '440940724570-5af9vrdpg9e6q81sb675pctvbgbpqhqm.apps.googleusercontent.com',
  webClientId: '440940724570-q2oimhoge0bre1curvl7h8glbnp6rbma.apps.googleusercontent.com',
  redirectUri: makeRedirectUri({
    scheme: 'com.kylexvin.moihub',
    path: 'oauth2redirect',
  }),
  prompt: 'select_account',
});

  useEffect(() => {
    // Check notification permission
    const checkPermissions = async () => {
      setIsCheckingPermission(true);
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
      } else {
        setTimeout(() => {
          setShowPermissionModal(true);
        }, 500);
      }
      setIsCheckingPermission(false);
    };

    checkPermissions();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Handle Google Auth Response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      
      if (id_token) {
        handleBackendSocialLogin('google', id_token);
      } else {
        setGoogleLoading(false);
        Alert.alert('Error', 'Google did not return credentials.');
      }
    } else if (googleResponse?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Google Error', 'Authentication failed.');
    }
  }, [googleResponse]);

  const handleBackendSocialLogin = async (provider, token = null) => {
    if (!permissionGranted) {
      setShowPermissionModal(true);
      return;
    }
    
    try {
      setGoogleLoading(true);
      
      // Use AuthContext's socialLogin which will make the API call and handle navigation
      await socialLogin(provider, token);
      
    } catch (err) {
      console.error('Social login error:', err);
      Alert.alert('Social Login Failed', err.message || 'Could not sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleBtnPress = () => {
    if (!permissionGranted) {
      setShowPermissionModal(true);
      return;
    }
    
    setGoogleLoading(true);
    googlePromptAsync().catch((err) => {
      setGoogleLoading(false);
      console.log('Google Prompt Error:', err);
    });
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '#666' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, text: 'Weak', color: '#FF6B6B' };
    if (strength <= 3) return { strength, text: 'Fair', color: '#FFB74D' };
    if (strength <= 4) return { strength, text: 'Good', color: '#81C784' };
    return { strength, text: 'Strong', color: '#00C896' };
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (formData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!permissionGranted) {
      setShowPermissionModal(true);
      return;
    }
    
    if (!validateForm()) return;
    try {
      setIsRedirecting(true);
      setFeedback('Creating your account...');
      await register(formData);
      setFeedback('Registration successful!');
    } catch (err) {
      setIsRedirecting(false);
      setFeedback('');
      Alert.alert('Registration Failed', err.message || 'Please try again');
    }
  };

  const openLegal = () => Linking.openURL('https://moihub-silk.vercel.app/learnmore');

  // Permission Modal
  const PermissionModal = () => (
    <Modal
      transparent={true}
      visible={showPermissionModal}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <View style={styles.modalHeader}>
            <Icon name="bell" size={40} color="#00C896" />
            <Text style={styles.modalTitle}>Stay in the Loop</Text>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              Notifications help you get the most out of MoiHub:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Real-time order updates</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Messages from your matches</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Safety alerts and reminders</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Exclusive offers and events</Text>
              </View>
            </View>
            
            <Text style={styles.modalNote}>
              You can always change these settings later in your phone's Settings app.
            </Text>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestNotificationPermission}
              activeOpacity={0.8}
            >
              <Icon name="check" size={18} color="#093028" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Allow Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setShowPermissionModal(false);
                Alert.alert(
                  'You can enable later',
                  'You can enable notifications anytime in Settings → MoiHub.',
                  [{ text: 'Continue', style: 'default' }]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  if (isCheckingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C896" />
        <Text style={styles.loadingText}>Getting ready...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PermissionModal />
      
      <View style={styles.glowCircle} />
      <View style={styles.glowCircle2} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <Image source={require('../assets/moihublogo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.subtitle}>Join our ecosystem</Text>

          {/* Social Login Buttons */}
          <View style={styles.socialSection}>
            {/* Google Button */}
            <TouchableOpacity 
              style={[
                styles.socialButton,
                styles.googleButton, 
                (!permissionGranted || googleLoading || !googleRequest) && styles.buttonDisabled
              ]} 
              onPress={handleGoogleBtnPress}
              disabled={!permissionGranted || googleLoading || !googleRequest}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#DB4437" />
              ) : (
                <>
                  <Icon name="google" size={24} color="#DB4437" style={styles.socialIcon} />
                  <Text style={styles.googleButtonText}>
                    {!permissionGranted ? 'Enable Notifications First' : 'Continue with Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR REGISTER WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#88A99B"
                value={formData.username}
                onChangeText={(v) => handleChange('username', v)}
                autoCapitalize="none"
                editable={permissionGranted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#88A99B"
                value={formData.email}
                onChangeText={(v) => handleChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={permissionGranted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor="#88A99B"
                  value={formData.password}
                  onChangeText={(v) => handleChange('password', v)}
                  secureTextEntry={!showPassword}
                  editable={permissionGranted}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => permissionGranted && setShowPassword(!showPassword)}
                  disabled={!permissionGranted}
                >
                  <Icon 
                    name={showPassword ? "eye" : "eye-slash"} 
                    size={20} 
                    color={permissionGranted ? "#88A99B" : "#0F5443"} 
                  />
                </TouchableOpacity>
              </View>
              {formData.password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <View 
                        key={bar} 
                        style={[
                          styles.strengthBar, 
                          bar <= getPasswordStrength(formData.password).strength && { 
                            backgroundColor: getPasswordStrength(formData.password).color 
                          }
                        ]} 
                      />
                    ))}
                  </View>
                  <Text style={[
                    styles.strengthText, 
                    { color: getPasswordStrength(formData.password).color }
                  ]}>
                    {getPasswordStrength(formData.password).text}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#88A99B"
                  value={formData.confirmPassword}
                  onChangeText={(v) => handleChange('confirmPassword', v)}
                  secureTextEntry={!showConfirmPassword}
                  editable={permissionGranted}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => permissionGranted && setShowConfirmPassword(!showConfirmPassword)}
                  disabled={!permissionGranted}
                >
                  <Icon 
                    name={showConfirmPassword ? "eye" : "eye-slash"} 
                    size={20} 
                    color={permissionGranted ? "#88A99B" : "#0F5443"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.termsContainer} 
              onPress={() => permissionGranted && setAgreedToTerms(!agreedToTerms)}
              disabled={!permissionGranted}
            >
              <View style={[
                styles.checkbox, 
                agreedToTerms && styles.checkboxChecked,
                !permissionGranted && styles.checkboxDisabled
              ]}>
                {agreedToTerms && <Icon name="check" size={14} color="#093028" />}
              </View>
              <Text style={[styles.termsText, !permissionGranted && styles.textDisabled]}>
                By agreeing, you accept our{' '}
                <Text 
                  style={[styles.termsLink, !permissionGranted && styles.textDisabled]} 
                  onPress={() => permissionGranted && openLegal()}
                >
                  Terms
                </Text>{' '}
                and{' '}
                <Text 
                  style={[styles.termsLink, !permissionGranted && styles.textDisabled]} 
                  onPress={() => permissionGranted && openLegal()}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.button, 
                (!permissionGranted || loading || isRedirecting) && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={!permissionGranted || loading || isRedirecting}
            >
              {loading || isRedirecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {!permissionGranted ? 'Enable Notifications to Continue' : 'REGISTER'}
                </Text>
              )}
            </TouchableOpacity>

            {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

            <View style={styles.loginContainer}>
              <Text style={[styles.loginPrompt, !permissionGranted && styles.textDisabled]}>
                Already have an account?
              </Text>
              <TouchableOpacity 
                onPress={() => permissionGranted && navigation.navigate('Login')}
                disabled={!permissionGranted}
              >
                <Text style={[styles.loginText, !permissionGranted && styles.textDisabled]}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#093028' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#093028',
  },
  loadingText: {
    color: '#88A99B',
    marginTop: 20,
    fontSize: 16,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  glowCircle: { 
    position: 'absolute', 
    width: width * 1.5, 
    height: width * 1.5, 
    borderRadius: width * 0.75, 
    backgroundColor: 'rgba(0, 255, 179, 0.08)', 
    top: -width * 0.75, 
    left: -width * 0.25 
  },
  glowCircle2: { 
    position: 'absolute', 
    width: width, 
    height: width, 
    borderRadius: width * 0.5, 
    backgroundColor: 'rgba(0, 255, 179, 0.05)', 
    bottom: -width * 0.3, 
    right: -width * 0.2 
  },
  contentContainer: { 
    width: '100%', 
    maxWidth: 400, 
    alignSelf: 'center', 
    marginTop: 60 
  },
  logo: { 
    width: 120, 
    height: 120, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#E0FFF5', 
    textAlign: 'center', 
    marginBottom: 8, 
    letterSpacing: 2 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#88A99B', 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  socialSection: { marginBottom: 20 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#fff',
  },
  socialIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#0F5443' },
  dividerText: { color: '#88A99B', paddingHorizontal: 15, fontSize: 12 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '500', color: '#E0FFF5' },
  input: { 
    borderWidth: 1, 
    borderColor: '#0F5443', 
    backgroundColor: 'rgba(15, 84, 67, 0.3)', 
    padding: 15, 
    borderRadius: 12, 
    fontSize: 16, 
    color: '#E0FFF5' 
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeIcon: { position: 'absolute', right: 15, top: 15, padding: 5 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, backgroundColor: '#0F5443', borderRadius: 2 },
  strengthText: { fontSize: 12, fontWeight: '600', minWidth: 50 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  checkbox: { 
    width: 20, 
    height: 20, 
    borderWidth: 2, 
    borderColor: '#0F5443', 
    borderRadius: 4, 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  checkboxChecked: { backgroundColor: '#00C896', borderColor: '#00C896' },
  checkboxDisabled: { borderColor: '#0F5443', opacity: 0.5 },
  termsText: { flex: 1, color: '#88A99B', fontSize: 13 },
  termsLink: { color: '#2DFFC3', textDecorationLine: 'underline' },
  button: { backgroundColor: '#00C896', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#00805F', opacity: 0.6 },
  buttonText: { color: '#093028', fontSize: 16, fontWeight: '700' },
  feedbackText: { color: '#2DFFC3', textAlign: 'center', marginTop: 15 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  loginPrompt: { color: '#88A99B' },
  loginText: { color: '#2DFFC3', fontWeight: '600' },
  textDisabled: { color: '#0F5443', opacity: 0.6 },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 40, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0A382D',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#00C896',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: 'rgba(0, 200, 150, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#0F5443',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#E0FFF5',
    marginTop: 15,
    textAlign: 'center',
  },
  modalBody: {
    padding: 25,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#88A99B',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureIcon: {
    marginRight: 15,
  },
  featureText: {
    color: '#E0FFF5',
    fontSize: 16,
    flex: 1,
  },
  modalNote: {
    color: '#88A99B',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: 'rgba(15, 84, 67, 0.3)',
    borderTopWidth: 1,
    borderTopColor: '#0F5443',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00C896',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#093028',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#88A99B',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#88A99B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;