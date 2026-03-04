import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Dark Green Medical/Pharmacy themed color palette
const PharmacyColors = {
  primary: '#1B5E20',      // Dark Green
  secondary: '#2E7D32',     // Medium Green
  accent: '#00ACC1',        // Dark Cyan
  success: '#43A047',       // Green
  warning: '#FB8C00',       // Orange
  error: '#E53935',         // Red
  background: '#0A1F0A',    // Very Dark Green
  surface: '#1A2E1A',       // Dark Green Surface
  card: '#1E3A1E',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#A5D6A7', // Light Green
  textMuted: '#558B55',     // Muted Green
  border: '#2E5A2E',        // Border Green
};

const PharmacyLanding = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShops, setFilteredShops] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Medical categories
  const categories = [
    { id: 'all', name: 'All', icon: 'local-pharmacy' },
    { id: '24hrs', name: '24/7', icon: 'access-time' },
    { id: 'prescription', name: 'Rx', icon: 'description' },
    { id: 'delivery', name: 'Delivery', icon: 'delivery-dining' },
    { id: 'emergency', name: 'Emergency', icon: 'warning' },
  ];

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const response = await axios.get('api/eshop/vendor/categories/pharmacy/shops');
        const data = response.data;

        if (data.success) {
          setShops(data.data);
        } else {
          Alert.alert('Error', 'Failed to fetch shops');
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        Alert.alert('Error', 'Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  }, [searchQuery, shops]);

  const getStatusColor = (isOpen) => {
    return isOpen ? PharmacyColors.success : PharmacyColors.error;
  };

  const getStatusText = (isOpen) => {
    return isOpen ? '● Open Now' : '● Closed';
  };

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <LinearGradient
        colors={selectedCategory === item.id 
          ? [PharmacyColors.primary, PharmacyColors.secondary]
          : [PharmacyColors.surface, PharmacyColors.card]}
        style={styles.categoryGradient}
      >
        <Icon 
          name={item.icon} 
          size={18} 
          color={selectedCategory === item.id ? '#fff' : PharmacyColors.textSecondary} 
        />
        <Text style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive
        ]}>{item.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderShopCard = (shop) => (
    <Animatable.View 
      key={shop._id}
      animation="fadeInUp"
      duration={500}
    >
      <TouchableOpacity
        style={styles.shopCard}
        onPress={() => navigation.navigate('PharmacyProducts', { 
          pharmacySlug: shop.slug,
          pharmacyName: shop.shopName 
        })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[PharmacyColors.card, PharmacyColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Medical Pattern Background */}
          <View style={styles.medicalPattern}>
            <Text style={styles.patternIcon}>💊</Text>
            <Text style={styles.patternIcon}>🩺</Text>
            <Text style={styles.patternIcon}>💉</Text>
          </View>

          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[PharmacyColors.primary, PharmacyColors.secondary]}
                style={styles.logoGradient}
              >
                <Icon name="local-pharmacy" size={30} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(shop.isOpen) + '20' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(shop.isOpen) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(shop.isOpen) }
                ]}>
                  {getStatusText(shop.isOpen)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Shop Info */}
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shop.shopName}</Text>
            <Text style={styles.shopDescription} numberOfLines={2}>
              {shop.description || 'Licensed pharmacy providing quality medications'}
            </Text>
          </View>
          
          {/* Contact Info */}
          <View style={styles.contactSection}>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={16} color={PharmacyColors.textSecondary} />
              <Text style={styles.infoText}>{shop.address || 'Main Campus'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="phone" size={16} color={PharmacyColors.textSecondary} />
              <Text style={styles.infoText}>{shop.phoneNumber || 'Contact for details'}</Text>
            </View>
          </View>
          
          {/* Services */}
          <View style={styles.servicesContainer}>
            {shop.hasDelivery && (
              <View style={styles.serviceBadge}>
                <Icon name="delivery-dining" size={14} color={PharmacyColors.textSecondary} />
                <Text style={styles.serviceText}>Delivery</Text>
              </View>
            )}
            {shop.hasPrescription && (
              <View style={styles.serviceBadge}>
                <Icon name="description" size={14} color={PharmacyColors.textSecondary} />
                <Text style={styles.serviceText}>Prescription</Text>
              </View>
            )}
            {shop.hasConsultation && (
              <View style={styles.serviceBadge}>
                <Icon name="medical-services" size={14} color={PharmacyColors.textSecondary} />
                <Text style={styles.serviceText}>Consult</Text>
              </View>
            )}
            <View style={styles.serviceBadge}>
              <Icon name="access-time" size={14} color={PharmacyColors.textSecondary} />
              <Text style={styles.serviceText}>15-30 min</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

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
          <Text style={styles.loadingText}>Loading pharmacies...</Text>
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
        <Text style={[styles.floatingIcon, styles.icon4]}>🌡️</Text>
      </View>
      
      {/* Header */}
      <LinearGradient
        colors={[PharmacyColors.primary, PharmacyColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="local-pharmacy" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Pharmacy</Text>
          </View>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="shopping-cart" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>0</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Your Health, Our Priority</Text>
          <Text style={styles.welcomeSubtitle}>Find medications & healthcare products</Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <LinearGradient
          colors={[PharmacyColors.card, PharmacyColors.surface]}
          style={styles.searchContainer}
        >
          <Icon name="search" size={20} color={PharmacyColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for medicines, shops..."
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

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map(item => renderCategoryChip({ item }))}
        </ScrollView>
      </View>

      {/* Shops List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
          <Text style={styles.sectionCount}>{filteredShops.length} available</Text>
        </View>
        
        {filteredShops.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icon name="local-pharmacy" size={60} color={PharmacyColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No pharmacies found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new pharmacies'}
            </Text>
          </View>
        ) : (
          filteredShops.map(renderShopCard)
        )}

        {/* Health Tips Banner */}
        <LinearGradient
          colors={[PharmacyColors.card, PharmacyColors.surface]}
          style={styles.tipsBanner}
        >
          <View style={styles.tipsContent}>
            <Icon name="health-and-safety" size={24} color={PharmacyColors.textSecondary} />
            <View style={styles.tipsText}>
              <Text style={styles.tipsTitle}>Health Tip</Text>
              <Text style={styles.tipsDescription}>
                Always consult a pharmacist before taking new medications
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
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
    top: '15%',
    right: '10%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '25%',
    right: '15%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '35%',
    left: '10%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: PharmacyColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cartButton: {
    position: 'relative',
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: PharmacyColors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 16,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PharmacyColors.text,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    marginRight: 12,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: PharmacyColors.textSecondary,
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  shopCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  medicalPattern: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  shopInfo: {
    marginBottom: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: PharmacyColors.text,
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: PharmacyColors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: PharmacyColors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PharmacyColors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 11,
    color: PharmacyColors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PharmacyColors.primary + '10',
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
  },
  tipsBanner: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  tipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsText: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PharmacyColors.textSecondary,
    marginBottom: 2,
  },
  tipsDescription: {
    fontSize: 12,
    color: PharmacyColors.textMuted,
  },
});

export default PharmacyLanding;