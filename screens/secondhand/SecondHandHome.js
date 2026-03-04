import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';
import Theme, { Colors, Components } from '../theme/Theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2;

const SecondHandHome = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('sellers');
  const [wantedPosts, setWantedPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    urgency: '',
    condition: '',
    minBudget: '',
    maxBudget: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Categories and options
  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Tools', 'Home & Garden', 'Automotive', 'Other'];
  const urgencyLevels = ['low', 'medium', 'high', 'urgent'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handleAuthError = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Auth error handling failed:', error);
    }
  };

  // Build query parameters
  const buildQueryParams = useCallback((page = 1, tab = activeTab) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);

    // For wanted posts
    if (tab === 'buyers') {
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
    }

    // For products
    if (tab === 'sellers') {
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    }

    return params.toString();
  }, [searchQuery, filters, activeTab]);

  // Fetch wanted posts
  const fetchWantedPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const queryParams = buildQueryParams(page, 'buyers');
      const { data } = await api.get(`/api/wanted/active?${queryParams}`);

      const newPosts = data.wantedPosts || [];

      setWantedPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Wanted fetch error:', err);
      Alert.alert('Error', 'Failed to fetch wanted posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // Fetch products
  const fetchProducts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const queryParams = buildQueryParams(page, 'sellers');
      const { data } = await api.get(`/api/marketplace/approved?${queryParams}`);

      const newProducts = data.products || [];

      setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Products fetch error:', err);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // WhatsApp Integration Functions
  const openWhatsApp = async (phoneNumber, message = '') => {
    if (!phoneNumber) {
      Alert.alert('Error', 'WhatsApp number not available');
      return;
    }

    // Clean phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Format for WhatsApp
    const whatsappNumber = cleanNumber.startsWith('0') ? `254${cleanNumber.substring(1)}` : cleanNumber;
    
    // Create message
    const defaultMessage = activeTab === 'sellers' 
      ? `Hello! I saw your product on Marketplace and I'm interested.`
      : `Hello! I saw your wanted post on Marketplace and I might have what you're looking for.`;
    
    const finalMessage = message || defaultMessage;
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web version
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get urgency color utility
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': return Colors.danger;
      case 'high': return Colors.warning;
      case 'medium': return Colors.secondary;
      case 'low': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  // Expandable Description Component
  const ExpandableDescription = ({ description, itemId, maxLines = 2 }) => {
    const isExpanded = expandedDescriptions[itemId] || false;
    const [showButton, setShowButton] = useState(false);

    const toggleExpanded = () => {
      setExpandedDescriptions(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
    };

    const onTextLayout = (event) => {
      const { lines } = event.nativeEvent;
      // Show "Show More" button if text exceeds maxLines
      setShowButton(lines.length > maxLines);
    };

    if (!description || description.trim() === '') {
      return null;
    }

    return (
      <View style={styles.descriptionContainer}>
        <Text 
          style={styles.description}
          numberOfLines={isExpanded ? undefined : maxLines}
          onTextLayout={onTextLayout}
        >
          {description}
        </Text>
        
        {showButton && (
          <TouchableOpacity 
            onPress={toggleExpanded}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Product Card Render Function (2-Column Grid)
  const renderProduct = ({ item }) => {
    const { image, name, price, category, condition, location, createdAt, sellerId, sellerWhatsApp } = item;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        activeOpacity={0.9}
      >
        {/* Image Container with Price Badge */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image 
              source={{ uri: image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubtext}>No Image</Text>
            </View>
          )}
          
          {/* Price Badge Overlay */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              Ksh {price?.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {name}
          </Text>

          {/* Seller Username */}
          {sellerId?.username && (
            <Text style={styles.sellerUsername}>
              @{sellerId.username}
            </Text>
          )}

          {/* Category and Condition Row */}
          <View style={styles.categoryRow}>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>
                {condition}
              </Text>
            </View>
          </View>

          {/* Location */}
          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}

          {/* Footer */}
          <View style={styles.productFooter}>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(createdAt)}
            </Text>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => openWhatsApp(sellerWhatsApp || sellerId?.phone)}
            >
              <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Wanted Card Render Function (Full Width)
  const renderWanted = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.wantedCard}
        activeOpacity={0.9}
      >
        {/* Header with Title and Urgency Badge */}
        <View style={styles.wantedHeader}>
          <Text style={styles.wantedTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.urgency && (
            <View style={[
              styles.urgencyBadge, 
              { backgroundColor: getUrgencyColor(item.urgency) + '20' }
            ]}>
              <Text style={[
                styles.urgencyText, 
                { color: getUrgencyColor(item.urgency) }
              ]}>
                {item.urgency.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Buyer Info Section */}
        <View style={styles.buyerInfo}>
          {item.buyerId?.username && (
            <Text style={styles.buyerUsername}>
              👤 @{item.buyerId.username}
            </Text>
          )}
          
          <Text style={styles.budget}>
            💰 Budget: Ksh {item.maxBudget?.toLocaleString()}
          </Text>
        </View>

        {/* Category with Icon */}
        <Text style={styles.wantedCategory}>
          📂 {item.category} • {item.preferredCondition}
        </Text>

        {/* Location */}
        {item.location && (
          <Text style={styles.wantedLocation}>
            📍 {item.location}
          </Text>
        )}

        {/* Expandable Description */}
        <ExpandableDescription 
          description={item.description} 
          itemId={item._id}
          maxLines={2}
        />

        {/* Footer with Divider */}
        <View style={styles.wantedFooter}>
          <Text style={styles.wantedTimeAgo}>
            {formatTimeAgo(item.createdAt)}
          </Text>
          
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => openWhatsApp(item.buyerId?.phone)}
          >
            <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filters
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <Text style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilters(prev => ({ ...prev, category: '' }))}
            style={[Components.chip, !filters.category && Components.chipActive]}
          >
            <Text style={[Components.chipText, !filters.category && Components.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilters(prev => ({ ...prev, category: cat }))}
              style={[Components.chip, filters.category === cat && Components.chipActive]}
            >
              <Text style={[Components.chipText, filters.category === cat && Components.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Budget/Price Range */}
        <Text style={styles.filterLabel}>
          {activeTab === 'buyers' ? 'Budget Range' : 'Price Range'}
        </Text>
        <View style={styles.priceRow}>
          <TextInput
            placeholder="Min" 
            placeholderTextColor={Colors.textSecondary}
            value={activeTab === 'buyers' ? filters.minBudget : filters.minPrice}
            onChangeText={(text) => setFilters(prev => ({ 
              ...prev, 
              [activeTab === 'buyers' ? 'minBudget' : 'minPrice']: text 
            }))}
            style={styles.priceInput}
            keyboardType="numeric"
          />
          <Text style={styles.priceSeparator}>to</Text>
          <TextInput
            placeholder="Max" 
            placeholderTextColor={Colors.textSecondary}
            value={activeTab === 'buyers' ? filters.maxBudget : filters.maxPrice}
            onChangeText={(text) => setFilters(prev => ({ 
              ...prev, 
              [activeTab === 'buyers' ? 'maxBudget' : 'maxPrice']: text 
            }))}
            style={styles.priceInput}
            keyboardType="numeric"
          />
        </View>

        {/* Urgency Filter (for buyers) */}
        {activeTab === 'buyers' && (
          <>
            <Text style={styles.filterLabel}>Urgency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, urgency: '' }))}
                style={[Components.chip, !filters.urgency && Components.chipActive]}
              >
                <Text style={[Components.chipText, !filters.urgency && Components.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {urgencyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setFilters(prev => ({ ...prev, urgency: level }))}
                  style={[Components.chip, filters.urgency === level && Components.chipActive]}
                >
                  <Text style={[Components.chipText, filters.urgency === level && Components.chipTextActive]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Condition Filter (for sellers) */}
        {activeTab === 'sellers' && (
          <>
            <Text style={styles.filterLabel}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, condition: '' }))}
                style={[Components.chip, !filters.condition && Components.chipActive]}
              >
                <Text style={[Components.chipText, !filters.condition && Components.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  onPress={() => setFilters(prev => ({ ...prev, condition }))}
                  style={[Components.chip, filters.condition === condition && Components.chipActive]}
                >
                  <Text style={[Components.chipText, filters.condition === condition && Components.chipTextActive]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Location Filter */}
        <Text style={styles.filterLabel}>Location</Text>
        <TextInput
          placeholder="Enter location"
          placeholderTextColor={Colors.textSecondary}
          value={filters.location}
          onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
          style={styles.locationInput}
        />

        {/* Clear Filters */}
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Load data when tab changes or search/filters change
  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'sellers') {
      fetchProducts(1, false);
    } else {
      fetchWantedPosts(1, false);
    }
  }, [activeTab, searchQuery, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      urgency: '',
      condition: '',
      minBudget: '',
      maxBudget: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  // Load more items
  const loadMore = useCallback(() => {
    if (hasMore && !loading && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      if (activeTab === 'sellers') {
        fetchProducts(nextPage, true);
      } else {
        fetchWantedPosts(nextPage, true);
      }
    }
  }, [hasMore, loading, currentPage, totalPages, activeTab, fetchProducts, fetchWantedPosts]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    if (activeTab === 'sellers') {
      fetchProducts(1, false);
    } else {
      fetchWantedPosts(1, false);
    }
  }, [activeTab, fetchProducts, fetchWantedPosts]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'sellers' ? 'No products found' : 'No requests found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SecondHandStack', { screen: 'MarketplaceDashboard' })}
          style={Components.buttonPrimary}
        >
          <Text style={Components.buttonTextPrimary}>Post Item ➕</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[Components.buttonSecondary, showFilters && { backgroundColor: Colors.primary }]}
        >
          <Text style={[Components.buttonTextSecondary, showFilters && { color: Colors.black }]}>
            Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('sellers')}
          style={[styles.tab, activeTab === 'sellers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'sellers' && styles.tabTextActive]}>
            For Sale
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('buyers')}
          style={[styles.tab, activeTab === 'buyers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'buyers' && styles.tabTextActive]}>
            On Demand
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && renderFilters()}

      {/* Content - Using conditional rendering instead of dynamic numColumns */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'sellers' ? (
          <FlatList
            key="sellers-list" // Unique key for sellers list
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={renderProduct}
            numColumns={2} // Fixed 2 columns for products
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        ) : (
          <FlatList
            key="buyers-list" // Unique key for buyers list
            data={wantedPosts}
            keyExtractor={(item) => item._id}
            renderItem={renderWanted}
            numColumns={1} // Fixed 1 column for wanted posts
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header Styles
  header: {
    ...Components.headerContainer,
    backgroundColor: Colors.primaryDark,
  },
  
  headerTitle: {
    ...Theme.Typography.h2,
    color: Colors.white,
  },

  // Search Container Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.Spacing.lg,
    paddingVertical: Theme.Spacing.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: Theme.Spacing.sm,
  },
  
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Theme.BorderRadius.md,
    paddingHorizontal: Theme.Spacing.md,
    paddingVertical: Theme.Spacing.sm,
  },
  
  searchIcon: {
    fontSize: 18,
    marginRight: Theme.Spacing.sm,
    color: Colors.textSecondary,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '400',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Theme.Spacing.lg,
    marginTop: Theme.Spacing.sm,
    marginBottom: Theme.Spacing.md,
    borderRadius: Theme.BorderRadius.md,
    padding: Theme.Spacing.xs,
  },
  
  tab: {
    flex: 1,
    paddingVertical: Theme.Spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.BorderRadius.sm,
  },
  
  tabActive: {
    backgroundColor: Colors.primary,
  },
  
  tabText: {
    ...Theme.Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  
  tabTextActive: {
    color: Colors.black,
    fontWeight: 'bold',
  },

  // Filters Panel Styles
  filtersContainer: {
    ...Components.card,
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.md,
    maxHeight: 300,
  },
  
  filterLabel: {
    ...Theme.Typography.h3,
    fontSize: 14,
    marginBottom: Theme.Spacing.sm,
    marginTop: Theme.Spacing.md,
  },
  
  filterRow: {
    marginBottom: Theme.Spacing.xs,
  },
  
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.Spacing.sm,
  },
  
  priceInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Theme.BorderRadius.sm,
    paddingHorizontal: Theme.Spacing.sm,
    paddingVertical: Theme.Spacing.xs,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  
  priceSeparator: {
    marginHorizontal: Theme.Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  locationInput: {
    ...Components.input,
    fontSize: 14,
    marginBottom: Theme.Spacing.xs,
  },
  
  clearButton: {
    ...Components.buttonPrimary,
    marginTop: Theme.Spacing.md,
    backgroundColor: Colors.danger,
  },
  
  clearButtonText: {
    ...Components.buttonTextPrimary,
  },

  // Content Styles
  content: {
    flex: 1,
  },
  
  listContainer: {
    paddingHorizontal: Theme.Spacing.md,
    paddingBottom: Theme.Spacing.lg,
  },

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Theme.Spacing.md,
  },

  // Product Card Styles (2-Column Grid)
  productCard: {
    ...Components.card,
    width: cardWidth,
  },

  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: Theme.BorderRadius.md,
    borderTopRightRadius: Theme.BorderRadius.md,
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    fontSize: 32,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  placeholderSubtext: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
  },

  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },

  priceText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: 'bold',
  },

  productInfo: {
    padding: Theme.Spacing.sm,
  },

  productName: {
    ...Theme.Typography.bodySmall,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 16,
  },

  sellerUsername: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  category: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  conditionBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  conditionText: {
    fontSize: 8,
    color: Colors.textTertiary,
    fontWeight: '600',
  },

  location: {
    fontSize: 9,
    color: Colors.success,
    marginBottom: 6,
    fontWeight: '500',
  },

  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },

  timeAgo: {
    fontSize: 9,
    color: Colors.textTertiary,
    flex: 1,
  },

  // WhatsApp Button Styles
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },

  whatsappButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Wanted Card Styles (Full Width)
  wantedCard: {
    ...Components.card,
    marginBottom: Theme.Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },

  wantedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.Spacing.sm,
  },

  wantedTitle: {
    ...Theme.Typography.h3,
    fontSize: 14,
    flex: 1,
    marginRight: Theme.Spacing.xs,
    lineHeight: 18,
  },

  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  urgencyText: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  buyerInfo: {
    marginBottom: Theme.Spacing.sm,
  },

  buyerUsername: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 2,
  },

  budget: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  wantedCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },

  wantedLocation: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '500',
    marginBottom: Theme.Spacing.sm,
  },

  // Description Styles
  descriptionContainer: {
    marginBottom: Theme.Spacing.sm,
  },

  description: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },

  showMoreButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },

  showMoreText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },

  wantedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.Spacing.xs,
    paddingTop: Theme.Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },

  wantedTimeAgo: {
    fontSize: 9,
    color: Colors.textTertiary,
    flex: 1,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.Spacing.xl,
  },
  
  loadingText: {
    ...Theme.Typography.body,
    color: Colors.textSecondary,
    marginTop: Theme.Spacing.sm,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.Spacing.xl,
    paddingHorizontal: Theme.Spacing.xl,
  },
  
  emptyTitle: {
    ...Theme.Typography.h3,
    marginBottom: Theme.Spacing.sm,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    ...Theme.Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SecondHandHome;