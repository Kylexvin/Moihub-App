// screens/EmergencyServices.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const EmergencyServices = () => {
  const navigation = useNavigation();
  const [pressedId, setPressedId] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Emergency services with enhanced data
  const emergencyServices = [
    { 
      id: 'security',
      title: "Campus Security", 
      icon: "shield-checkmark", 
      color: "#e74c3c",
      description: "24/7 campus security patrol and emergency response",
      phoneNumber: "0116907378",
      location: "Main Gate",
      responseTime: "< 5 mins"
    },
    { 
      id: 'medical',
      title: "Health Emergency", 
      icon: "medical", 
      color: "#e74c3c",
      description: "University health center - medical emergencies",
      phoneNumber: "0710761679",
      location: "Health Center",
      responseTime: "< 10 mins"
    },
    { 
      id: 'report',
      title: "Report Incident", 
      icon: "warning", 
      color: "#e74c3c",
      description: "Report suspicious activities or incidents",
      phoneNumber: "0116907378",
      location: "Security Office",
      responseTime: "< 5 mins"
    },
    { 
      id: 'ambulance',
      title: "Ambulance Services", 
      icon: "fitness", 
      color: "#e74c3c",
      description: "Emergency medical transportation",
      phoneNumber: "0710761679",
      location: "Health Center",
      responseTime: "< 15 mins"
    },
    {
      id: 'fire',
      title: "Fire Emergency", 
      icon: "flame", 
      color: "#e74c3c",
      description: "Fire department & rescue services",
      phoneNumber: "999",
      location: "Campus Wide",
      responseTime: "< 10 mins"
    },
    {
      id: 'counseling',
      title: "Crisis Counseling", 
      icon: "heart", 
      color: "#e74c3c",
      description: "Mental health & emotional support",
      phoneNumber: "0710761679",
      location: "Counseling Center",
      responseTime: "24/7"
    }
  ];

  // Pulse animation for emergency banner
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // FIXED: Proper phone call handling
  const makePhoneCall = (phoneNumber) => {
    let phoneUrl;
    
    // Format phone number based on platform
    if (Platform.OS === 'android') {
      phoneUrl = `tel:${phoneNumber}`;
    } else {
      // For iOS, ensure proper formatting
      phoneUrl = `tel:${phoneNumber}`;
    }

    Linking.openURL(phoneUrl).catch((err) => {
      console.error('Phone call error:', err);
      // If phone call fails, offer to copy number
      Alert.alert(
        'Cannot Make Call',
        'Unable to open phone dialer. Would you like to copy the number instead?',
        [
          {
            text: 'Copy Number',
            onPress: () => copyToClipboard(phoneNumber)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    });
  };

  // FIXED: Check if phone is available
  const checkPhoneAvailability = async (phoneNumber, title) => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        // Phone dialer is available
        Alert.alert(
          `📞 Emergency Call`,
          `Call ${title} at ${phoneNumber}?`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            { 
              text: "Call Now", 
              onPress: () => makePhoneCall(phoneNumber)
            }
          ]
        );
      } else {
        // Phone dialer not available, offer copy
        Alert.alert(
          'Phone Dialer Unavailable',
          `Cannot open phone dialer. Copy ${phoneNumber} to clipboard?`,
          [
            {
              text: "Copy Number",
              onPress: () => copyToClipboard(phoneNumber)
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking phone support:', error);
      // If check fails, try to call directly
      makePhoneCall(phoneNumber);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (phoneNumber) => {
    try {
      await Clipboard.setStringAsync(phoneNumber);
      Alert.alert(
        '✅ Number Copied!',
        `Emergency number ${phoneNumber} has been copied to clipboard.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('❌ Error', 'Failed to copy number. Please try again.');
    }
  };

  // Handle call button press
  const handleCallPress = (phoneNumber, title) => {
    checkPhoneAvailability(phoneNumber, title);
  };

  // Handle long press to copy
  const handleLongPress = (phoneNumber, title) => {
    Alert.alert(
      `📋 Copy Number`,
      `Copy ${title}'s number (${phoneNumber}) to clipboard?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Copy", onPress: () => copyToClipboard(phoneNumber) }
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#0a0a0a', '#083028', '#0a0a0a']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Emergency Symbols */}
      <View style={styles.floatingSymbols}>
        <Animated.View style={[styles.symbol, styles.symbol1, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="alert-circle" size={24} color="rgba(231, 76, 60, 0.1)" />
        </Animated.View>
        <View style={[styles.symbol, styles.symbol2]}>
          <Ionicons name="medical" size={32} color="rgba(231, 76, 60, 0.1)" />
        </View>
        <View style={[styles.symbol, styles.symbol3]}>
          <Ionicons name="shield" size={28} color="rgba(231, 76, 60, 0.1)" />
        </View>
        <View style={[styles.symbol, styles.symbol4]}>
          <Ionicons name="flame" size={36} color="rgba(231, 76, 60, 0.1)" />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#50c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Emergency Banner */}
      <Animated.View style={[styles.emergencyBanner, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#e74c3c', '#c0392b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="warning" size={32} color="#fff" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>EMERGENCY ASSISTANCE</Text>
              <Text style={styles.bannerSubtitle}>24/7 Campus Safety & Support</Text>
            </View>
          </View>
          <View style={styles.bannerGlow} />
        </LinearGradient>
      </Animated.View>

      {/* Quick Info */}
      <View style={styles.quickInfoContainer}>
        <LinearGradient
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(80, 200, 120, 0.02)']}
          style={styles.quickInfoCard}
        >
          <Ionicons name="location" size={16} color="#50c878" />
          <Text style={styles.quickInfoText}>All emergency services on campus</Text>
        </LinearGradient>
        <View style={styles.quickInfoBadge}>
          <Ionicons name="flash" size={14} color="#50c878" />
          <Text style={styles.quickInfoBadgeText}>24/7</Text>
        </View>
      </View>

      {/* Services Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesGrid}>
          {emergencyServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                pressedId === service.id && styles.serviceCardPressed
              ]}
              onPress={() => handleCallPress(service.phoneNumber, service.title)}
              onLongPress={() => handleLongPress(service.phoneNumber, service.title)}
              onPressIn={() => setPressedId(service.id)}
              onPressOut={() => setPressedId(null)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(231, 76, 60, 0.15)', 'rgba(231, 76, 60, 0.05)']}
                style={styles.cardGradient}
              >
                {/* Pulse Effect Ring */}
                <View style={styles.pulseRing} />
                
                {/* Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon} size={32} color={service.color} />
                </View>

                {/* Service Info */}
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                  
                  {/* Meta Info */}
                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color="#888" />
                      <Text style={styles.metaText}>{service.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color="#888" />
                      <Text style={styles.metaText}>{service.responseTime}</Text>
                    </View>
                  </View>
                </View>

                {/* Phone Number & Actions */}
                <View style={styles.phoneSection}>
                  <TouchableOpacity 
                    style={styles.phoneNumberContainer}
                    onPress={() => copyToClipboard(service.phoneNumber)}
                  >
                    <Ionicons name="call-outline" size={14} color="#50c878" />
                    <Text style={styles.phoneNumber}>{service.phoneNumber}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(service.phoneNumber)}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                        style={styles.copyButtonGradient}
                      >
                        <Ionicons name="copy-outline" size={16} color="#888" />
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.callButton}
                      onPress={() => handleCallPress(service.phoneNumber, service.title)}
                    >
                      <LinearGradient
                        colors={['#e74c3c', '#c0392b']}
                        style={styles.callButtonGradient}
                      >
                        <Ionicons name="call" size={18} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Emergency Badge */}
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>24/7</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips Section */}
        <LinearGradient
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(80, 200, 120, 0.02)']}
          style={styles.safetyTipsContainer}
        >
          <Text style={styles.safetyTipsTitle}>🚨 Emergency Safety Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#50c878" />
              <Text style={styles.tipText}>Save these numbers to your contacts</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#50c878" />
              <Text style={styles.tipText}>Know your nearest emergency assembly point</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#50c878" />
              <Text style={styles.tipText}>Keep your phone charged and accessible</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#50c878" />
              <Text style={styles.tipText}>Share your location with trusted contacts</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Emergency Button */}
      <TouchableOpacity 
        style={styles.floatingEmergencyButton}
        onPress={() => handleCallPress('999', 'General Emergency')}
      >
        <LinearGradient
          colors={['#e74c3c', '#c0392b']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text style={styles.floatingButtonText}>SOS</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  floatingSymbols: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  symbol: {
    position: 'absolute',
    opacity: 0.5,
  },
  symbol1: {
    top: '10%',
    right: '5%',
  },
  symbol2: {
    bottom: '20%',
    left: '5%',
  },
  symbol3: {
    top: '30%',
    left: '10%',
  },
  symbol4: {
    bottom: '30%',
    right: '8%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  emergencyBanner: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerGradient: {
    padding: 16,
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  bannerGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-15deg' }],
  },
  quickInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  quickInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.2)',
    marginRight: 10,
  },
  quickInfoText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 6,
  },
  quickInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(80,200,120,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.3)',
  },
  quickInfoBadgeText: {
    color: '#50c878',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
    transform: [{ scale: 1 }],
  },
  serviceCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  serviceInfo: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  phoneSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#50c878',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  copyButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  copyButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
  },
  callButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  callButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  emergencyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  emergencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e74c3c',
  },
  safetyTipsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.2)',
  },
  safetyTipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
    flex: 1,
  },
  floatingEmergencyButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomPadding: {
    height: 80,
  },
});

export default EmergencyServices;