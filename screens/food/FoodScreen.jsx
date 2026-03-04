// screens/food/FoodScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFoodContext } from '../../context/FoodContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Food-themed color palette
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

// Curated food images for variety - Expanded with more variety
const FoodImages = [
  // Burgers & Fast Food
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
  'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400',
  
  // Pizza & Italian
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=400',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400',
  
  // African & Local
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400',
  'https://images.unsplash.com/photo-1667489022797-ab6083fe2b8c?w=400',
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
  'https://images.unsplash.com/photo-1645112411342-4665e2f28b44?w=400',
  
  // Rice & Bowls
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  
  // Drinks & Beverages
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
  'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
  
  // Desserts
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
  'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400',
  
  // Grilled & Meats
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
  'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
  'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400',
  
  // Noodles & Pasta
  'https://images.unsplash.com/photo-1551892589-865f69869476?w=400',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400',
];

const FoodScreen = () => {
  const navigation = useNavigation();
  const { vendors, loadingVendors, vendorError, loadVendors, cart } = useFoodContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Store assigned images for vendors to keep them consistent
  const [vendorImages, setVendorImages] = useState({});

  useEffect(() => {
    if (vendors.length > 0) {
      assignRandomImagesToVendors();
    }
  }, [vendors]);

  const assignRandomImagesToVendors = () => {
    const images = {};
    vendors.forEach((vendor, index) => {
      // Use multiple factors to ensure unique images:
      // - Vendor ID (if available)
      // - Index position
      // - Current timestamp seed
      const seed = vendor._id 
        ? vendor._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : index * 100;
      
      // Add index to ensure different images even if IDs are similar
      const imageIndex = (seed + index * 7) % FoodImages.length;
      images[vendor._id] = FoodImages[imageIndex];
    });
    setVendorImages(images);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  const getVendorImage = (vendor) => {
    // Return pre-assigned image or assign one on the fly
    if (vendorImages[vendor._id]) {
      return vendorImages[vendor._id];
    }
    
    // Fallback: generate a random index based on vendor properties
    const seed = vendor._id 
      ? vendor._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : Math.random() * 1000;
    return FoodImages[seed % FoodImages.length];
  };

  const renderVendorItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => navigation.navigate('FoodVendor', { 
          vendorId: item._id,
          shopName: item.shopName 
        })}
        activeOpacity={0.9}
      >
        {/* Background Image - Now unique per vendor */}
        <Image
          source={{ uri: getVendorImage(item) }}
          style={styles.vendorImage}
        />
        
        {/* Dark Overlay for Text Visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
          style={styles.imageOverlay}
        />

        {/* Status Badge */}
        {item.isOpen ? (
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>OPEN</Text>
          </View>
        ) : (
          <View style={styles.closedBadge}>
            <View style={[styles.openDot, styles.closedDot]} />
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}

        {/* Vendor Info */}
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.shopName}</Text>
          
          <View style={styles.vendorMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={FoodColors.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          </View>
        </View>

        {/* Decorative Food Emoji - Different emoji based on vendor */}
        <Text style={styles.cardFoodEmoji}>
          {['🍔', '🍕', '🌮', '🍜', '🍣', '🥗', '🍝', '🍛', '🍲', '🥘'][index % 10]}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Welcome Section - Simplified */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.greeting}>Hungry?</Text>
          <Text style={styles.subGreeting}>Find something delicious</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['rgba(255,107,53,0.1)', 'rgba(247,195,92,0.05)']}
          style={styles.searchGradient}
        >
          <Ionicons name="search-outline" size={20} color={FoodColors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={FoodColors.primary} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.listFooter}>
      <Animatable.View animation="fadeInUp" duration={800}>
        <TouchableOpacity 
          style={styles.vendorCtaButton}
          onPress={() => navigation.navigate('OnboardingNavigator')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[FoodColors.primary, FoodColors.primary + 'dd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="restaurant" size={28} color="#FFF" />
              </View>
              <View style={styles.ctaTextContainer}>
                <Text style={styles.ctaTitle}>Partner With Us!</Text>
                <Text style={styles.ctaSubtitle}>List your restaurant</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </View>
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

      {loadingVendors && !refreshing ? (
        <View style={styles.loaderContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <Text style={styles.loaderEmoji}>🍳</Text>
          </Animatable.View>
          <ActivityIndicator size="large" color={FoodColors.primary} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : vendorError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>😋</Text>
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{vendorError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVendors}>
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
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={item => item._id}
          ListHeaderComponent={renderHeader}
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
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
              </View>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptyText}>
                Try a different search term
              </Text>
            </View>
          }
        />
      )}

      {/* My Orders FAB */}
      <Animatable.View
        animation="bounceIn"
        duration={1000}
        delay={500}
        style={styles.fabContainer}
      >
        <TouchableOpacity 
          style={styles.myOrdersFab}
          onPress={() => navigation.navigate('MyOrders')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[FoodColors.primary, FoodColors.primary + 'dd']}
            style={styles.fabGradient}
          >
            <Ionicons name="receipt" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Animatable.View 
          animation="slideInUp" 
          duration={300}
          style={styles.floatingCart}
        >
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Order')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cartGradient}
            >
              <View style={styles.cartInfo}>
                <View style={styles.cartIcon}>
                  <Ionicons name="cart" size={24} color="#FFF" />
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.cartText}>Your Order</Text>
                  <Text style={styles.cartSubtext}>Ready to checkout</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
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
  headerContainer: {
    paddingTop: 20,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: FoodColors.primary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: FoodColors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: FoodColors.text,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 120,
  },
  vendorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  openBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 214, 160, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  closedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 72, 85, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  closedDot: {
    backgroundColor: '#fff',
  },
  openText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  closedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  vendorInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: FoodColors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFoodEmoji: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    fontSize: 32,
    opacity: 0.3,
    zIndex: 1,
  },
  listFooter: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  vendorCtaButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ctaGradient: {
    padding: 16,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: FoodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 10,
  },
  myOrdersFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: FoodColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: FoodColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9,
  },
  cartButton: {
    overflow: 'hidden',
  },
  cartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIcon: {
    position: 'relative',
    marginRight: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: FoodColors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FoodColors.primary,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});

export default FoodScreen;