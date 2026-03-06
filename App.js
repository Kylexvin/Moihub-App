import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StatusBar, 
  Platform, 
  View, 
  Alert, 
  Modal, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Linking,
  AppState  
} from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons'; // ← CHANGED
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { CartProvider } from './context/CartContext';
import MainTabNavigator from './navigation/MainTabNavigator';
import FoodNavigator from './navigation/FoodNavigator';
import AccomStack from './screens/accom/AccomStack';
import RoommateStack from './navigation/RoommateStack';
import AuthStackNavigator from './navigation/AuthStackNavigator';
import SecondHandStack from './navigation/SecondHandStack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FoodProvider } from './context/FoodContext';
import { SocketProvider } from './context/SocketContext';
import MessageStackNavigator from './navigation/MessageStackNavigator';
import EshopNavigator from './navigation/EshopNavigator';
import LinkMeNavigator from './navigation/LinkMeNavigator';
import MySchoolNavigator from './navigation/MySchoolNavigator';
import BlogsNavigator from './navigation/BlogsNavigator'; 
import EshopOwnerNavigator from './navigation/EshopOwnerNavigator';
import EditProductScreen from './screens/eshop/dashboards/EditProductScreen';
import FoodVendorNavigator from './navigation/FoodVendorNavigator';
import EchemNavigator from './navigation/EchemNavigator';
import ServicesStackNavigator from './navigation/ServicesStackNavigator';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import OnboardingNavigator from './navigation/OnboardingNavigator';
import { handleNotificationNavigation } from './utils/notificationHandler';
import ServiceProviderDashboardNavigator from './navigation/ServiceProviderDashboardNavigator';

const isExpoGo = Constants?.appOwnership === 'expo';
const messaging = !isExpoGo ? require('@react-native-firebase/messaging').default : null;

const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

if (messaging) {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background FCM message:', remoteMessage);
  });
}

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#093028',
    card: '#093028',
    text: '#E0FFF5',
    border: 'transparent',
    notification: '#00C896',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: 'normal' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    light: { fontFamily: 'System', fontWeight: '300' },
    thin: { fontFamily: 'System', fontWeight: '100' },
  },
};

const PermissionModal = ({ visible, onAllow, onMaybeLater }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <FontAwesome name="bell" size={40} color="#00C896" />
            <Text style={styles.modalTitle}>Notifications Required</Text>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              MoiHub requires notification permissions to function properly:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Real-time messaging</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Order updates</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Security alerts</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={20} color="#00C896" style={styles.featureIcon} />
                <Text style={styles.featureText}>Community notifications</Text>
              </View>
            </View>
            
            <Text style={styles.modalNote}>
              You cannot use the app without enabling notifications. Please allow notifications to continue.
            </Text>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onAllow}
              activeOpacity={0.8}
            >
              <FontAwesome name="check" size={18} color="#093028" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onMaybeLater}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Exit App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const [appState, setAppState] = useState('splash');
  const [firstLaunch, setFirstLaunch] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        setShowPermissionModal(false);
        return true;
      } else {
        setPermissionGranted(false);
        setShowPermissionModal(true);
        return false;
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setPermissionGranted(false);
      setShowPermissionModal(true);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      
      if (status === 'granted') {
        setPermissionGranted(true);
        setShowPermissionModal(false);
        Alert.alert('Success', 'Notifications enabled!', [{ text: 'Continue' }]);
        return true;
      } else {
        Alert.alert(
          'Permission Required',
          'Notifications are required to use MoiHub. Please enable them in Settings to continue.',
          [
            { 
              text: 'Open Settings', 
              onPress: async () => {
                if (Platform.OS === 'ios') {
                  await Linking.openURL('app-settings:');
                } else {
                  await Notifications.getPermissionsAsync();
                }
              } 
            },
            { text: 'Try Again', onPress: () => requestNotificationPermission() },
            { text: 'Exit', style: 'destructive', onPress: exitApp }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission && appState !== 'splash') {
          setShowPermissionModal(true);
          if (navigationRef.isReady()) {
            navigationRef.navigate('Auth');
          }
        }
      }
    });
    return () => subscription.remove();
  }, [appState]);

  const exitApp = () => {
    if (Platform.OS === 'ios') {
      setShowPermissionModal(true);
      Alert.alert(
        'App Unavailable',
        'MoiHub requires notifications to function. Please enable them in Settings to continue.',
        [
          { text: 'Open Settings', onPress: async () => { await Linking.openURL('app-settings:'); } },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } else {
      const BackHandler = require('react-native').BackHandler;
      BackHandler.exitApp();
    }
  };

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.log('Error setting audio mode:', e);
      }
    };
    configureAudio();
  }, []);

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'MoiHub',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (navigationRef.isReady()) {
        handleNotificationNavigation(navigationRef, data);
      } else {
        const checkReady = setInterval(() => {
          if (navigationRef.isReady()) {
            clearInterval(checkReady);
            handleNotificationNavigation(navigationRef, data);
          }
        }, 100);
        setTimeout(() => clearInterval(checkReady), 5000);
      }
    });
    return () => unsubscribe.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground Local notification:', notification);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        setFirstLaunch(value === null);
      } catch (error) {
        setFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  const handleSplashComplete = async () => {
    if (firstLaunch === null) return;
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      setShowPermissionModal(true);
      return;
    }
    setAppState(firstLaunch ? 'onboarding' : 'main');
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('alreadyLaunched', 'true');
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
    }
    setAppState('main');
  };

  if (showPermissionModal) {
    return (
      <View style={styles.blockedContainer}>
        <PermissionModal
          visible={showPermissionModal}
          onAllow={requestNotificationPermission}
          onMaybeLater={exitApp}
        />
      </View>
    );
  }

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashComplete} />;
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <CartProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#093028' },
          animation: 'fade',
          presentation: 'card',
          gestureEnabled: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="SecondHandStack" component={SecondHandStack} />
            <Stack.Screen name="MessageStackNavigator" component={MessageStackNavigator} />
            <Stack.Screen name="FoodStack" component={FoodNavigator} />
            <Stack.Screen name="AccomStack" component={AccomStack} />
            <Stack.Screen name="RoommateStack" component={RoommateStack} />
            <Stack.Screen name='EshopNavigator' component={EshopNavigator} />
            <Stack.Screen name="LinkMe" component={LinkMeNavigator} />
            <Stack.Screen name="MySchoolNavigator" component={MySchoolNavigator} />
            <Stack.Screen name="BlogsNavigator" component={BlogsNavigator} />
            <Stack.Screen name="Eshop" component={EshopOwnerNavigator} />
            <Stack.Screen name="ServicesStack" component={ServicesStackNavigator} />
            <Stack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
            <Stack.Screen name="Echem" component={EchemNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="VendorDashboard" component={FoodVendorNavigator} />
            <Stack.Screen name="ServiceProviderDashboard" component={ServiceProviderDashboardNavigator} />
          </>    
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </CartProvider>
  );
}
       
export default function App() {
  axios.defaults.baseURL = 'https://moihub.onrender.com'; // ← FIXED: use production URL

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#093028', true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#093028' }}>
        <NavigationContainer ref={navigationRef} theme={MyTheme}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#093028"
            translucent={false}
            hidden={false}
          />
          <AuthProvider>
            <SocketProvider>
              <FoodProvider>
                <AppNavigator />
              </FoodProvider>
            </SocketProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1,
    backgroundColor: '#093028',
  },
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
    borderColor: '#FF6B6B',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});