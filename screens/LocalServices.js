import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from './theme/Theme';
import localServicesDB from '../services/LocalServicesDatabase';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const Localservices = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  
  // ============== AI CHAT STATES ==============
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ============== HELPER FUNCTIONS (YOUR EXISTING CODE) ==============
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    const iconMap = {
      'matatu services': 'bus',
      'boda boda': 'bicycle',
      'motorbike services': 'bicycle',
      'tuktuk services': 'car',
      'transport': 'car',
      'electronic repairs': 'build',
      'laundry services': 'shirt',
      'photoshoot services': 'camera',
      'cyber café': 'desktop',
      'cyber cafe': 'desktop',
      'gas deliveries': 'flame',
      'gas deliveries services': 'flame',
      'saloonist': 'cut',
      'kinyozi': 'cut',
      'best kinyozi': 'cut',
      'food ': 'ice-cream',
      'poshomill': 'nutrition',
      'capentry services': 'construct',
      'mama fua': 'woman',
      'test': 'star',
    };
    return iconMap[name] || 'business';
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName.toLowerCase();
    const colorMap = {
      'matatu services': '#10B981',
      'boda boda': '#059669',
      'motorbike services': '#10B981',
      'transport': '#3B82F6',
      'tuktuk services': '#10B981',
      'cake': '#F59E0B',
      'poshomill': '#F59E0B',
      'gas deliveries': '#F59E0B',
      'electronic repairs': '#8B5CF6',
      'cyber café': '#8B5CF6',
      'cyber cafe': '#8B5CF6',
      'saloonist': '#EC4899',
      'best kinyozi': '#EC4899',
      'kinyozi': '#EC4899',
      'laundry services': '#06B6D4',
      'mama fua': '#06B6D4',
      'photoshoot services': '#EC4899',
      'capentry services': '#F59E0B',
      'test': '#8B5CF6',
    };
    return colorMap[name] || Colors.primary;
  };

  const initializeCategory = (category) => {
    if (!category) return null;
    const categoryName = category.name || '';
    const isPinned = category.isPinned || false;
    const icon = getCategoryIcon(categoryName);
    const color = getCategoryColor(categoryName);
    const bgColor = color + '20';

    return {
      _id: category.id || category._id,
      id: category.id || category._id,
      name: categoryName,
      description: category.description || '',
      icon,
      color,
      bgColor,
      isPinned,
      providerCount: category.providerCount || 0,
      allowDashboard: category.allowDashboard || false,
      allowBooking: category.allowBooking || false
    };
  };

  // ============== IMPROVED AI CHAT FUNCTIONS ==============
  
  const handleCallProvider = async (phoneNumber) => {
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot make calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  };

  const handleViewDetails = (providerId) => {
    setShowAIChatbot(false);
    navigation.navigate('ProviderDashboard', { providerId });
  };

  const handleBookNow = (providerId) => {
    setShowAIChatbot(false);
    navigation.navigate('BookingScreen', { providerId });
  };

  // IMPROVED: Single source of truth for AI search
  const callAISearch = async (queryText) => {
    if (!queryText.trim()) return;
    
    setIsSearching(true);
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { 
      type: 'user', 
      text: queryText 
    }]);
    
    try {
      // CALL YOUR ACTUAL BACKEND ENDPOINT
      const response = await axios.post('/api/services/ai-chat', { 
        query: queryText 
      });
      
      // Add bot response with REAL provider data
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: response.data.message,
        cards: response.data.cards || [],
        suggestions: response.data.suggestions || [],
        understood: response.data.understood
      }]);
      
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // FIXED: No dummy data - show helpful error message
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        suggestions: [
          'boda boda near gate',
          'best kinyozi',
          'mama fua',
          'matatu services'
        ],
        understood: null
      }]);
    }
    
    setIsSearching(false);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // IMPROVED: Suggestion tap - searches IMMEDIATELY
  const handleSuggestion = (suggestion) => {
    setAiQuery(''); // Clear first
    setAiQuery(suggestion); // Set new text
    callAISearch(suggestion); // Search immediately with the suggestion
  };

  // IMPROVED: Send button click
  const handleSendPress = () => {
    if (aiQuery.trim() && !isSearching) {
      const queryToSend = aiQuery;
      setAiQuery(''); // Clear input immediately
      callAISearch(queryToSend);
    }
  };

  // IMPROVED: Enter key on keyboard
  const handleSubmitEditing = () => {
    if (aiQuery.trim() && !isSearching) {
      const queryToSend = aiQuery;
      setAiQuery(''); // Clear input immediately
      callAISearch(queryToSend);
    }
  };


const openAIChat = () => {
  setShowAIChatbot(true);
  
  // Welcome message only on first open
  if (chatMessages.length === 0) {
    setChatMessages([{
      type: 'bot',
      text: '👋 Hi! I\'m your AI assistant for Moi University services.\n\nI can help you find:\n• Transport (boda boda, matatu, tuktuk)\n• Grooming services (kinyozi, saloons)\n• Laundry services\n• And much more!\n\nJust tell me what you need in natural language.',
      suggestions: [
        'boda boda near main gate',
        'best kinyozi in hostel',
        'cheap mama fua',
        'matatu to town now'
      ]
    }]);
  }
};


  // ============== RENDER PROVIDER CARD ==============

const renderProviderCard = (card) => {
  // Determine badge color based on match score
  const getBadgeColor = () => {
    if (card.matchScore >= 85) return '#10B981'; // Green - Best Match
    if (card.matchScore >= 70) return '#3B82F6'; // Blue - Great Match
    if (card.matchScore >= 55) return '#F59E0B'; // Orange - Good Option
    return '#6B7280'; // Gray
  };

  return (
    <View key={card.providerId} style={styles.providerCard}>
      {/* Header with Name and Badge */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardCategory}>{card.category}</Text>
        </View>
        {card.badge && (
          <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
            <Text style={styles.badgeText}>{card.badge}</Text>
          </View>
        )}
      </View>
      
      {/* Match Score Bar - Visual indicator */}
      {card.matchScore && (
        <View style={styles.matchScoreContainer}>
          <View style={styles.matchScoreBackground}>
            <View 
              style={[
                styles.matchScoreFill, 
                { 
                  width: `${card.matchScore}%`,
                  backgroundColor: getBadgeColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.matchScoreText}>{card.matchScore}% match</Text>
        </View>
      )}
      
      {/* Info Section */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {card.quickInfo?.address || card.locations?.[0] || 'Location not specified'}
          </Text>
        </View>
        
        {card.rating > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.infoText}>
              {card.rating.toFixed(1)} ⭐ ({card.totalReviews} {card.totalReviews === 1 ? 'review' : 'reviews'})
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="call" size={14} color="#10B981" />
          <Text style={styles.infoText}>{card.phone}</Text>
        </View>

        {/* Availability indicator if urgent */}
        {card.quickInfo?.availability && (
          <View style={styles.infoRow}>
            <View style={styles.availableDot} />
            <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>
              {card.quickInfo.availability}
            </Text>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonPrimary]}
          onPress={() => handleCallProvider(card.phone)}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={16} color="#FFFFFF" />
          <Text style={[styles.ctaText, styles.ctaTextPrimary]}>Call Now</Text>
        </TouchableOpacity>
        
        {card.hasDashboard && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleViewDetails(card.providerId)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={16} color={Colors.primary} />
            <Text style={styles.ctaText}>View</Text>
          </TouchableOpacity>
        )}
        
        {card.canBook && (
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonBook]}
            onPress={() => handleBookNow(card.providerId)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={16} color="#FFFFFF" />
            <Text style={[styles.ctaText, styles.ctaTextPrimary]}>Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

  // ============== RENDER CHAT MESSAGE ==============
const renderChatMessage = (msg, index) => {
  if (msg.type === 'user') {
    return (
      <View key={index} style={styles.userMessageContainer}>
        <View style={styles.userMessage}>
          <Text style={styles.userMessageText}>{msg.text}</Text>
        </View>
      </View>
    );
  }
  
return (
  <View key={index} style={styles.botMessageContainer}>
    <View style={styles.botMessage}>
      <Text style={styles.botMessageText}>{msg.text}</Text>
      
      {msg.understood && msg.understood.location !== 'Any location' && (
        <View style={styles.understoodBox}>
          <View style={styles.understoodHeader}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.understoodTitle}>Searching near {msg.understood.location}</Text>
          </View>
        </View>
      )}
      
      {msg.cards && msg.cards.length > 0 && (
        <View style={styles.cardsContainer}>
          <View style={styles.cardsHeader}>
            <Ionicons name="business" size={16} color={Colors.primary} />
            <Text style={styles.cardsTitle}>
              {msg.cards.length} provider{msg.cards.length > 1 ? 's' : ''} found
            </Text>
          </View>
          {msg.cards.map(card => renderProviderCard(card))}
        </View>
      )}
      
      {msg.suggestions && msg.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Ionicons name="bulb" size={14} color="#F59E0B" />
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
          </View>
          <View style={styles.suggestionChips}>
            {msg.suggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(suggestion)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-forward-circle" size={14} color={Colors.primary} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  </View>
);
};
 
  // ============== RENDER AI CHAT MODAL ==============
  const renderAIChatModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showAIChatbot}
      onRequestClose={() => setShowAIChatbot(false)}
    >
      <SafeAreaView style={styles.chatModalContainer}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <View style={styles.chatHeaderIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.chatTitle}>AI Service Finder</Text>
              <Text style={styles.chatSubtitle}>Natural language search</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAIChatbot(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatMessages}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((msg, index) => renderChatMessage(msg, index))}
          
          {isSearching && (
            <View style={styles.botMessageContainer}>
              <View style={styles.botMessage}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Searching for providers...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.chatInputContainer}>
            <TextInput 
              value={aiQuery}
              onChangeText={setAiQuery}
              placeholder="Ask for any service... (e.g., 'boda boda near gate')"
              placeholderTextColor={Colors.textSecondary}
              style={styles.chatTextInput}
              multiline
              maxLength={200}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="search"
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              onPress={handleSendPress} 
              disabled={isSearching || !aiQuery.trim()}
              style={[
                styles.sendButton,
                (!aiQuery.trim() || isSearching) && styles.sendButtonDisabled
              ]}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={!aiQuery.trim() || isSearching ? Colors.textSecondary : '#FFFFFF'} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

 useEffect(() => {
    const initDatabase = async () => {
      try {
        await localServicesDB.init();
        setDbReady(true);
      } catch (error) {
        console.log('⚠️ Database init failed:', error.message);
      }
    };
    initDatabase();
  }, []);

  useEffect(() => {
    initializeData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultCategories = [
        {
          _id: 'matatu_services',
          id: 'matatu_services',
          name: 'Matatu Services',
          description: 'Public transport services around campus',
          icon: 'bus',
          color: '#10B981',
          bgColor: '#10B98120',
          isPinned: true,
          providerCount: 12,
          allowDashboard: false,
          allowBooking: false
        },
        {
          _id: 'boda_boda',
          id: 'boda_boda',
          name: 'Boda Boda',
          description: 'Motorbike taxi and delivery services',
          icon: 'bicycle',
          color: '#059669',
          bgColor: '#05966920',
          isPinned: true,
          providerCount: 8,
          allowDashboard: false,
          allowBooking: false
        }
      ];
      
      setCategories(defaultCategories);
      fetchFreshDataInBackground();
      
    } catch (error) {
      console.error('❌ Initial load error:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshDataInBackground = async () => {
    try {
      const freshCategories = await fetchFreshData();
      if (freshCategories && freshCategories.length > 0) {
        const mergedCategories = mergeCategoriesWithDefaults(freshCategories);
        setCategories(mergedCategories);
        setIsOffline(false);
        
        if (dbReady) {
          try {
            await localServicesDB.saveCategories(freshCategories);
          } catch (dbError) {
            console.log('⚠️ Could not save to SQLite:', dbError.message);
          }
        }
        
        await AsyncStorage.setItem('local_services_cache', JSON.stringify(freshCategories));
        await AsyncStorage.setItem('local_services_cache_time', Date.now().toString());
      }
    } catch (networkError) {
      try {
        const cacheTime = await AsyncStorage.getItem('local_services_cache_time');
        const cacheData = await AsyncStorage.getItem('local_services_cache');
        
        if (cacheData && cacheTime) {
          const cachedCategories = JSON.parse(cacheData);
          const cacheAge = Date.now() - parseInt(cacheTime);
          
          if (cacheAge < 60 * 60 * 1000 * 24) {
            const mergedCategories = mergeCategoriesWithDefaults(cachedCategories);
            setCategories(mergedCategories);
            setIsOffline(true);
            setError('Using cached data. Connect for latest updates.');
          }
        }
      } catch (cacheError) {
        setIsOffline(true);
        setError('No internet connection. Basic services available.');
      }
    }
  };

  const mergeCategoriesWithDefaults = (freshCategories) => {
    const initializedFresh = freshCategories
      .map(cat => initializeCategory(cat))
      .filter(cat => cat !== null);
    
    const hasMatatu = initializedFresh.some(cat => 
      cat.name.toLowerCase().includes('matatu'));
    const hasBoda = initializedFresh.some(cat => 
      cat.name.toLowerCase().includes('boda boda') || 
      cat.name.toLowerCase().includes('motorbike'));
    
    let result = [...initializedFresh];
    
    if (!hasMatatu) {
      result.push({
        _id: 'matatu_services',
        id: 'matatu_services',
        name: 'Matatu Services',
        description: 'Public transport services around campus',
        icon: 'bus',
        color: '#10B981',
        bgColor: '#10B98120',
        isPinned: true,
        providerCount: 12,
        allowDashboard: false,
        allowBooking: false
      });
    }
    
    if (!hasBoda) {
      result.push({
        _id: 'boda_boda',
        id: 'boda_boda',
        name: 'Boda Boda',
        description: 'Motorbike taxi and delivery services',
        icon: 'bicycle',
        color: '#059669',
        bgColor: '#05966920',
        isPinned: true,
        providerCount: 8,
        allowDashboard: false,
        allowBooking: false
      });
    }
    
    return result;
  };

  const fetchFreshData = async () => {
    try {
      const response = await axios.get('/api/services/categories', {
        timeout: 8000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      let categoriesArray = response.data?.categories || [];
      
      if (!Array.isArray(categoriesArray)) {
        categoriesArray = [];
      }
      
      const processedCategories = categoriesArray.map(category => {
        const name = (category.name || '').toLowerCase();
        const isPinned = name.includes('matatu') || 
                        name.includes('boda boda') || 
                        name.includes('motorbike');
        
        return {
          ...category,
          id: category._id,
          isPinned,
          providerCount: 0
        };
      });
      
      return processedCategories;
      
    } catch (error) {
      console.error('❌ Fetch error:', error.message);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFreshDataInBackground();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterCategories = () => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryProviders', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

const handleAddService = () => {
  navigation.navigate('OnboardingNavigator');  // ← Just like FoodScreen
};
  const getPinnedCategories = () => {
    return categories.filter(cat => cat.isPinned);
  };

  const getRegularCategories = () => {
    return filteredCategories.filter(cat => !cat.isPinned);
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View>
        <Text style={styles.welcomeText}>Moi University</Text>
        <Text style={styles.headerTitle}>Services Hub</Text>
      </View>
      <TouchableOpacity 
        style={styles.addServiceButton}
        onPress={handleAddService}
      >
        <Ionicons name="add-circle" size={24} color={Colors.primary} />
        <Text style={styles.addServiceText}>Add Service</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSearchBar = () => (
    <Animated.View 
      style={[
        styles.searchContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for services..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderPinnedServices = () => {
    const pinnedCategories = getPinnedCategories();
    if (pinnedCategories.length === 0 || searchQuery !== '') return null;

    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.featuredTitleContainer}>
            <Ionicons name="star" size={20} color={Colors.warning} />
            <Text style={styles.featuredTitle}>Featured Services</Text>
          </View>
          {/* <View style={styles.featuredBadge}>
            <Ionicons name="pin" size={12} color={Colors.text} />
            <Text style={styles.featuredBadgeText}>PINNED</Text>
          </View> */}
        </View>
        
        <View style={styles.featuredGrid}>
          {pinnedCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.featuredGridCard, 
                { backgroundColor: category.bgColor }
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.featuredGridCardHeader}>
                <View style={[styles.featuredGridIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.featuredGridBadge}>
                  <Text style={styles.featuredGridBadgeText}>POPULAR</Text>
                </View>
              </View>
              <View style={styles.featuredGridCardContent}>
                <Text style={styles.featuredGridCardTitle} numberOfLines={2}>
                  {category.name}
                </Text>
                <Text style={styles.featuredGridCardDescription} numberOfLines={2}>
                  
                </Text>  
                {category.providerCount > 0 && (
                  <View style={styles.featuredGridStats}>
                    <View style={styles.featuredGridStatItem}>
                      <Ionicons name="business" size={12} color={Colors.textSecondary} />
                      <Text style={styles.featuredGridStatText}>
                        {category.providerCount} providers
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderAllServices = () => {
    const regularCategories = getRegularCategories();
    
    if (regularCategories.length === 0 && searchQuery) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Search Results</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateDescription}>
              Try different keywords or check your connection
            </Text>
          </View>
        </View>
      );
    }

    if (regularCategories.length === 0 && !searchQuery) {
      return null;
    }

    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Results (${regularCategories.length})` : 'All Services'}
          </Text>
          {!searchQuery && regularCategories.length > 0 && (
            <Text style={styles.servicesCount}>{regularCategories.length} services</Text>
          )}
        </View>
        
        <View style={styles.servicesGrid}>
          {regularCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.serviceCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: category.bgColor }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.serviceName} numberOfLines={2}>{category.name}</Text>
              {category.providerCount > 0 && (
                <View style={styles.serviceStatus}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.serviceStatusText}>{category.providerCount} available</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderPinnedServices()}
        {renderAllServices()}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* AI Chat FAB */}
      <TouchableOpacity 
        style={styles.aiFab}
        onPress={openAIChat}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.aiFabGradient}
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* AI Chat Modal */}
      {renderAIChatModal()}

      {isOffline && !loading && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi" size={16} color={Colors.text} />
          <Text style={styles.offlineText}>Offline Mode • Using cached data</Text>
          {refreshing && (
            <ActivityIndicator size="small" color={Colors.text} style={{ marginLeft: 8 }} />
          )}
        </View>
      )}
      
      {refreshing && !isOffline && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.syncText}>Syncing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

  
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 0,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  addServiceButton: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addServiceText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  
  // Search Styles
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchWrapper: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
   // Match Score Styles
  matchScoreContainer: {
    marginTop: 8,
    marginBottom: 8,
  }, 
  matchScoreBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchScoreFill: {
    height: '100%',
    borderRadius: 2,
  },
  matchScoreText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  
  // Available Dot
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  
  // CTA Button Book
  ctaButtonBook: {
    backgroundColor: Colors.primary,
  },
  
  // Understood Box Improvements
  understoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  understoodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  understoodItems: {
    gap: 6,
  },
  understoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  understoodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 70,
  },
  understoodValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  
  // Cards Header
  cardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  
  // Suggestions Header
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Suggestion Chip Improvements
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  }, 
  // Section Styles
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  servicesCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  
  // Featured Services Grid
  featuredTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featuredTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  featuredBadge: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700',
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredGridCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    ...Components.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 0,
    overflow: 'hidden',
  },
  featuredGridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  featuredGridIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGridBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  featuredGridBadgeText: {
    fontSize: 8,
    color: Colors.text,
    fontWeight: '700',
  },
  featuredGridCardContent: {
    flex: 1,
  },
  featuredGridCardTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: Spacing.xs,
    minHeight: 36,
  },
  featuredGridStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  featuredGridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featuredGridStatText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  
  // All Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    ...Components.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: Spacing.xs,
    minHeight: 32,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceStatusText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  aiSearchButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  aiSearchText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // AI Chat FAB
  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: Spacing.lg,
    backgroundColor: Colors.accent,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    zIndex: 1000,
  },
  
  // ============== AI CHAT MODAL STYLES ==============
  chatModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chatHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  chatSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  
  // User Message
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  userMessage: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  
  // Bot Message
  botMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  botMessage: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '95%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  botMessageText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  
  // Understood Box
  understoodBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  understoodTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  understoodText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  
  // Provider Cards
  cardsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  cardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  providerCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardInfo: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  ctaButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  ctaTextPrimary: {
    color: '#FFFFFF',
  },
  matchScore: {
    marginTop: Spacing.sm,
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  
  // Suggestions
  suggestionsContainer: {
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
  },
  
  // Chat Input
  chatInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'flex-end',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    marginRight: Spacing.sm,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.cardBorder,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  retryButton: {
    ...Components.buttonPrimary,
    minWidth: 120,
  },
  retryButtonText: {
    ...Components.buttonTextPrimary,
  },
  
  // Offline Banner
  offlineBanner: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  offlineText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xxxl,
  },



  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    ...Shadows.medium,
    zIndex: 1000,
  },
  aiFabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Chat Modal Styles - Using your existing color palette
  chatModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chatHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  chatSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  
  // User Message
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  userMessage: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  
  // Bot Message
  botMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  botMessage: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '95%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  botMessageText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  
  // Understood Box
  understoodBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  understoodTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  understoodText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  
  // Provider Cards
  cardsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  cardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  providerCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardInfo: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  ctaButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  ctaTextPrimary: {
    color: '#FFFFFF',
  },
  matchScore: {
    marginTop: Spacing.sm,
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  
  // Suggestions
  suggestionsContainer: {
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
  },
  
  // Chat Input
  chatInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'flex-end',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    marginRight: Spacing.sm,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.cardBorder,
  },
});

export default Localservices;