// screens/eshop/EshopHomeScreen.js
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
  Dimensions,
  ScrollView,
  Linking,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme/Theme';

const { width } = Dimensions.get('window');

const EshopHomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://moihub.onrender.com/api/eshop/vendor/categories');
      const data = await response.json();
        
      if (data.success) {
        setCategories(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryShops', {
      categorySlug: category.slug,
      categoryName: category.name,
      categoryId: category._id,
    });
  };

  const handleWhatsAppPress = () => {
    const phoneNumber = '+254768610613';        
    const message = 'Hi! I need help with the E-Shop in Moihub app.';
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl)
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Unable to open WhatsApp. Please make sure it is installed.');
      });
  };

  const handleMyOrdersPress = () => {
    navigation.navigate('Orders');
  };

  const handleOnboardingPress = () => {
    navigation.navigate('OnboardingNavigator');
  };

  const getIconName = (categoryName) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('boutique') || name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) {
      return 'checkroom';
    }
    if (name.includes('gift') || name.includes('accessories') || name.includes('jewelry')) {
      return 'card-giftcard';
    }
    if (name.includes('food') || name.includes('restaurant') || name.includes('cafe') || name.includes('kitchen')) {
      return 'restaurant';
    }
    if (name.includes('electronics') || name.includes('gadgets') || name.includes('tech') || name.includes('devices')) {
      return 'devices';
    }
    if (name.includes('home') || name.includes('furniture') || name.includes('decor')) {
      return 'home';
    }
    if (name.includes('pharmacy') || name.includes('medical') || name.includes('health') || name.includes('medicine')) {
      return 'local-pharmacy';
    }
    if (name.includes('mali') || name.includes('general') || name.includes('variety') || name.includes('convenience')) {
      return 'store';
    }
    if (name.includes('beauty') || name.includes('cosmetics') || name.includes('salon')) {
      return 'face';
    }
    if (name.includes('sports') || name.includes('fitness') || name.includes('gym')) {
      return 'fitness-center';
    }
    if (name.includes('books') || name.includes('stationery') || name.includes('education')) {
      return 'menu-book';
    }
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) {
      return 'directions-car';
    }
    if (name.includes('pet') || name.includes('animal')) {
      return 'pets';
    }
    if (name.includes('toy') || name.includes('kids') || name.includes('children')) {
      return 'toys';
    }
    if (name.includes('flower') || name.includes('garden') || name.includes('plant')) {
      return 'local-florist';
    }
    if (name.includes('shoe') || name.includes('footwear')) {
      return 'shopping-bag';
    }
    
    return 'storefront';
  };

  const renderQuickActions = () => (
    <LinearGradient
      colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
      style={styles.quickActionsContainer}
    >
      <View style={styles.quickActionsRow}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Icon name="receipt-long" size={24} color={theme.Colors.primary} />
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-cart" size={24} color={theme.Colors.primary} />
          <Text style={styles.quickActionText}>Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={handleWhatsAppPress}
        >
          <Icon name="chat" size={24} color={theme.Colors.primary} />
          <Text style={styles.quickActionText}>Support</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderCategoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: getCategoryColor(index) }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryIconContainer}>
        <Icon
          name={getIconName(item.name)}
          size={32}
          color="#fff"
        />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDescription} numberOfLines={2}>
        {item.description || 'Explore our collection'}
      </Text>
      <View style={styles.categoryFooter}>
        <Icon name="arrow-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const getCategoryColor = (index) => {
    const emeraldColors = [
      theme.Colors.primary,
      theme.Colors.primaryDark,
      '#065f46',
      '#10b981',
      '#34d399',
      '#6ee7b7',
      '#0d9488',
      '#0f766e',
      theme.Colors.primary,
      theme.Colors.primaryDark,
      '#065f46',
      '#10b981',
      '#34d399',
      '#6ee7b7',
      '#0d9488',
      '#0f766e',
    ];
    return emeraldColors[index % emeraldColors.length];
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading your shopping experience...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.Colors.primary]}
              tintColor={theme.Colors.primary}
            />
          }
        >
          {/* Header */}
          <LinearGradient
            colors={[theme.Colors.primary, theme.Colors.primaryDark]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Discover Amazing Deals</Text>
            <Text style={styles.headerSubtitle}>Shop from trusted vendors</Text>
          </LinearGradient>

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            {categories.length > 0 ? (
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={styles.categoriesContainer}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="storefront" size={60} color={theme.Colors.textSecondary} />
                </View>
                <Text style={styles.emptyText}>No categories available</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
                  <LinearGradient
                    colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                    style={styles.retryGradient}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Want Your Shop Here Section */}
          <View style={styles.shopHereSection}>
            <TouchableOpacity 
              style={styles.shopHereCard}
              onPress={handleOnboardingPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                style={styles.shopHereGradient}
              >
                <Icon name="store" size={40} color={theme.Colors.primary} />
                <View style={styles.shopHereContent}>
                  <Text style={styles.shopHereTitle}>Want Your Shop Here?</Text>
                  <Text style={styles.shopHereSubtitle}>
                    Join our marketplace and start selling to thousands of customers
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color={theme.Colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating My Orders Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={handleMyOrdersPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.Colors.primary, theme.Colors.primaryDark]}
            style={styles.floatingButtonGradient}
          >
            <Icon name="receipt-long" size={24} color={theme.Colors.black} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    marginTop: theme.Spacing.md,
  },
  header: {
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    ...theme.Typography.h1,
    color: theme.Colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...theme.Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: theme.Spacing.xs,
  },
  quickActionsContainer: {
    ...theme.Components.card,
    marginHorizontal: theme.Spacing.lg,
    marginTop: -30,
    marginBottom: theme.Spacing.lg,
    padding: theme.Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: theme.Spacing.sm,
  },
  quickActionText: {
    ...theme.Typography.caption,
    color: theme.Colors.text,
    marginTop: theme.Spacing.xs,
  },
  categoriesSection: {
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  sectionTitle: {
    ...theme.Typography.h2,
    marginBottom: theme.Spacing.lg,
  },
  categoriesContainer: {
    paddingBottom: theme.Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.md,
  },
  categoryCard: {
    width: (width - 56) / 2,
    borderRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.md,
    alignItems: 'center',
    ...theme.Shadows.medium,
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
  },
  categoryName: {
    ...theme.Typography.body,
    fontWeight: 'bold',
    color: theme.Colors.white,
    textAlign: 'center',
    marginBottom: theme.Spacing.xs,
  },
  categoryDescription: {
    ...theme.Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: theme.Spacing.sm,
    lineHeight: 16,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.Spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  emptyText: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.lg,
  },
  retryButton: {
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: theme.Spacing.xl,
    paddingVertical: theme.Spacing.md,
  },
  retryText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  shopHereSection: {
    marginHorizontal: theme.Spacing.lg,
    marginBottom: 100,
  },
  shopHereCard: {
    borderRadius: theme.BorderRadius.lg,
    overflow: 'hidden',
  },
  shopHereGradient: {
    ...theme.Components.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.Spacing.lg,
  },
  shopHereContent: {
    flex: 1,
    marginLeft: theme.Spacing.md,
    marginRight: theme.Spacing.sm,
  },
  shopHereTitle: {
    ...theme.Typography.body,
    fontWeight: 'bold',
    color: theme.Colors.text,
    marginBottom: 2,
  },
  shopHereSubtitle: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    lineHeight: 18,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    ...theme.Shadows.large,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EshopHomeScreen;