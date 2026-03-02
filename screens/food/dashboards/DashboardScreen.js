import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import theme from '../../theme/Theme';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [statusAnim] = useState(new Animated.Value(1));
  const [vendorInfo, setVendorInfo] = useState(null);

  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  const checkSubscriptionStatus = (subscriptionEndDate) => {
    if (!subscriptionEndDate) return true;
    const today = new Date();
    const endDate = new Date(subscriptionEndDate);
    return today > endDate;
  };

  const getDaysRemaining = (subscriptionEndDate) => {
    if (!subscriptionEndDate) return 0;
    const today = new Date();
    const endDate = new Date(subscriptionEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const handleContactAdmin = () => {
    const phoneNumber = '0768610613';
    const shopName = vendorInfo?.shopName || dashboardData?.vendor?.shopName || 'My Shop';
    const message = `Hello, my subscription has expired. Shop: ${shopName}. Please help me renew it.`;
    
    Alert.alert(
      'Contact Admin',
      'Choose how to contact the admin:',
      [
        {
          text: '📞 Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        },
        {
          text: '💬 WhatsApp',
          onPress: () => Linking.openURL(`whatsapp://send?phone=254768610613&text=${encodeURIComponent(message)}`)
        },
        {
          text: '✉️ SMS',
          onPress: () => Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await axios.get(`${baseURL}/api/food/vendors/dashboard`);

      if (response.data && response.data.data) {
        const data = response.data.data;
        setDashboardData(data);
        
        if (data.vendor) {
          setVendorInfo(data.vendor);
        }
        
        const isExpired = checkSubscriptionStatus(data.vendor?.subscriptionEndDate);
        setSubscriptionExpired(isExpired);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const toggleShopStatus = async () => {
    if (subscriptionExpired) {
      Alert.alert(
        'Subscription Expired',
        'Please renew your subscription to manage shop status.',
        [
          { text: 'Contact Admin', onPress: handleContactAdmin },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    Animated.sequence([
      Animated.timing(statusAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(statusAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const newStatus = !dashboardData.vendor.isOpen;
      
      setDashboardData(prev => ({
        ...prev,
        vendor: { ...prev.vendor, isOpen: newStatus }
      }));

      await axios.patch(
        `${baseURL}/api/food/vendors/toggle-status`,
        { isOpen: newStatus }
      );
    } catch (err) {
      setDashboardData(prev => ({
        ...prev,
        vendor: { ...prev.vendor, isOpen: !dashboardData.vendor.isOpen }
      }));
      
      Alert.alert('Error', 'Failed to update shop status');
    }
  };

  // Navigation handlers - ONLY to screens that exist
  const navigateToOrders = () => {
    if (subscriptionExpired) {
      handleContactAdmin();
      return;
    }
    navigation.navigate('Orders');
  };

  const navigateToListings = () => {
    if (subscriptionExpired) {
      handleContactAdmin();
      return;
    }
    navigation.navigate('Listings');
  };

  const navigateToProfile = () => {
    if (subscriptionExpired) {
      handleContactAdmin();
      return;
    }
    navigation.navigate('Profile');
  };

  const navigateToSettings = () => {
    if (subscriptionExpired) {
      handleContactAdmin();
      return;
    }
    navigation.navigate('Settings');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const safeData = {
    activeOrders: dashboardData?.activeOrders ?? 0,
    totalOrders: dashboardData?.totalOrders ?? 0,
    totalSales: dashboardData?.totalSales ?? 0,
    vendor: {
      id: dashboardData?.vendor?.id ?? null,
      shopName: dashboardData?.vendor?.shopName ?? 'Shop Name',
      location: dashboardData?.vendor?.location ?? 'Location not set',
      phone: dashboardData?.vendor?.phone ?? 'Phone not set',
      description: dashboardData?.vendor?.description ?? 'No description available',
      isOpen: dashboardData?.vendor?.isOpen ?? false,
      isApproved: dashboardData?.vendor?.isApproved ?? false,
      isActive: dashboardData?.vendor?.isActive ?? false,
      subscriptionEndDate: dashboardData?.vendor?.subscriptionEndDate ?? null,
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
          <Text style={styles.loadingSubText}>Please wait a moment</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.Colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <LinearGradient colors={[theme.Colors.primary, theme.Colors.primaryDark]} style={styles.retryGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (subscriptionExpired) {
    const expiryDate = safeData.vendor.subscriptionEndDate 
      ? new Date(safeData.vendor.subscriptionEndDate).toLocaleDateString()
      : 'Date not available';

    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.expiredContainer}>
        <ScrollView 
          contentContainerStyle={styles.expiredContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.expiredCard}>
            <View style={styles.expiredIconContainer}>
              <Ionicons name="time" size={64} color={theme.Colors.danger} />
            </View>
            
            <Text style={styles.expiredTitle}>Subscription Expired</Text>
            
            <View style={styles.shopInfoCard}>
              <Ionicons name="storefront" size={24} color={theme.Colors.primary} />
              <Text style={styles.shopInfoName}>{safeData.vendor.shopName}</Text>
            </View>
            
            <View style={styles.expiredInfoCard}>
              <Text style={styles.expiredMessage}>
                Your subscription ended on{' '}
                <Text style={styles.expiredDate}>
                  {expiryDate}
                </Text>
              </Text>
              <Text style={styles.expiredSubMessage}>
                Contact admin to renew and continue using all features
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactAdmin}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={[theme.Colors.primary, theme.Colors.primaryDark]} 
                style={styles.contactGradient}
              >
                <Ionicons name="chatbubbles-outline" size={20} color={theme.Colors.black} />
                <Text style={styles.contactButtonText}>Contact Admin</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.adminContactInfo}>
              <View style={styles.adminContactItem}>
                <Ionicons name="call-outline" size={16} color={theme.Colors.primary} />
                <Text style={styles.adminNumber}>0768 610 613</Text>
              </View>
              <View style={styles.adminContactItem}>
                <Ionicons name="logo-whatsapp" size={16} color={theme.Colors.primary} />
                <Text style={styles.adminNumber}>WhatsApp</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchDashboardData}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.Colors.primary} />
              <Text style={styles.refreshButtonText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const daysRemaining = getDaysRemaining(safeData.vendor.subscriptionEndDate);

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
            colors={[theme.Colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.shopName}>{safeData.vendor.shopName}</Text>
          </View>
          
          <Animated.View style={{ transform: [{ scale: statusAnim }] }}>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                { backgroundColor: safeData.vendor.isOpen ? theme.Colors.success : theme.Colors.danger }
              ]}
              onPress={toggleShopStatus}
              activeOpacity={0.8}
            >
              <View style={[styles.statusDot, { backgroundColor: theme.Colors.white }]} />
              <Text style={styles.statusText}>
                {safeData.vendor.isOpen ? 'Open' : 'Closed'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Subscription Warning */}
        {daysRemaining <= 7 && daysRemaining > 0 && (
          <TouchableOpacity 
            style={styles.warningCard} 
            onPress={handleContactAdmin} 
            activeOpacity={0.9}
          >
            <View style={styles.warningContent}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="alert-circle" size={24} color={theme.Colors.warning} />
              </View>
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Subscription ending soon</Text>
                <Text style={styles.warningDays}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={navigateToOrders}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                  <Ionicons name="timer" size={24} color={theme.Colors.warning} />
                </View>
                <Text style={styles.statNumber}>{safeData.activeOrders}</Text>
                <Text style={styles.statLabel}>Active Orders</Text>
                <Text style={styles.trendText}>Tap to view</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={navigateToOrders}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                  <Ionicons name="receipt" size={24} color={theme.Colors.info} />
                </View>
                <Text style={styles.statNumber}>{safeData.totalOrders}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.trendText}>Tap to view</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.salesCard}>
            <View style={styles.salesHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(80, 200, 120, 0.2)' }]}>
                <Ionicons name="wallet" size={24} color={theme.Colors.primary} />
              </View>
              <View style={styles.salesAmount}>
                <Text style={styles.salesNumber}>KSh {safeData.totalSales.toLocaleString()}</Text>
                <Text style={styles.salesLabel}>Total Revenue</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Business Info Card */}
        <LinearGradient 
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
          style={styles.infoCard}
        >
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Business Information</Text>
            <TouchableOpacity onPress={navigateToProfile}>
              <Ionicons name="create-outline" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={18} color={theme.Colors.primary} />
              <View style={styles.infoItemContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{safeData.vendor.location}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="call" size={18} color={theme.Colors.primary} />
              <View style={styles.infoItemContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{safeData.vendor.phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>About</Text>
            <Text style={styles.descriptionText}>{safeData.vendor.description}</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: safeData.vendor.isApproved ? theme.Colors.success : theme.Colors.danger }]} />
              <Text style={styles.statusChipText}>
                {safeData.vendor.isApproved ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>

            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: safeData.vendor.isActive ? theme.Colors.success : theme.Colors.danger }]} />
              <Text style={styles.statusChipText}>
                {safeData.vendor.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {safeData.vendor.subscriptionEndDate && (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="calendar" size={16} color={theme.Colors.textSecondary} />
                <Text style={styles.subscriptionLabel}>Subscription</Text>
              </View>
              
              <View style={styles.subscriptionContent}>
                <View>
                  <Text style={styles.subscriptionDate}>
                    {new Date(safeData.vendor.subscriptionEndDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.subscriptionRemaining}>
                    {daysRemaining} days remaining
                  </Text>
                </View>
                
                {daysRemaining <= 7 && (
                  <TouchableOpacity style={styles.renewButton} onPress={handleContactAdmin}>
                    <Text style={styles.renewButtonText}>Renew</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Quick Actions - ONLY to screens that exist */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToListings}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
                style={styles.actionGradient}
              >
                <Ionicons name="restaurant" size={24} color={theme.Colors.primary} />
                <Text style={styles.actionText}>Listings</Text>
                <Text style={styles.actionSubtext}>Manage</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToOrders}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
                style={styles.actionGradient}
              >
                <Ionicons name="receipt" size={24} color={theme.Colors.primary} />
                <Text style={styles.actionText}>Orders</Text>
                <Text style={styles.actionSubtext}>Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToProfile}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
                style={styles.actionGradient}
              >
                <Ionicons name="person" size={24} color={theme.Colors.primary} />
                <Text style={styles.actionText}>Profile</Text>
                <Text style={styles.actionSubtext}>Info</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
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
    ...theme.Typography.h3,
    marginTop: theme.Spacing.lg,
  },
  loadingSubText: {
    ...theme.Typography.caption,
    marginTop: theme.Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
  },
  errorCard: {
    ...theme.Components.card,
    alignItems: 'center',
    padding: theme.Spacing.xl,
    width: '100%',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  errorTitle: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.sm,
  },
  errorText: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
  },
  retryButton: {
    width: '100%',
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingVertical: theme.Spacing.md,
    alignItems: 'center',
  },
  retryButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  expiredContainer: {
    flex: 1,
  },
  expiredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.Spacing.xl,
  },
  expiredCard: {
    ...theme.Components.card,
    alignItems: 'center',
    padding: theme.Spacing.xl,
  },
  expiredIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  expiredTitle: {
    ...theme.Typography.h2,
    color: theme.Colors.danger,
    marginBottom: theme.Spacing.md,
  },
  shopInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.round,
    marginBottom: theme.Spacing.lg,
    gap: theme.Spacing.sm,
  },
  shopInfoName: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  expiredInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.lg,
    marginBottom: theme.Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  expiredMessage: {
    ...theme.Typography.body,
    textAlign: 'center',
    marginBottom: theme.Spacing.sm,
  },
  expiredDate: {
    color: theme.Colors.primary,
    fontWeight: 'bold',
  },
  expiredSubMessage: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
  },
  contactButton: {
    width: '100%',
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.Spacing.md,
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  contactButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  adminContactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.Spacing.xl,
    marginBottom: theme.Spacing.xl,
  },
  adminContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  adminNumber: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
  },
  refreshButtonText: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingTop: theme.Spacing.xl,
    paddingBottom: theme.Spacing.lg,
  },
  greeting: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.xs,
  },
  shopName: {
    ...theme.Typography.h2,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.round,
    gap: theme.Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.white,
    fontWeight: '600',
  },
  warningCard: {
    ...theme.Components.card,
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
    padding: theme.Spacing.md,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
  },
  warningDays: {
    ...theme.Typography.body,
    color: theme.Colors.warning,
    fontWeight: '600',
  },
  statsGrid: {
    paddingHorizontal: theme.Spacing.lg,
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardGradient: {
    ...theme.Components.card,
    padding: theme.Spacing.md,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  statNumber: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.xs,
  },
  statLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.xs,
  },
  trendText: {
    ...theme.Typography.caption,
    color: theme.Colors.primary,
  },
  salesCard: {
    ...theme.Components.card,
    padding: theme.Spacing.md,
  },
  salesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  salesAmount: {
    flex: 1,
  },
  salesNumber: {
    ...theme.Typography.h2,
    color: theme.Colors.primary,
  },
  salesLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  infoCard: {
    ...theme.Components.card,
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
    padding: theme.Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  infoTitle: {
    ...theme.Typography.h3,
  },
  infoGrid: {
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  infoItemContent: {
    flex: 1,
  },
  infoLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...theme.Typography.body,
  },
  descriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  descriptionLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.xs,
  },
  descriptionText: {
    ...theme.Typography.body,
    lineHeight: 22,
  },
  statusSection: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.Components.chip,
    gap: theme.Spacing.sm,
  },
  statusChipText: {
    ...theme.Components.chipText,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(80, 200, 120, 0.05)',
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
  },
  subscriptionLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  subscriptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionDate: {
    ...theme.Typography.body,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  subscriptionRemaining: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  renewButton: {
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.sm,
  },
  renewButtonText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.black,
    fontWeight: '600',
  },
  quickActions: {
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.xl,
  },
  quickActionsTitle: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    ...theme.Components.card,
    alignItems: 'center',
    padding: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  actionText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.text,
  },
  actionSubtext: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
});

export default DashboardScreen;