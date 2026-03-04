import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Dark Green Medical/Pharmacy themed color palette
const PharmacyColors = {
  primary: '#1B5E20',      // Dark Green
  secondary: '#2E7D32',     // Medium Green
  accent: '#00ACC1',        // Dark Cyan
  success: '#43A047',       // Green
  warning: '#FB8C00',       // Orange
  error: '#E53935',         // Red
  whatsapp: '#25D366',      // WhatsApp Green
  background: '#0A1F0A',    // Very Dark Green
  surface: '#1A2E1A',       // Dark Green Surface
  card: '#1E3A1E',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#A5D6A7', // Light Green
  textMuted: '#558B55',     // Muted Green
  border: '#2E5A2E',        // Border Green
};

const PharmacyProducts = ({ navigation, route }) => {
  const { pharmacySlug, pharmacyName, pharmacyId } = route.params;
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);

  const { cartItems, addToCart, getCartItemQuantity, getTotalQuantity } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/eshop/vendor/shops/${pharmacySlug}/products`);
        
        if (res.data.success) {
          setProducts(res.data.data);
          setShopInfo(res.data.shop);
          setFilteredProducts(res.data.data);
        } else {
          Alert.alert('Error', 'Failed to load products');
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pharmacySlug]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // WhatsApp function
  const openWhatsApp = () => {
    const phoneNumber = shopInfo.contactNumber || '254700000000'; // Fallback number
    const message = `Hello,from MoiHub, I'm interested in products from ${shopInfo.name || pharmacyName}.`;
    
    let url = '';
    
    // Remove any non-numeric characters from phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Ensure number has country code (assume Kenya if not present)
    const formattedNumber = cleanNumber.startsWith('254') ? cleanNumber : `254${cleanNumber}`;
    
    if (Platform.OS === 'ios') {
      url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    } else {
      url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    }
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        // Fallback to web.whatsapp.com if app not installed
        const webUrl = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
        return Linking.openURL(webUrl);
      }
    }).catch(err => {
      console.error('WhatsApp error:', err);
      Alert.alert(
        'WhatsApp Not Available',
        'Please install WhatsApp to contact this pharmacy.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Install', 
            onPress: () => Linking.openURL(Platform.OS === 'ios' 
              ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
              : 'market://details?id=com.whatsapp'
            )
          }
        ]
      );
    });
  };

  const handleAddToCart = async (product) => {
    if (!product.isAvailable) return;
    
    setAddingToCart(product._id);
    
    try {
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        shopId: product.shop,
        shopName: shopInfo.name || pharmacyName,
        shopSlug: shopInfo.slug,
        productSlug: product.slug
      });
      
      // Show a small confirmation instead of alert for better UX
      // Alert.alert('Success', `${product.name} added to cart`);
    } catch (error) {
      console.error('Cart Error:', error);
      Alert.alert('Error', 'Could not add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const renderProductCard = ({ item: product, index }) => {
    const isAddingThis = addingToCart === product._id;
    const itemQuantity = getCartItemQuantity(product._id);

    return (
      <Animatable.View 
        animation="fadeInUp" 
        delay={index * 100}
        duration={500}
      >
        <TouchableOpacity
          style={styles.productCard}
          activeOpacity={0.9}
          onPress={() => {
            // Optional: Navigate to product details
          }}
        >
          <LinearGradient
            colors={[PharmacyColors.card, PharmacyColors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Medical Pattern */}
            <View style={styles.medicalPattern}>
              <Text style={styles.patternIcon}>💊</Text>
              <Text style={styles.patternIcon}>🩺</Text>
            </View>

            <Image
              source={{ 
                uri: product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' 
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
            
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={[
                  styles.availabilityBadge,
                  { backgroundColor: product.isAvailable ? PharmacyColors.success + '20' : PharmacyColors.error + '20' }
                ]}>
                  <View style={[
                    styles.availabilityDot,
                    { backgroundColor: product.isAvailable ? PharmacyColors.success : PharmacyColors.error }
                  ]} />
                  <Text style={[
                    styles.availabilityText,
                    { color: product.isAvailable ? PharmacyColors.success : PharmacyColors.error }
                  ]}>
                    {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description || 'Medication and healthcare product'}
              </Text>
              
              <View style={styles.productFooter}>
                <View>
                  <Text style={styles.productPrice}>KSh {product.price.toLocaleString()}</Text>
                  {itemQuantity > 0 && (
                    <View style={styles.cartQuantityBadge}>
                      <Icon name="shopping-cart" size={12} color={PharmacyColors.textSecondary} />
                      <Text style={styles.cartQuantityText}>{itemQuantity} in cart</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !product.isAvailable && styles.disabledButton,
                    isAddingThis && styles.addButtonLoading,
                    itemQuantity > 0 && styles.addButtonActive
                  ]}
                  onPress={() => handleAddToCart(product)}
                  disabled={!product.isAvailable || isAddingThis}
                >
                  <LinearGradient
                    colors={product.isAvailable 
                      ? [PharmacyColors.primary, PharmacyColors.secondary]
                      : [PharmacyColors.border, PharmacyColors.surface]}
                    style={styles.addButtonGradient}
                  >
                    {isAddingThis ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon 
                          name={itemQuantity > 0 ? "add" : "add-shopping-cart"} 
                          size={18} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.addButtonText}>
                          {product.isAvailable ? 'Add' : 'Sold Out'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Prescription Required Badge */}
            {product.requiresPrescription && (
              <View style={styles.prescriptionBadge}>
                <Icon name="description" size={14} color={PharmacyColors.accent} />
                <Text style={styles.prescriptionText}>Rx</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={PharmacyColors.primary} barStyle="light-content" />
        <LinearGradient
          colors={[PharmacyColors.background, PharmacyColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="local-pharmacy" size={60} color={PharmacyColors.textSecondary} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={PharmacyColors.textSecondary} />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={PharmacyColors.primary} barStyle="light-content" />
      
      <LinearGradient
        colors={[PharmacyColors.background, PharmacyColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Medical Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>💊</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>🩺</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>💉</Text>
      </View>
      
      {/* Header with WhatsApp */}
      <LinearGradient
        colors={[PharmacyColors.primary, PharmacyColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>{pharmacyName}</Text>
          
          <View style={styles.headerActions}>
            {/* WhatsApp Button */}
            {shopInfo.contactNumber && (
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={openWhatsApp}
              >
                <FontAwesome name="whatsapp" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {/* Cart Button */}
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="shopping-cart" size={24} color="#FFFFFF" />
              {getTotalQuantity() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getTotalQuantity()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Shop Info */}
      {shopInfo.name && (
        <Animatable.View animation="fadeInDown" duration={500}>
          <LinearGradient
            colors={[PharmacyColors.card, PharmacyColors.surface]}
            style={styles.shopInfo}
          >
            <View style={styles.shopHeader}>
              <View style={styles.shopIconContainer}>
                <LinearGradient
                  colors={[PharmacyColors.primary, PharmacyColors.secondary]}
                  style={styles.shopIconGradient}
                >
                  <Icon name="storefront" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{shopInfo.name}</Text>
                {shopInfo.contactNumber && (
                  <View style={styles.shopContact}>
                    <Icon name="phone" size={14} color={PharmacyColors.textSecondary} />
                    <Text style={styles.contactText}>{shopInfo.contactNumber}</Text>
                    
                    {/* Small WhatsApp indicator */}
                    <TouchableOpacity onPress={openWhatsApp} style={styles.smallWhatsapp}>
                      <FontAwesome name="whatsapp" size={14} color={PharmacyColors.whatsapp} />
                      <Text style={styles.smallWhatsappText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>
      )}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <LinearGradient
          colors={[PharmacyColors.card, PharmacyColors.surface]}
          style={styles.searchContainer}
        >
          <Icon name="search" size={20} color={PharmacyColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            placeholderTextColor={PharmacyColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={PharmacyColors.textMuted} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Products List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medications & Products</Text>
          <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
        </View>
        
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icon name="inventory" size={60} color={PharmacyColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No products match' : 'No products available'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new items'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <LinearGradient
                  colors={[PharmacyColors.primary, PharmacyColors.secondary]}
                  style={styles.clearSearchGradient}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PharmacyColors.background,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: PharmacyColors.textSecondary,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PharmacyColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: PharmacyColors.textSecondary,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: PharmacyColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappButton: {
    padding: 8,
    backgroundColor: PharmacyColors.whatsapp + '40',
    borderRadius: 20,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: PharmacyColors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shopInfo: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
    overflow: 'hidden',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  shopIconContainer: {
    marginRight: 12,
  },
  shopIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: PharmacyColors.text,
  },
  shopContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  contactText: {
    color: PharmacyColors.textSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
  smallWhatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: PharmacyColors.whatsapp + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  smallWhatsappText: {
    color: PharmacyColors.whatsapp,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: PharmacyColors.text,
    paddingVertical: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    color: PharmacyColors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: PharmacyColors.textMuted,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  cardGradient: {
    position: 'relative',
  },
  medicalPattern: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    opacity: 0.1,
    zIndex: 1,
  },
  patternIcon: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: PharmacyColors.text,
    flex: 1,
    marginRight: 8,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productDescription: {
    color: PharmacyColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: PharmacyColors.textSecondary,
  },
  cartQuantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cartQuantityText: {
    fontSize: 11,
    color: PharmacyColors.textMuted,
    marginLeft: 4,
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonActive: {
    borderWidth: 1,
    borderColor: PharmacyColors.success,
  },
  addButtonLoading: {
    opacity: 0.8,
  },
  prescriptionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prescriptionText: {
    color: PharmacyColors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PharmacyColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PharmacyColors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: PharmacyColors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  clearSearchGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PharmacyProducts;