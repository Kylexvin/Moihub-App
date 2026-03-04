// screens/food/OrderScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useFoodContext } from '../../context/FoodContext';
import * as foodApi from '../../services/foodApi';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Food-themed color palette matching other screens
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

const OrderScreen = () => {
  const navigation = useNavigation();
  const { 
    cart, 
    addToCart,              // ✅ Make sure addToCart is here!
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart,
    addRecentOrder 
  } = useFoodContext();
  
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState({});
  
  // Base URL configuration
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  // Fetch popular items from vendors in cart
  useEffect(() => {
    if (cart.length > 0) {
      fetchPopularItems();
    }
  }, [cart]);

  const fetchPopularItems = async () => {
    if (cart.length === 0) return;
    
    setLoadingPopular(true);
    try {
      // Get unique vendor IDs from cart
      const vendorIds = [...new Set(cart.map(item => item.vendorId))];
      
      // Fetch items from each vendor
      const popularPromises = vendorIds.map(async (vendorId) => {
        const response = await foodApi.fetchVendorListings(vendorId, 1);
        if (response.success) {
          // Get items not already in cart and mark as popular if they have high ratings or are featured
          const cartItemIds = new Set(cart.map(item => item._id));
          return response.listings
            .filter(item => !cartItemIds.has(item._id))
            .slice(0, 3) // Get top 3 items
            .map(item => ({
              ...item,
              vendorName: cart.find(c => c.vendorId === vendorId)?.vendorName,
              vendorId
            }));
        }
        return [];
      });

      const results = await Promise.all(popularPromises);
      const flatPopular = results.flat();
      setPopularItems(flatPopular);
    } catch (error) {
      console.error('Error fetching popular items:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  // Calculate the total price
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Group items by vendor
  const groupedByVendor = cart.reduce((groups, item) => {
    if (!groups[item.vendorId]) {
      groups[item.vendorId] = {
        vendorId: item.vendorId,
        shopName: item.vendorName,
        items: []
      };
    }
    groups[item.vendorId].items.push(item);
    return groups;
  }, {});
  
  const vendors = Object.values(groupedByVendor);

  const toggleVendorExpand = (vendorId) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            onPress: () => removeFromCart(item._id),
            style: 'destructive'
          }
        ]
      );
      return;
    }
    updateCartItemQuantity(item._id, newQuantity);
  };

  const handleAddPopularItem = (item) => {
    // ✅ Now addToCart is properly imported from useFoodContext
    const result = addToCart(item, 1);
    if (result.success) {
      Alert.alert(
        'Added! 🎉',
        `${item.name} added to your cart`,
        [{ text: 'OK' }]
      );
      // Refresh popular items to remove the one just added
      fetchPopularItems();
    }
  };

  // Create order function
  const createOrder = async (orderData) => {
    try {
      const response = await axios.post(`${baseURL}/api/food/orders`, orderData);
      return {
        success: true,
        order: response.data.order,
      };
    } catch (error) {
      console.error('Order API error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      };
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!deliveryInstructions.trim()) {
      Alert.alert('Missing Information', 'Please provide delivery instructions.');
      return;
    }

    setLoading(true);

    try {
      const successfulOrders = [];
      
      for (const vendor of vendors) {
        console.log('Processing order for vendor:', vendor.vendorId, vendor.shopName);
        
        const orderItems = vendor.items.map(item => ({
          listingId: item._id,
          quantity: item.quantity
        }));

        const orderData = {
          items: orderItems,
          vendorId: vendor.vendorId,
          deliveryInstructions: deliveryInstructions
        };

        console.log('Sending order data:', JSON.stringify(orderData));
        
        const response = await createOrder(orderData);
        console.log('Order API response:', JSON.stringify(response));
        
        if (!response.success) {
          throw new Error(response.message || `Failed to place order with ${vendor.shopName}`);
        }
        
        successfulOrders.push(response.order);
      }

      successfulOrders.forEach(order => addRecentOrder(order));
      
      clearCart();
      
      Alert.alert(
        'Order Placed! 🎉',
        'Your order has been placed and will be processed shortly.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyOrders') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Something went wrong. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <Animatable.View animation="fadeInLeft" duration={300}>
      <View style={styles.cartItem}>
        <Image 
          source={{ uri: item.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }} 
          style={styles.itemImage} 
        />
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>Ksh {item.price}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, item.quantity - 1)}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.quantityButtonGradient}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, item.quantity + 1)}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.quantityButtonGradient}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  const renderPopularItem = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={400}>
      <TouchableOpacity 
        style={styles.popularItemCard}
        onPress={() => handleAddPopularItem(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255,107,53,0.1)', 'rgba(247,195,92,0.05)']}
          style={styles.popularGradient}
        >
          <Image
            source={{ uri: item.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
            style={styles.popularImage}
          />
          <View style={styles.popularInfo}>
            <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.popularVendor}>{item.vendorName}</Text>
            <View style={styles.popularMeta}>
              <Text style={styles.popularPrice}>Ksh {item.price}</Text>
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={12} color={FoodColors.primary} />
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            </View>
          </View>
          <View style={styles.popularAdd}>
            <Ionicons name="add-circle" size={32} color={FoodColors.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderVendorGroup = ({ item: vendor }) => {
    const isExpanded = expandedVendors[vendor.vendorId] !== false;
    
    return (
      <Animatable.View animation="fadeInUp" duration={400}>
        <LinearGradient
          colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
          style={styles.vendorGroup}
        >
          <TouchableOpacity 
            style={styles.vendorHeader}
            onPress={() => toggleVendorExpand(vendor.vendorId)}
            activeOpacity={0.7}
          >
            <View style={styles.vendorHeaderLeft}>
              <View style={styles.vendorIconContainer}>
                <Ionicons name="restaurant" size={20} color={FoodColors.primary} />
              </View>
              <View>
                <Text style={styles.vendorName}>{vendor.shopName}</Text>
                <Text style={styles.vendorItemCount}>
                  {vendor.items.length} item{vendor.items.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={FoodColors.textSecondary} 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.vendorItems}>
              <FlatList
                data={vendor.items}
                renderItem={renderCartItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
              />
            </View>
          )}
        </LinearGradient>
      </Animatable.View>
    );
  };

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={FoodColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Clear Cart',
                'Remove all items from cart?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', onPress: clearCart, style: 'destructive' }
                ]
              );
            }}
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={20} color={FoodColors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Animatable.View animation="bounceIn" duration={1000}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>🛒</Text>
            </View>
          </Animatable.View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartText}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
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
        <>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart Items */}
            <View style={styles.cartSection}>
              {vendors.map(vendor => (
                <View key={vendor.vendorId}>
                  {renderVendorGroup({ item: vendor })}
                </View>
              ))}
            </View>

            {/* Popular Suggestions */}
            {popularItems.length > 0 && (
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <View style={styles.popularTitleContainer}>
                    <Ionicons name="flame" size={24} color={FoodColors.primary} />
                    <Text style={styles.popularTitle}>Popular Add-ons</Text>
                  </View>
                  <Text style={styles.popularSubtitle}>
                    Frequently ordered with your items
                  </Text>
                </View>

                {loadingPopular ? (
                  <ActivityIndicator size="small" color={FoodColors.primary} />
                ) : (
                  <FlatList
                    data={popularItems}
                    renderItem={renderPopularItem}
                    keyExtractor={item => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularList}
                  />
                )}
              </View>
            )}

            {/* Delivery Instructions */}
            <View style={styles.deliverySection}>
              <LinearGradient
                colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
                style={styles.deliveryCard}
              >
                <View style={styles.deliveryHeader}>
                  <Ionicons name="location-outline" size={20} color={FoodColors.primary} />
                  <Text style={styles.deliveryTitle}>Delivery Instructions</Text>
                </View>
                <TextInput
                  style={styles.deliveryInput}
                  placeholder="Room number, phone number, landmark..."
                  placeholderTextColor="#888"
                  value={deliveryInstructions}
                  onChangeText={setDeliveryInstructions}
                  multiline
                  numberOfLines={3}
                />
              </LinearGradient>
            </View>

            {/* Order Summary */}
            <View style={styles.summarySection}>
              <LinearGradient
                colors={['rgba(255,107,53,0.08)', 'rgba(247,195,92,0.03)']}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryTitle}>Order Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>Ksh {totalPrice}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>Free</Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>Ksh {totalPrice}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Place Order Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={placeOrder}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[FoodColors.primary, FoodColors.primary + 'dd']}
                style={styles.placeOrderGradient}
              >
                <View style={styles.placeOrderContent}>
                  <View>
                    <Text style={styles.placeOrderTotal}>Ksh {totalPrice}</Text>
                    <Text style={styles.placeOrderLabel}>Total</Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.placeOrderAction}>
                      <Text style={styles.placeOrderText}>Place Order</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,71,111,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  cartSection: {
    padding: 16,
    paddingTop: 8,
  },
  vendorGroup: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  vendorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: FoodColors.text,
    marginBottom: 2,
  },
  vendorItemCount: {
    fontSize: 12,
    color: FoodColors.textSecondary,
  },
  vendorItems: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,53,0.1)',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: FoodColors.text,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: FoodColors.primary,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: FoodColors.textSecondary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quantityButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
    color: FoodColors.text,
    fontWeight: '600',
  },
  popularSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  popularHeader: {
    marginBottom: 12,
  },
  popularTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FoodColors.text,
    marginLeft: 8,
  },
  popularSubtitle: {
    fontSize: 13,
    color: FoodColors.textSecondary,
  },
  popularList: {
    paddingRight: 16,
  },
  popularItemCard: {
    width: 240,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  popularGradient: {
    flexDirection: 'row',
    padding: 12,
  },
  popularImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 15,
    fontWeight: '600',
    color: FoodColors.text,
    marginBottom: 2,
  },
  popularVendor: {
    fontSize: 11,
    color: FoodColors.textSecondary,
    marginBottom: 4,
  },
  popularMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popularPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: FoodColors.primary,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    color: FoodColors.primary,
    marginLeft: 2,
    fontWeight: '600',
  },
  popularAdd: {
    justifyContent: 'center',
  },
  deliverySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  deliveryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: FoodColors.text,
    marginLeft: 8,
  },
  deliveryInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: FoodColors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: FoodColors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: FoodColors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: FoodColors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,107,53,0.1)',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: FoodColors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: FoodColors.primary,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.1)',
  },
  placeOrderButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: FoodColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  placeOrderGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  placeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeOrderTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  placeOrderLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  placeOrderAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  bottomPadding: {
    height: 20,
  },
  emptyCart: {
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
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FoodColors.primary,
    marginBottom: 8,
  },
  emptyCartText: {
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
});

export default OrderScreen;