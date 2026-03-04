// screens/eshop/OrdersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import theme from '../theme/Theme';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

// Modular Components
const Header = ({ navigation, title, username }) => (
  <LinearGradient
    colors={theme.Gradients.green}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={styles.headerButton}
    >
      <Icon name="arrow-back" size={24} color={theme.Colors.white} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>
      {username ? `📋 ${username}'s Orders` : title}
    </Text>
    <TouchableOpacity 
      onPress={() => navigation.navigate('EshopHome')}
      style={styles.headerButton}
    >
      <Icon name="home" size={22} color={theme.Colors.white} />
    </TouchableOpacity>
  </LinearGradient>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      pending: { color: theme.Colors.warning, icon: 'schedule', label: 'PENDING' },
      confirmed: { color: theme.Colors.info, icon: 'check-circle', label: 'CONFIRMED' },
      processing: { color: theme.Colors.accent, icon: 'settings', label: 'PROCESSING' },
      shipped: { color: theme.Colors.primary, icon: 'local-shipping', label: 'SHIPPED' },
      delivered: { color: theme.Colors.success, icon: 'done-all', label: 'DELIVERED' },
      cancelled: { color: theme.Colors.danger, icon: 'cancel', label: 'CANCELLED' },
    };
    return statusMap[status.toLowerCase()] || statusMap.pending;
  };

  const config = getStatusConfig(status);

  return (
    <LinearGradient
      colors={[config.color, `${config.color}dd`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statusBadge}
    >
      <Icon name={config.icon} size={14} color={theme.Colors.white} />
      <Text style={styles.statusText}>{config.label}</Text>
    </LinearGradient>
  );
};

const OrderItemCard = ({ item, isExpanded, onToggle, navigation }) => {
  const formatPrice = (price) => `KSh ${price.toLocaleString()}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewProduct = (product) => {
    navigation.navigate('ProductDetail', {
      productId: product._id,
      productName: product.name,
    });
  };

  const handleTrackOrder = () => {
    Alert.alert('Track Order', 'Tracking feature coming soon!');
  };

  const handleContactShop = () => {
    Alert.alert('Contact Shop', `Contact ${item.shop.shopName} coming soon!`);
  };

  return (
    <View style={[theme.Components.card, styles.orderCard]}>
      <TouchableOpacity
        style={styles.orderHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.orderInfo}>
          <View style={styles.orderMeta}>
            <Text style={[theme.Typography.h3, styles.orderId]}>#{item._id.slice(-8)}</Text>
            <Text style={[theme.Typography.caption, styles.orderDate]}>{formatDate(item.createdAt)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.shopInfo}
            onPress={() => navigation.navigate('ShopProducts', {
              shopId: item.shop._id,
              shopName: item.shop.shopName,
            })}
          >
            <Icon name="store" size={14} color={theme.Colors.primary} />
            <Text style={[theme.Typography.bodySmall, styles.shopName]}>{item.shop.shopName}</Text>
            <Icon name="chevron-right" size={16} color={theme.Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.orderSummary}>
            <Text style={[theme.Typography.caption, styles.itemCount]}>
              {item.items.length} item{item.items.length !== 1 ? 's' : ''}
            </Text>
            <Text style={[theme.Typography.h3, styles.totalAmount]}>{formatPrice(item.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.orderRight}>
          <StatusBadge status={item.status} />
          <Icon 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={theme.Colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.orderDetails}>
          <View style={styles.divider} />
          
          {/* Items Section */}
          <View style={styles.detailSection}>
            <Text style={[theme.Typography.bodySmall, styles.sectionTitle]}>
              <Icon name="shopping-bag" size={16} color={theme.Colors.primary} /> ITEMS ORDERED
            </Text>
            {item.items.map((orderItem, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.itemRow}
                onPress={() => handleViewProduct(orderItem.product)}
              >
                <Image
                  source={{ uri: orderItem.product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.itemDetails}>
                  <Text style={[theme.Typography.body, styles.productName]} numberOfLines={2}>
                    {orderItem.product.name}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={[theme.Typography.caption, styles.quantity]}>
                      Qty: {orderItem.quantity}
                    </Text>
                    <Text style={[theme.Typography.bodySmall, styles.price]}>
                      {formatPrice(orderItem.price)}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={theme.Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Shipping Section */}
          <View style={styles.detailSection}>
            <Text style={[theme.Typography.bodySmall, styles.sectionTitle]}>
              <Icon name="local-shipping" size={16} color={theme.Colors.primary} /> SHIPPING DETAILS
            </Text>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={16} color={theme.Colors.primary} />
              <Text style={[theme.Typography.bodySmall, styles.infoText]}>{item.shippingAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="phone" size={16} color={theme.Colors.primary} />
              <Text style={[theme.Typography.bodySmall, styles.infoText]}>{item.contactNumber}</Text>
            </View>
          </View>

          {/* Summary Section */}
          <LinearGradient
            colors={[theme.Colors.primaryLight, 'rgba(80, 200, 120, 0.02)']}
            style={styles.summarySection}
          >
            <View style={styles.summaryRow}>
              <Text style={[theme.Typography.caption, styles.summaryLabel]}>Subtotal</Text>
              <Text style={[theme.Typography.body, styles.summaryValue]}>{formatPrice(item.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[theme.Typography.caption, styles.summaryLabel]}>Shipping</Text>
              <Text style={[theme.Typography.body, styles.summaryValue]}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[theme.Typography.h3, styles.totalLabel]}>Total</Text>
              <Text style={[theme.Typography.h2, styles.totalValue]}>{formatPrice(item.totalAmount)}</Text>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleTrackOrder}
            >
              <LinearGradient
                colors={[theme.Colors.info, '#2980b9']}
                style={styles.actionButtonGradient}
              >
                <Icon name="track-changes" size={18} color={theme.Colors.white} />
                <Text style={[theme.Typography.button, styles.actionButtonText]}>Track</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleContactShop}
            >
              <LinearGradient
                colors={[theme.Colors.accent, '#7d5ba6']}
                style={styles.actionButtonGradient}
              >
                <Icon name="message" size={18} color={theme.Colors.white} />
                <Text style={[theme.Typography.button, styles.actionButtonText]}>Contact</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ShopProducts', {
                shopId: item.shop._id,
                shopName: item.shop.shopName,
              })}
            >
              <LinearGradient
                colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                style={styles.actionButtonGradient}
              >
                <Icon name="shopping-cart" size={18} color={theme.Colors.white} />
                <Text style={[theme.Typography.button, styles.actionButtonText]}>Shop Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Reorder Button */}
          {item.status.toLowerCase() === 'delivered' && (
            <TouchableOpacity 
              style={styles.reorderButton}
              onPress={() => {
                Alert.alert('Reorder', 'Add all items to cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reorder', 
                    onPress: () => navigation.navigate('Cart')
                  }
                ]);
              }}
            >
              <LinearGradient
                colors={[theme.Colors.success, theme.Colors.primary]}
                style={styles.reorderGradient}
              >
                <Icon name="refresh" size={20} color={theme.Colors.white} />
                <Text style={[theme.Typography.button, styles.reorderText]}>Reorder All Items</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const EmptyState = ({ navigation }) => (
  <LinearGradient
    colors={[theme.Colors.primaryDark, theme.Colors.background]}
    style={styles.emptyState}
  >
    <View style={[styles.emptyIconContainer, { backgroundColor: theme.Colors.primaryLight }]}>
      <Icon name="shopping-bag" size={64} color={theme.Colors.primary} />
    </View>
    <Text style={[theme.Typography.h2, styles.emptyTitle]}>No Orders Yet</Text>
    <Text style={[theme.Typography.body, styles.emptyMessage]}>
      Your orders will appear here once you start shopping at our stores.
    </Text>
    
    <TouchableOpacity 
      style={styles.shopButton}
      onPress={() => navigation.navigate('EshopHome')}
    >
      <LinearGradient
        colors={[theme.Colors.primary, theme.Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <Text style={[theme.Typography.button, styles.shopButtonText]}>Browse Shops</Text>
        <Icon name="arrow-forward" size={20} color={theme.Colors.white} />
      </LinearGradient>
    </TouchableOpacity>

  </LinearGradient>
);

const LoadingFooter = () => (
  <View style={styles.loadingFooter}>
    <ActivityIndicator size="small" color={theme.Colors.primary} />
    <Text style={[theme.Typography.caption, styles.loadingText]}>Loading more orders...</Text>
  </View>
);

// Main Component
const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated, token, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders();
    } else {
      navigation.replace('Login');
    }
  }, [isAuthenticated, token]);

  const fetchOrders = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(
        `${API_URL}/eshop/orders/my-orders?page=${page}&limit=10`
      );
      
      const data = response.data;
      
      if (data.success) {
        if (page === 1 || isRefresh) {
          setOrders(data.data);
        } else {
          setOrders(prev => [...prev, ...data.data]);
        }
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, true);
  };

  const loadMoreOrders = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchOrders(currentPage + 1);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          navigation={navigation} 
          title="My Orders" 
          username={currentUser?.username}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={[theme.Typography.body, styles.loadingMainText]}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        navigation={navigation} 
        title="My Orders" 
        username={currentUser?.username}
      />
      
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderItemCard
            item={item}
            isExpanded={expandedOrders.has(item._id)}
            onToggle={() => toggleOrderExpansion(item._id)}
            navigation={navigation}
          />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
            colors={[theme.Colors.primary]}
          />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.1}
        ListFooterComponent={loadingMore ? <LoadingFooter /> : null}
        ListEmptyComponent={<EmptyState navigation={navigation} />}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.cardBorder,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.Colors.white,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: theme.Spacing.md,
    paddingBottom: theme.Spacing.xl,
  },
  orderCard: {
    marginBottom: theme.Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    padding: theme.Spacing.md,
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.xs,
  },
  orderId: {
    color: theme.Colors.white,
    fontSize: 16,
  },
  orderDate: {
    color: theme.Colors.textSecondary,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.xs,
  },
  shopName: {
    color: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
    marginRight: theme.Spacing.xs,
    fontWeight: '500',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    color: theme.Colors.textSecondary,
  },
  totalAmount: {
    color: theme.Colors.primary,
  },
  orderRight: {
    alignItems: 'flex-end',
    marginLeft: theme.Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.round,
    marginBottom: theme.Spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.Colors.white,
    marginLeft: theme.Spacing.xs,
    letterSpacing: 0.5,
  },
  orderDetails: {
    padding: theme.Spacing.md,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: theme.Colors.cardBorder,
    marginBottom: theme.Spacing.md,
  },
  detailSection: {
    marginBottom: theme.Spacing.lg,
  },
  sectionTitle: {
    color: theme.Colors.primary,
    marginBottom: theme.Spacing.sm,
    letterSpacing: 1,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: theme.Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.xs,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: theme.BorderRadius.sm,
    marginRight: theme.Spacing.sm,
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    color: theme.Colors.white,
    marginBottom: theme.Spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    color: theme.Colors.textSecondary,
  },
  price: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.sm,
  },
  infoText: {
    color: theme.Colors.text,
    marginLeft: theme.Spacing.sm,
    flex: 1,
  },
  summarySection: {
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.md,
    marginTop: theme.Spacing.xs,
    marginBottom: theme.Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.xs,
  },
  summaryLabel: {
    color: theme.Colors.textSecondary,
  },
  summaryValue: {
    color: theme.Colors.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: theme.Spacing.xs,
    paddingTop: theme.Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.cardBorder,
  },
  totalLabel: {
    color: theme.Colors.white,
  },
  totalValue: {
    color: theme.Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.xs,
  },
  actionButtonText: {
    color: theme.Colors.white,
    fontSize: 12,
  },
  reorderButton: {
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
  },
  reorderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.xs,
  },
  reorderText: {
    color: theme.Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMainText: {
    marginTop: theme.Spacing.sm,
    color: theme.Colors.textSecondary,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.Spacing.lg,
  },
  loadingText: {
    color: theme.Colors.textSecondary,
    marginLeft: theme.Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
    minHeight: 500,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  emptyTitle: {
    color: theme.Colors.white,
    marginBottom: theme.Spacing.sm,
  },
  emptyMessage: {
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.Spacing.xl,
  },
  shopButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
    width: '100%',
    marginBottom: theme.Spacing.sm,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.lg,
    gap: theme.Spacing.xs,
  },
  shopButtonText: {
    color: theme.Colors.white,
  },
  exploreButton: {
    paddingVertical: theme.Spacing.sm,
  },
  exploreButtonText: {
    color: theme.Colors.primary,
    fontWeight: '500',
  },
});

export default OrdersScreen;