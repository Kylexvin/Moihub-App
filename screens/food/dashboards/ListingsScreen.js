import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import theme from '../../theme/Theme';

const baseURL = Platform.OS === 'ios' 
  ? 'http://localhost:5000' 
  : 'https://moihub.onrender.com';

const ListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchListings = useCallback(async (page = 1, shouldReset = false) => {
    try {
      if (page === 1) {
        shouldReset ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = pagination.limit;

      const rawParams = {
        page,
        limit,
        ...filters
      };

      const params = {};
      for (const key in rawParams) {
        if (
          rawParams[key] !== '' &&
          rawParams[key] !== null &&
          rawParams[key] !== undefined
        ) {
          params[key] = rawParams[key];
        }
      }

      const response = await axios.get(`${baseURL}/api/food/listings/vendor`, { params });

      const { listings: newListings, pagination: newPagination } = response.data;

      if (page === 1) {
        setListings(newListings);
      } else {
        setListings(prev => [...prev, ...newListings]);
      }

      setPagination(newPagination);
    } catch (error) {
      console.error('Error fetching listings:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch listings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchListings(1, true);
  }, [fetchListings]);

  const applyFilters = () => {
    setFilterModalVisible(false);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings(1);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const toggleListingStatus = async (listingId, currentStatus) => {
    try {
      await axios.patch(`${baseURL}/api/food/listings/${listingId}/toggle-status`);

      setListings(prev =>
        prev.map(listing =>
          listing._id === listingId
            ? { ...listing, isActive: !currentStatus }
            : listing
        )
      );

      Alert.alert(
        'Success',
        `Listing ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling listing status:', error);
      Alert.alert('Error', 'Failed to update listing status');
    }
  };

  const deleteListing = async (listingId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${baseURL}/api/food/listings/${listingId}`);
              setListings(prev => prev.filter(listing => listing._id !== listingId));
              Alert.alert('Success', 'Listing deleted successfully');
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  const loadMoreListings = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchListings(pagination.page + 1);
    }
  };

  const onRefresh = () => {
    fetchListings(1, true);
  };

  const navigateToAddListing = () => {
    navigation.navigate('AddListing');
  };

  const navigateToEditListing = (listing) => {
    navigation.navigate('EditListing', { listing });
  };

  const renderListingItem = ({ item }) => (
    <LinearGradient 
      colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
      style={styles.listingCard}
    >
      <View style={styles.listingImageContainer}>
        <Image
          source={{ uri: item.imageURL }}
          style={styles.listingImage}
          defaultSource={require('../../../assets/moihublogo.png')}
        />
        <LinearGradient
          colors={item.isActive ? [theme.Colors.success, theme.Colors.success + '80'] : [theme.Colors.danger, theme.Colors.danger + '80']}
          style={styles.statusBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.listingInfo}>
        <Text style={styles.listingName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listingPrice}>
          KES {item.price.toLocaleString()}
        </Text>
        <View style={styles.categoryContainer}>
          <Ionicons name="pricetag" size={12} color={theme.Colors.primary} />
          <Text style={styles.listingCategory}>
            {item.category}
          </Text>
        </View>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.listingActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleListingStatus(item._id, item.isActive)}
        >
          <LinearGradient
            colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
            style={styles.actionGradient}
          >
            <Ionicons
              name={item.isActive ? 'pause-circle' : 'play-circle'}
              size={20}
              color={item.isActive ? theme.Colors.danger : theme.Colors.success}
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToEditListing(item)}
        >
          <LinearGradient
            colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
            style={styles.actionGradient}
          >
            <Ionicons name="create" size={20} color={theme.Colors.info} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteListing(item._id)}
        >
          <LinearGradient
            colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
            style={styles.actionGradient}
          >
            <Ionicons name="trash" size={20} color={theme.Colors.danger} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="restaurant" size={64} color={theme.Colors.textSecondary} />
      </View>
      <Text style={styles.emptyStateText}>No listings yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Add your first listing to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToAddListing}
      >
        <LinearGradient
          colors={[theme.Colors.primary, theme.Colors.primaryDark]}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>Add Listing</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient 
          colors={['rgba(10,10,10,0.95)', theme.Colors.background]}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Listings</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterInputContainer}>
              <Ionicons name="search" size={16} color={theme.Colors.textSecondary} />
              <TextInput
                style={styles.filterInput}
                placeholder="Enter category"
                placeholderTextColor={theme.Colors.textTertiary}
                value={filters.category}
                onChangeText={(text) => setFilters(prev => ({ ...prev, category: text }))}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === '' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: '' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === '' && styles.filterOptionTextActive
                ]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === 'true' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: 'true' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === 'true' && styles.filterOptionTextActive
                ]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === 'false' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: 'false' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === 'false' && styles.filterOptionTextActive
                ]}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'createdAt' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'createdAt' && styles.filterOptionTextActive
                ]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'name' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'name' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'name' && styles.filterOptionTextActive
                ]}>Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'price' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'price' && styles.filterOptionTextActive
                ]}>Price</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <LinearGradient
                colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <LinearGradient
              colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
              style={styles.filterButtonGradient}
            >
              <Ionicons name="filter" size={18} color={theme.Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addListingButton}
            onPress={navigateToAddListing}
          >
            <LinearGradient
              colors={[theme.Colors.primary, theme.Colors.primaryDark]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={18} color={theme.Colors.black} />
              <Text style={styles.addButtonLabel}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
            colors={[theme.Colors.primary]}
          />
        }
        onEndReached={loadMoreListings}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.Colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={listings.length === 0 && styles.emptyContainer}
        showsVerticalScrollIndicator={false}
      />

      <FilterModal />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.cardBorder,
  },
  title: {
    ...theme.Typography.h2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
  },
  filterButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    padding: theme.Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListingButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.xs,
  },
  addButtonLabel: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.black,
    fontWeight: '600',
  },
  listingCard: {
    ...theme.Components.card,
    marginHorizontal: theme.Spacing.lg,
    marginVertical: theme.Spacing.sm,
    padding: theme.Spacing.md,
  },
  listingImageContainer: {
    position: 'relative',
    marginBottom: theme.Spacing.md,
  },
  listingImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusBadge: {
    position: 'absolute',
    top: theme.Spacing.sm,
    right: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.round,
  },
  statusText: {
    color: theme.Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  listingInfo: {
    marginBottom: theme.Spacing.md,
  },
  listingName: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.xs,
  },
  listingPrice: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
    fontWeight: '600',
    marginBottom: theme.Spacing.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.Spacing.xs,
  },
  listingCategory: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  listingDescription: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textTertiary,
    lineHeight: 18,
  },
  listingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.Spacing.sm,
  },
  actionButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: theme.Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
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
  emptyStateText: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.sm,
  },
  emptyStateSubtext: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
  },
  addButton: {
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
    width: '100%',
  },
  addButtonGradient: {
    paddingVertical: theme.Spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
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
    marginTop: theme.Spacing.md,
  },
  loadingMore: {
    padding: theme.Spacing.lg,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  modalTitle: {
    ...theme.Typography.h3,
  },
  filterSection: {
    marginBottom: theme.Spacing.lg,
  },
  filterLabel: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.sm,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: theme.Spacing.md,
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
    gap: theme.Spacing.sm,
  },
  filterInput: {
    flex: 1,
    ...theme.Typography.body,
    paddingVertical: theme.Spacing.sm,
    color: theme.Colors.text,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
  },
  filterOption: {
    flex: 1,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
  },
  filterOptionActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  filterOptionText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
  },
  filterOptionTextActive: {
    color: theme.Colors.black,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginTop: theme.Spacing.lg,
  },
  resetButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
  },
  resetButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: theme.Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
});

export default ListingsScreen;