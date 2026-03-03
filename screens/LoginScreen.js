import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const isExpoGo = Constants?.appOwnership === 'expo';
const messaging = !isExpoGo ? require('@react-native-firebase/messaging').default : null;
const { width } = Dimensions.get('window');
const BACKEND_URL = 'https://moihub.onrender.com';

const LoginScreen = ({ navigation }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  
  const { login, socialLogin, loading } = useAuth();
  
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
    const { access_token } = googleResponse.params;
    if (access_token) {
      handleSocialLogin('google', access_token);
    } else {
      setGoogleLoading(false);
      Alert.alert('Error', 'Google did not return credentials.');
    }
  } else if (googleResponse?.type === 'error') {
    setGoogleLoading(false);
    Alert.alert('Google Error', 'Authentication failed.');
  }
}, [googleResponse]);

const handleSocialLogin = async (provider, token = null) => {
  if (!permissionGranted) {
    setShowPermissionModal(true);
    return;
  }
  
  try {
    setGoogleLoading(true);
    setFeedback(`Authenticating with ${provider}...`);
    
    // Remove the fetch call and use socialLogin directly
    const user = await socialLogin(provider, token);
    
    if (user?._id) {
      await syncPushToken(user._id);
    }
    
  } catch (err) {
    setFeedback('');
    Alert.alert(`${provider} Login Failed`, err.message || `Could not sign in with ${provider}`);
  } finally {
    setGoogleLoading(false);
  }
};

  const syncPushToken = async (userId) => {
    if (!messaging) return;
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await axios.post(`${BACKEND_URL}/api/auth/update-push-token`, { userId, fcmToken });
      }
    } catch (err) {
      console.error('Failed to sync push token:', err);
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

  const handleLogin = async () => {
    if (!permissionGranted) {
      setShowPermissionModal(true);
      return;
    }
    
    if (!emailOrUsername || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsRedirecting(true);
      setFeedback('Logging in...');

      const user = await login(emailOrUsername, password);
      if (user?._id) {
        await syncPushToken(user._id);
      }

      setFeedback('Login successful!');
    } catch (err) {
      setIsRedirecting(false);
      setFeedback('');
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    }
  };

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
            <Text style={styles.modalTitle}>Stay Connected</Text>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              Enable notifications to get the most out of MoiHub:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Instant message alerts</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Order status updates</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Security and safety alerts</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Community announcements</Text>
              </View>
            </View>
            
            <Text style={styles.modalNote}>
              You can change notification settings anytime in your phone's Settings.
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
                  'Limited Experience',
                  'Some features may not work optimally without notifications.',
                  [{ text: 'Continue Anyway', style: 'default' }]
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
        <Animated.View 
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Image 
            source={require('../assets/moihublogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>MoiHub</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

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
            <Text style={styles.dividerText}>OR LOGIN WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Traditional Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                placeholderTextColor="#88A99B"
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                autoCapitalize="none"
                editable={permissionGranted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#88A99B"
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => permissionGranted && Linking.openURL('https://moihub-silk.vercel.app/forgot-password')}
              disabled={!permissionGranted}
            >
              <Text style={[styles.forgotPasswordText, !permissionGranted && styles.textDisabled]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, (!permissionGranted || loading || isRedirecting) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!permissionGranted || loading || isRedirecting}
            >
              {loading || isRedirecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {!permissionGranted ? 'Enable Notifications to Login' : 'LOGIN'}
                </Text>
              )}
            </TouchableOpacity>
            
            {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

            <View style={styles.registerContainer}>
              <Text style={[styles.registerPrompt, !permissionGranted && styles.textDisabled]}>
                Don't have an account?
              </Text>
              <TouchableOpacity 
                onPress={() => permissionGranted && navigation.navigate('Register')}
                disabled={!permissionGranted}
              >
                <Text style={[styles.registerText, !permissionGranted && styles.textDisabled]}> Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#093028',
  },
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(0, 255, 179, 0.08)',
    top: -width * 0.75,
    left: -width * 0.25,
  },
  glowCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: 'rgba(0, 255, 179, 0.05)',
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E0FFF5',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#88A99B',
    marginBottom: 30,
    textAlign: 'center',
  },
  socialSection: {
    marginBottom: 20,
  },
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#0F5443',
  },
  dividerText: {
    color: '#88A99B',
    paddingHorizontal: 15,
    fontSize: 12,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#E0FFF5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#0F5443',
    backgroundColor: 'rgba(15, 84, 67, 0.3)',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#E0FFF5',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2DFFC3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#00C896',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#093028',
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackText: {
    color: '#2DFFC3',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerPrompt: {
    color: '#88A99B',
    fontSize: 14,
  },
  registerText: {
    color: '#2DFFC3',
    fontWeight: '600',
    fontSize: 14,
  },
  textDisabled: {
    color: '#0F5443',
    opacity: 0.6,
  },
  
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

export default LoginScreen;