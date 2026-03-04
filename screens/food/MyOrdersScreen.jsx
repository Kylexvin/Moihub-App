// screens/food/MyOrdersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import * as foodApi from '../../services/foodApi';
import { useAuth } from '../../context/AuthContext';
import { useFoodContext } from '../../context/FoodContext';

const { width } = Dimensions.get('window');

// Food-themed color palette matching other screens
const FoodColors = {
  primary: '#FF6B35',      // Tangy Orange
  secondary: '#F7C35C',    // Honey Yellow
  accent: '#EF476F',       // Watermelon Pink
  success: '#06D6A0',      // Mint Green
  warning: '#FF9F1C',      // Pumpkin Orange
  background: '#0a0a0a',
  card: '#1a1a1a',
  text: '#FFFFFF',
  textSecondary: '#FFE5D9', // Cream
};

const MyOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [clearingOrders, setClearingOrders] = useState(false);
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { vendors } = useFoodContext();
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const loadOrders = async (showRefresh = false, reset = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else if (!showRefresh && !reset) {
        setLoading(true);
      }
      
      setError(null);
      const currentPage = reset ? 1 : page;
      
      // Get orders from API
      const response = await foodApi.fetchUserOrders(token, currentPage);
      
      if (response && response.success) {
        if (reset || currentPage === 1) {
          setOrders(response.orders || []);
        } else {
          setOrders(prevOrders => [...prevOrders, ...(response.orders || [])]);
        }
        
        // Check if there's more data to load
        if (!response.orders || response.orders.length === 0 || response.orders.length < 10) {
          setHasMoreData(false);
        } else {
          setHasMoreData(true);
          if (!reset) setPage(currentPage + 1);
        }
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } catch (error) {
      console.error('Error loading orders:', error.message || error);
      setError('Error loading orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset page and reload data when screen comes into focus
      setPage(1);
      loadOrders(false, true);
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setPage(1);
    loadOrders(true, true);
  };

  const loadMoreOrders = () => {
    if (hasMoreData && !loading && !refreshing) {
      loadOrders();
    }
  };

  const handleRetry = () => {
    setPage(1);
    loadOrders(false, true);
  };

  const handleClearOrders = () => {
    Alert.alert(
      "Clear Order History",
      "Are you sure you want to clear all your order history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearAllOrders }
      ],
      { cancelable: true }
    );
  };

  const clearAllOrders = async () => {
    try {
      setClearingOrders(true);
      const response = await foodApi.clearUserOrders(token);
      
      if (response && response.success) {
        setOrders([]);
        Alert.alert("Success", "Your order history has been cleared successfully.");
      } else {
        Alert.alert("Error", response?.message || "Failed to clear orders. Please try again.");
      }
    } catch (error) {
      console.error('Error clearing orders:', error.message || error);
      Alert.alert("Error", "Failed to clear order history. Please try again later.");
    } finally {
      setClearingOrders(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return FoodColors.warning; // amber/orange
      case 'preparing': return '#1976D2'; // blue
      case 'ready': return FoodColors.success; // mint green
      case 'delivered': return FoodColors.success; // mint green
      case 'cancelled': return FoodColors.accent; // watermelon pink
      default: return FoodColors.textSecondary; // grey
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'time-outline';
      case 'preparing': return 'restaurant-outline';
      case 'ready': return 'checkmark-circle-outline';
      case 'delivered': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderItem = ({ item, index }) => {
    // Find vendor from context if available
    let vendorName = 'Restaurant';
    let vendorLocation = '';
    
    if (item.vendorId) {
      if (typeof item.vendorId === 'object') {
        // If vendorId is an object with details
        vendorName = item.vendorId.shopName || 'Restaurant';
        vendorLocation = item.vendorId.location || '';
      } else {
        // If vendorId is just an ID, try to find vendor details from context
        const vendor = vendors.find(v => v._id === item.vendorId);
        if (vendor) {
          vendorName = vendor.shopName || 'Restaurant';
          vendorLocation = vendor.location || '';
        }
      }
    }
    
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={500}
      >
        <TouchableOpacity 
          style={styles.orderCard}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
            style={styles.cardGradient}
          >
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderIdContainer}>
                <Ionicons name="receipt-outline" size={18} color={FoodColors.primary} />
                <Text style={styles.orderId}>Order #{item._id.substring(item._id.length - 8)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Ionicons name={getStatusIcon(item.status)} size={12} color="#fff" />
                <Text style={styles.statusText}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
            
            {/* Order Details */}
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={FoodColors.textSecondary} />
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={14} color={FoodColors.textSecondary} />
                <Text style={styles.orderPrice}>Ksh {item.totalPrice}</Text>
              </View>
            </View>
            
            {/* Order Footer */}
            <View style={styles.orderFooter}>
              <View style={styles.vendorInfo}>
                <Ionicons name="restaurant-outline" size={16} color={FoodColors.primary} />
                <Text style={styles.vendorText} numberOfLines={1}>
                  {vendorName}
                </Text>
              </View>
              <View style={styles.itemsBadge}>
                <Text style={styles.itemsCount}>{item.items.length} item(s)</Text>
              </View>
            </View>

            {/* Decorative Food Emoji */}
            <Text style={styles.cardFoodEmoji}>🍽️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[FoodColors.background, '#1a1a1a', FoodColors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loaderContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <Text style={styles.loaderEmoji}>🍳</Text>
          </Animatable.View>
          <ActivityIndicator size="large" color={FoodColors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[FoodColors.background, '#1a1a1a', FoodColors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Food Emojis */}
      <View style={styles.floatingFoods}>
        <Text style={[styles.floatingFood, styles.food1]}>🍕</Text>
        <Text style={[styles.floatingFood, styles.food2]}>🍔</Text>
        <Text style={[styles.floatingFood, styles.food3]}>🌮</Text>
        <Text style={[styles.floatingFood, styles.food4]}>🍣</Text>
      </View>

      <StatusBar barStyle="light-content" backgroundColor={FoodColors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={FoodColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        {orders.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClearOrders}
            disabled={clearingOrders}
          >
            <LinearGradient
              colors={[FoodColors.accent + '20', FoodColors.accent + '10']}
              style={styles.clearButtonGradient}
            >
              {clearingOrders ? (
                <ActivityIndicator size="small" color={FoodColors.accent} />
              ) : (
                <Ionicons name="brush-outline" size={20} color={FoodColors.accent} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {error && orders.length === 0 ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>😋</Text>
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>
            Looks like you haven't placed any food orders
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('FoodHome')}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Browse Restaurants</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[FoodColors.primary]}
              tintColor={FoodColors.primary}
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && orders.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={FoodColors.primary} />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FoodColors.background,
  },
  floatingFoods: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingFood: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
  },
  food1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  food2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  food3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  food4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FoodColors.text,
  },
  clearButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  clearButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,71,111,0.3)',
    borderRadius: 20,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: FoodColors.text,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 13,
    color: FoodColors.textSecondary,
    marginLeft: 6,
  },
  orderPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: FoodColors.primary,
    marginLeft: 6,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.1)',
    paddingTop: 12,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorText: {
    marginLeft: 8,
    fontSize: 14,
    color: FoodColors.text,
    fontWeight: '500',
    flex: 1,
  },
  itemsBadge: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCount: {
    fontSize: 11,
    color: FoodColors.primary,
    fontWeight: '600',
  },
  cardFoodEmoji: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 32,
    opacity: 0.1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderEmoji: {
    fontSize: 50,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: FoodColors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorEmoji: {
    fontSize: 50,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FoodColors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: FoodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FoodColors.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: FoodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  shopButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    fontSize: 14,
    color: FoodColors.textSecondary,
    marginTop: 8,
  },
});

export default MyOrdersScreen;