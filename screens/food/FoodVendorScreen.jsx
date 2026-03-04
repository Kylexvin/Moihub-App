// screens/food/FoodVendorScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { useFoodContext } from '../../context/FoodContext';
import * as foodApi from '../../services/foodApi';

const { width } = Dimensions.get('window');

// Food-themed color palette matching FoodScreen
const FoodColors = {
  primary: '#FF6B35',      // Tangy Orange
  secondary: '#F7C35C',    // Honey Yellow
  accent: '#EF476F',       // Watermelon Pink
  success: '#06D6A0',      // Mint Green
  background: '#0a0a0a',
  card: '#1a1a1a',
  text: '#FFFFFF',
  textSecondary: '#FFE5D9', // Cream
};

const FoodVendorScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vendorId, shopName } = route.params;
  const { addToCart, cart } = useFoodContext();
  
  const [vendor, setVendor] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadVendorDetails = async () => {
    try {
      const response = await foodApi.fetchApprovedVendors();
      const foundVendor = response.vendors.find(v => v._id === vendorId);
      if (foundVendor) {
        setVendor(foundVendor);
      }
    } catch (error) {
      console.error('Error loading vendor details:', error);
      setError('Failed to load vendor details');
    }
  };

  const loadFoodItems = async (page = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setFoodItems([]);
        setCurrentPage(1);
        page = 1;
      }
      
      if (page > totalPages && totalPages !== 1) return;
      
      if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await foodApi.fetchVendorListings(vendorId, page);
      
      if (response.success) {
        const { listings, pagination } = response;
        
        if (shouldRefresh || page === 1) {
          setFoodItems(listings);
        } else {
          setFoodItems(prevItems => [...prevItems, ...listings]);
        }
        
        setTotalPages(pagination.pages);
        setCurrentPage(page);
      } else {
        setError('Failed to load food items');
      }
    } catch (error) {
      console.error('Error loading food items:', error);
      setError('Failed to load food items. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendorDetails();
    loadFoodItems();
  }, [vendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendorDetails();
    loadFoodItems(1, true);
  };

  const loadMoreItems = () => {
    if (!loadingMore && currentPage < totalPages) {
      loadFoodItems(currentPage + 1);
    }
  };

  const handleAddToCart = (item) => {
    const result = addToCart(item, 1);
    
    if (!result.success) {
      Alert.alert('Cannot Add Item', result.message);
    } else {
      // Show subtle feedback instead of alert
      // You could add a temporary animation here
    }
  };

  const renderFoodItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      duration={400}
    >
      <TouchableOpacity 
        style={styles.foodCard}
        activeOpacity={0.9}
        onPress={() => {
          // Optional: Navigate to item details if needed
        }}
      >
        <LinearGradient
          colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
          style={styles.cardGradient}
        >
          <Image
            source={{ uri: item.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
            style={styles.foodImage}
            resizeMode="cover"
          />
          
          <View style={styles.foodDetails}>
            <Text style={styles.foodName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.foodDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            
            <View style={styles.foodMeta}>
              <Text style={styles.foodPrice}>Ksh {item.price}</Text>
              {item.popular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="flame" size={12} color={FoodColors.primary} />
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderVendorHeader = () => (
    <>
      {vendor && (
        <View style={styles.vendorHeader}>
          {/* Background Pattern */}
          <View style={styles.vendorPattern}>
            <Text style={styles.patternEmoji}>🍕</Text>
            <Text style={styles.patternEmoji}>🍔</Text>
            <Text style={styles.patternEmoji}>🌮</Text>
          </View>

          <View style={styles.vendorInfo}>
            <View style={styles.vendorNameContainer}>
              <Text style={styles.vendorName}>{vendor.shopName}</Text>
              {vendor.isOpen ? (
                <View style={styles.openBadge}>
                  <View style={styles.openDot} />
                  <Text style={styles.openBadgeText}>OPEN</Text>
                </View>
              ) : (
                <View style={[styles.openBadge, styles.closedBadge]}>
                  <View style={[styles.openDot, styles.closedDot]} />
                  <Text style={styles.openBadgeText}>CLOSED</Text>
                </View>
              )}
            </View>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color={FoodColors.primary} />
              <Text style={styles.locationText}>{vendor.location}</Text>
            </View>
            
            {vendor.description && (
              <Text style={styles.vendorDescription}>
                {vendor.description}
              </Text>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>Menu</Text>
        <View style={styles.menuDivider} />
        <Text style={styles.menuCount}>{foodItems.length} items</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={FoodColors.background} />
      
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

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={FoodColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shopName}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Cart Indicator - Floating Button */}
      {cart.length > 0 && (
        <Animatable.View 
          animation="bounceIn"
          duration={600}
          style={styles.cartFloating}
        >
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Order')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.cartGradient}
            >
              <View style={styles.cartIconContainer}>
                <Ionicons name="cart" size={22} color="#FFF" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cartButtonText}>View Cart</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <Text style={styles.loaderEmoji}>🍳</Text>
          </Animatable.View>
          <ActivityIndicator size="large" color={FoodColors.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>😋</Text>
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={foodItems}
          renderItem={renderFoodItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderVendorHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[FoodColors.primary]}
              tintColor={FoodColors.primary}
            />
          }
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={FoodColors.primary} />
                <Text style={styles.loadingMoreText}>Loading more items...</Text>
              </View>
            ) : foodItems.length > 0 ? (
              <View style={styles.endOfList}>
                <Text style={styles.endOfListText}>End of menu</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyEmoji}>🍽️</Text>
                </View>
                <Text style={styles.emptyTitle}>No menu items</Text>
                <Text style={styles.emptyText}>
                  This vendor hasn't added any items yet
                </Text>
              </View>
            )
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
    fontSize: 18,
    fontWeight: '700',
    color: FoodColors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  vendorHeader: {
    backgroundColor: 'rgba(255,107,53,0.05)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  vendorPattern: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternEmoji: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  vendorInfo: {
    zIndex: 2,
  },
  vendorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: '800',
    color: FoodColors.text,
    flex: 1,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FoodColors.success,
  },
  closedBadge: {
    backgroundColor: 'rgba(232, 72, 85, 0.15)',
    borderColor: FoodColors.accent,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FoodColors.success,
    marginRight: 6,
  },
  closedDot: {
    backgroundColor: FoodColors.accent,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: FoodColors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: FoodColors.textSecondary,
    marginLeft: 6,
    fontSize: 14,
  },
  vendorDescription: {
    fontSize: 14,
    color: FoodColors.textSecondary,
    lineHeight: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: FoodColors.primary,
  },
  menuDivider: {
    height: 2,
    backgroundColor: FoodColors.primary,
    width: 40,
    marginLeft: 8,
    borderRadius: 1,
  },
  menuCount: {
    fontSize: 14,
    color: FoodColors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  foodCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  cardGradient: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26,26,26,0.95)',
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    margin: 8,
  },
  foodDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: '700',
    color: FoodColors.text,
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 13,
    color: FoodColors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: FoodColors.primary,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    color: FoodColors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: FoodColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cartFloating: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  cartButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: FoodColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cartIconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: FoodColors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FoodColors.primary,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FoodColors.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: FoodColors.textSecondary,
    textAlign: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 6,
    color: FoodColors.textSecondary,
    fontSize: 14,
  },
  endOfList: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    color: FoodColors.textSecondary,
    fontSize: 14,
    opacity: 0.7,
  },
});

export default FoodVendorScreen;