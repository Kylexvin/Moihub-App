// screens/localservices/dashboard/BookingManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { width } = Dimensions.get('window');

// Skeleton Loading Component (keep as is)
const SkeletonLoader = ({ type = 'booking' }) => {
  // ... keep existing skeleton code
  const fadeAnim = new Animated.Value(0.3);
  
  useEffect(() => {
    const fadeInOut = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    fadeInOut.start();
    return () => fadeInOut.stop();
  }, []);

  if (type === 'booking') {
    return (
      <View style={styles.skeletonCard}>
        <Animated.View style={[styles.skeletonHeader, { opacity: fadeAnim }]}>
          <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
          <View style={[styles.skeletonBadge, { width: 70, height: 24 }]} />
        </Animated.View>
        <Animated.View style={[styles.skeletonRow, { opacity: fadeAnim }]}>
          <View style={[styles.skeletonIcon, { width: 16, height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
        </Animated.View>
        <Animated.View style={[styles.skeletonRow, { opacity: fadeAnim }]}>
          <View style={[styles.skeletonIcon, { width: 16, height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
        </Animated.View>
        <Animated.View style={[styles.skeletonActions, { opacity: fadeAnim }]}>
          <View style={[styles.skeletonButton, { width: 40, height: 40 }]} />
          <View style={[styles.skeletonButton, { width: 40, height: 40 }]} />
          <View style={[styles.skeletonButton, { width: 40, height: 40 }]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonHeader, { opacity: fadeAnim }]}>
        <View style={[styles.skeletonBadge, { width: 80, height: 24 }]} />
        <View style={[styles.skeletonLine, { width: 60, height: 14 }]} />
      </Animated.View>
      <Animated.View style={[styles.skeletonLine, { width: '80%', height: 16, marginBottom: 8, opacity: fadeAnim }]} />
      <Animated.View style={[styles.skeletonLine, { width: '90%', height: 32, marginBottom: 12, opacity: fadeAnim }]} />
      <Animated.View style={[styles.skeletonRow, { opacity: fadeAnim }]}>
        <View style={[styles.skeletonCircle, { width: 36, height: 36 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
      </Animated.View>
    </View>
  );
};

const BookingManagement = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending'); // CHANGED: default to 'pending'
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

const statusOptions = [
  { value: 'all', label: 'All', color: Colors.text },
  { value: 'pending', label: 'Pending', color: Colors.warning },
  { value: 'confirmed', label: 'Confirmed', color: Colors.info },
  { value: 'completed', label: 'Completed', color: Colors.success },
  { value: 'cancelled', label: 'Cancelled', color: Colors.danger },
  { value: 'no_show', label: 'No Show', color: Colors.textSecondary },
];  

const statusLabels = {
  pending: { 
    label: 'PENDING', 
    color: Colors.warning, 
    bgColor: Colors.warning,
    textColor: Colors.white,
    nextStatuses: ['confirmed', 'cancelled', 'no_show']
  },
  confirmed: { 
    label: 'CONFIRMED', 
    color: Colors.info, 
    bgColor: Colors.info,
    textColor: Colors.white,
    nextStatuses: ['completed', 'cancelled', 'no_show']
  },
  completed: { 
    label: 'COMPLETED', 
    color: Colors.success, 
    bgColor: Colors.success,
    textColor: Colors.white,
    nextStatuses: []
  },
  cancelled: { 
    label: 'CANCELLED', 
    color: Colors.danger, 
    bgColor: Colors.danger,
    textColor: Colors.white,
    nextStatuses: []
  },
  no_show: { 
    label: 'NO SHOW', 
    color: Colors.textSecondary, 
    bgColor: Colors.textSecondary,
    textColor: Colors.white,
    nextStatuses: []
  },
};

  useEffect(() => {
    fetchData();
  }, [statusFilter, activeTab]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'bookings') {
        await fetchBookings();
      } else {
        await fetchInquiries();
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, activeTab]);

const fetchBookings = async () => {
  try {
    let url = '/api/services/dashboard/bookings';
    if (statusFilter !== 'all') {
      url += `?status=${statusFilter}`;
    }
    
    const response = await axios.get(url);
    
    const formattedBookings = response.data.bookings?.map(booking => ({
      id: booking._id,
      customer: {
        name: booking.userId?.username || 'Customer',
        phone: booking.phoneNumber || booking.userId?.phone || '',
        email: booking.userId?.email
      },
      service: {
        name: booking.serviceId?.name || 'Service',
        price: booking.serviceId?.price || 0,
        duration: booking.serviceId?.duration || 60
      },
      date: new Date(booking.date),
      time: booking.time,
      status: booking.status,
      totalAmount: booking.totalAmount,
      notes: booking.notes,
      phoneNumber: booking.phoneNumber,
      createdAt: new Date(booking.createdAt)
    })) || [];
    
    setBookings(formattedBookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    throw error;
  }
};

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('/api/services/dashboard/inquiries');
      
      const formattedInquiries = response.data.data?.inquiries?.map(inquiry => ({
        id: inquiry.id,
        type: inquiry.type,
        customer: {
          name: inquiry.customer?.name || 'Customer',
          phone: inquiry.customer?.phone || '',
          email: inquiry.customer?.email || ''
        },
        item: inquiry.item,
        message: inquiry.message,
        contactMethod: inquiry.contactMethod,
        status: inquiry.status,
        createdAt: new Date(inquiry.createdAt),
        itemType: inquiry.itemType
      })) || [];
      
      setInquiries(formattedInquiries);
    } catch (error) {
      console.error('Fetch inquiries error:', error);
      throw error;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchData();
  };

  const handleUpdateStatus = (booking) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async (newStatus) => {
    if (!selectedBooking) return;
    
    try {
      setUpdatingStatus(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await axios.put(
        `/api/services/dashboard/bookings/${selectedBooking.id}/status`,
        { status: newStatus }
      );
      
      if (response.data.message || response.status === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setBookings(prev => prev.map(booking => 
          booking.id === selectedBooking.id 
            ? { ...booking, status: newStatus }
            : booking
        ));
        
        setShowStatusModal(false);
        setSelectedBooking(null);
        
        if (statusFilter !== 'all' && statusFilter !== newStatus) {
          setTimeout(() => fetchData(), 300);
        }
      }
    } catch (error) {
      console.error('Update status error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to update status';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCallCustomer = async (phone) => {
    if (!phone || phone.trim() === '') {
      Alert.alert('No Phone', 'Customer has not provided a phone number');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `tel:${cleanPhone}`;
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot make calls on this device');
    }
  };

  const handleMessageCustomer = async (phone, name) => {
    if (!phone || phone.trim() === '') {
      Alert.alert('No Phone', 'Customer has not provided a phone number');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    let url;
    if (Platform.OS === 'ios') {
      url = `https://wa.me/${cleanPhone}`;
    } else {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}`;
    }
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Clipboard.setStringAsync(cleanPhone);
      Alert.alert(
        'WhatsApp Not Installed',
        'Phone number copied to clipboard. Please open WhatsApp manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || '0'}`;
  };

  const copyPhoneNumber = async (phone, name) => {
    if (!phone) return;
    
    await Clipboard.setStringAsync(phone);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', `${name}'s phone number copied to clipboard`);
  };

  // NEW: Smart date tag function
  const getServiceDateTag = (serviceDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(serviceDate);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'OVERDUE', color: Colors.danger };
    } else if (diffDays === 0) {
      return { label: 'TODAY', color: Colors.success };
    } else if (diffDays === 1) {
      return { label: 'TOMORROW', color: Colors.warning };
    } else if (diffDays <= 7) {
      return { label: `${diffDays} DAYS`, color: Colors.info };
    } else {
      return { label: formatDate(date), color: Colors.textSecondary };
    }
  };

  // NEW: Get relative time for when booking was made
  const getBookedTimeAgo = (createdAt) => {
    const now = new Date();
    const bookedAt = new Date(createdAt);
    const diffMs = now - bookedAt;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

const renderBookingItem = ({ item }) => {
  const statusInfo = statusLabels[item.status] || statusLabels.pending;
  const hasPhone = item.customer.phone && item.customer.phone.trim() !== '';
  const dateTag = getServiceDateTag(item.date);
  const bookedTimeAgo = getBookedTimeAgo(item.createdAt);
  
  return (
    <View style={styles.bookingCard}>
      {/* Header with service name and date tag */}
      <View style={styles.bookingHeader}>
        <View style={styles.serviceNameContainer}>
          <Text style={styles.serviceName}>{item.service.name}</Text>
          <Text style={styles.bookedTimeAgo}>Booked {bookedTimeAgo}</Text>
        </View>
        <View style={[styles.dateTag, { backgroundColor: dateTag.color + '20' }]}>
          <Text style={[styles.dateTagText, { color: dateTag.color }]}>
            {dateTag.label}
          </Text>
        </View>
      </View>
      
      {/* Status badge moved below header */}
      <TouchableOpacity 
        style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}
        onPress={() => handleUpdateStatus(item)}
      >
        <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
          {statusInfo.label}
        </Text>
        {statusInfo.nextStatuses.length > 0 && (
          <Ionicons name="chevron-forward" size={12} color={statusInfo.textColor} />
        )}
      </TouchableOpacity>
      
      <View style={styles.bookingBody}>
        <View style={styles.detailRow}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>{item.customer.name}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.date)} • {formatTime(item.time)}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{item.service.duration} min</Text>
          </View>
        </View>
        
        {/* Phone number with contact options */}
        {hasPhone && (
          <TouchableOpacity 
            style={styles.phoneRow}
            onPress={() => {
              Alert.alert(
                'Contact Customer',
                item.customer.phone,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Copy', 
                    onPress: () => copyPhoneNumber(item.customer.phone, item.customer.name)
                  },
                  { 
                    text: 'Call', 
                    onPress: () => handleCallCustomer(item.customer.phone)
                  },
                  { 
                    text: 'WhatsApp', 
                    onPress: () => handleMessageCustomer(item.customer.phone, item.customer.name)
                  }
                ]
              );
            }}
          >
            <Ionicons name="call" size={16} color={Colors.primary} />
            <Text style={styles.phoneNumber}>{item.customer.phone}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        
        {item.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
      
      <View style={styles.bookingFooter}>
        <TouchableOpacity 
          style={[styles.actionButton, !hasPhone && styles.disabledButton]}
          onPress={() => handleCallCustomer(item.customer.phone)}
          disabled={!hasPhone}
        >
          <Ionicons 
            name="call" 
            size={20} 
            color={hasPhone ? Colors.primary : '#666'} 
          />
          <Text style={[styles.actionText, !hasPhone && styles.disabledText]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, !hasPhone && styles.disabledButton]}
          onPress={() => handleMessageCustomer(item.customer.phone, item.customer.name)}
          disabled={!hasPhone}
        >
          <Ionicons 
            name="logo-whatsapp" 
            size={20} 
            color={hasPhone ? '#25D366' : '#666'} 
          />
          <Text style={[styles.actionText, !hasPhone && styles.disabledText]}>WhatsApp</Text>
        </TouchableOpacity>
        
        {statusInfo.nextStatuses.length > 0 ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleUpdateStatus(item)}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Update</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButton}>
            <Ionicons name="checkmark-done" size={20} color={statusInfo.color} />
            <Text style={[styles.actionText, { color: statusInfo.color }]}>Done</Text>
          </View>
        )}
      </View>
    </View>
  );
};

  const renderInquiryItem = ({ item }) => {
    const isProduct = item.type === 'product';
    
    return (
      <View style={styles.inquiryCard}>
        <View style={styles.inquiryHeader}>
          <View style={styles.inquiryMeta}>
            <Text style={[styles.inquiryType, { 
              color: isProduct ? Colors.primary : Colors.secondary 
            }]}>
              {isProduct ? 'PRODUCT' : 'SERVICE'} INQUIRY
            </Text>
            <Text style={styles.inquiryTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.itemName}>{item.item?.name || 'General Inquiry'}</Text>
        
        <Text style={styles.inquiryMessage}>
          {item.message}
        </Text>
        
        <View style={styles.inquiryFooter}>
          <View>
            <Text style={styles.customerName}>{item.customer.name}</Text>
            <TouchableOpacity 
              style={styles.phoneRow}
              onPress={() => {
                if (item.customer.phone) {
                  Alert.alert(
                    'Contact Customer',
                    item.customer.phone,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Copy', 
                        onPress: () => copyPhoneNumber(item.customer.phone, item.customer.name)
                      },
                      { 
                        text: 'Call', 
                        onPress: () => handleCallCustomer(item.customer.phone)
                      },
                      { 
                        text: 'WhatsApp', 
                        onPress: () => handleMessageCustomer(item.customer.phone, item.customer.name)
                      }
                    ]
                  );
                }
              }}
            >
              <Ionicons 
                name="call" 
                size={12} 
                color={item.customer.phone ? Colors.primary : Colors.textSecondary} 
              />
              <Text style={[styles.customerPhone, !item.customer.phone && styles.disabledText]}>
                {item.customer.phone || 'No phone provided'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.replyButton, !item.customer.email && styles.disabledButton]}
            onPress={() => {
              if (item.customer.email) {
                Linking.openURL(`mailto:${item.customer.email}?subject=Re: Inquiry about ${item.item?.name}`);
              }
            }}
          >
            <Ionicons 
              name="mail" 
              size={16} 
              color={item.customer.email ? Colors.primary : Colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStatusModal = () => {
    if (!selectedBooking) return null;
    const currentStatusInfo = statusLabels[selectedBooking.status] || statusLabels.pending;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showStatusModal}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !updatingStatus && setShowStatusModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Booking Status</Text>
              <Text style={styles.modalSubtitle}>
                Current: <Text style={{ color: currentStatusInfo.color, fontWeight: '600' }}>
                  {currentStatusInfo.label}
                </Text>
              </Text>
            </View>
            
            <View style={styles.statusOptions}>
              {currentStatusInfo.nextStatuses.length > 0 ? (
                currentStatusInfo.nextStatuses.map((status) => {
                  const statusInfo = statusLabels[status];
                  if (!statusInfo) return null;
                  
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        { borderLeftColor: statusInfo.color }
                      ]}
                      onPress={() => confirmStatusUpdate(status)}
                      disabled={updatingStatus}
                    >
                      <View style={styles.statusOptionContent}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <View style={styles.statusInfo}>
                          <Text style={styles.statusOptionText}>{statusInfo.label}</Text>
                          <Text style={styles.statusOptionDescription}>
                            {status === 'confirmed' && 'Confirm this booking with the customer'}
                            {status === 'completed' && 'Mark this booking as completed'}
                            {status === 'cancelled' && 'Cancel this booking'}
                            {status === 'no_show' && 'Mark as no show'}
                          </Text>
                        </View>
                      </View>
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color={statusInfo.color} />
                      ) : (
                        <Ionicons name="arrow-forward" size={20} color={statusInfo.color} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noOptions}>
                  <Ionicons name="checkmark-done" size={32} color={Colors.textSecondary} />
                  <Text style={styles.noOptionsText}>No further actions available</Text>
                  <Text style={styles.noOptionsSubtext}>
                    This booking is already {selectedBooking.status.toLowerCase().replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowStatusModal(false)}
              disabled={updatingStatus}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons 
          name={activeTab === 'bookings' ? "calendar-outline" : "chatbubble-ellipses-outline"} 
          size={48} 
          color={Colors.textSecondary} 
        />
      </View>
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'bookings' ? 'No Bookings' : 'No Inquiries'}
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'bookings' 
          ? 'You don\'t have any bookings yet' 
          : 'No customer inquiries at the moment'}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchData}
      >
        <Ionicons name="refresh" size={16} color={Colors.primary} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(3)].map((_, i) => (
        <React.Fragment key={i}>
          <SkeletonLoader type={activeTab === 'bookings' ? 'booking' : 'inquiry'} />
          <View style={styles.separator} />
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bookings & Inquiries</Text>
          <Text style={styles.headerSubtitle}>
            Manage customer requests
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'bookings' && styles.activeTabText
          ]}>
            Bookings
          </Text>
          {bookings.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inquiries' && styles.activeTab]}
          onPress={() => setActiveTab('inquiries')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'inquiries' && styles.activeTabText
          ]}>
            Inquiries
          </Text>
          {inquiries.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{inquiries.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Status Filter (Bookings only) */}
      {activeTab === 'bookings' && (
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterButton,
                  statusFilter === option.value && styles.activeFilterButton,
                  { borderColor: option.color }
                ]}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text style={[
                  styles.filterText,
                  statusFilter === option.value && styles.activeFilterText,
                  { color: statusFilter === option.value ? Colors.white : option.color }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          renderSkeletonLoader()
        ) : (
          <FlatList
            data={activeTab === 'bookings' ? bookings : inquiries}
            renderItem={activeTab === 'bookings' ? renderBookingItem : renderInquiryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Status Update Modal */}
      {renderStatusModal()}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  separator: {
    height: 12,
  },
  // Add to your styles
detailRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: Spacing.sm,
},
detailColumn: {
  flex: 1,
},
detailLabel: {
  ...Typography.caption,
  color: '#888',
  fontSize: 11,
  marginBottom: 2,
},
detailValue: {
  ...Typography.body,
  fontSize: 14,
  color: Colors.white,
}, 

serviceNameContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  bookedTimeAgo: {
    ...Typography.caption,
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  dateTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  dateTagText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    gap: 8,
  },
  phoneNumber: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: 14,
    flex: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.sm,
    marginHorizontal: 4,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // Dark Cards
  bookingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  serviceName: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bookingBody: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.caption,
    color: '#888',
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.white,
  },
  notesContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.sm,
  },
  notesLabel: {
    ...Typography.caption,
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  notesText: {
    ...Typography.body,
    fontSize: 13,
    color: '#CCC',
    lineHeight: 18,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  phoneText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    flex: 1,
  },
  updateButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  finalStatusBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
  },
  // Inquiry Cards
  inquiryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inquiryHeader: {
    marginBottom: Spacing.sm,
  },
  inquiryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inquiryType: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  inquiryTime: {
    ...Typography.caption,
    color: '#888',
    fontSize: 11,
  },
  itemName: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  inquiryMessage: {
    ...Typography.body,
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.white,
    marginBottom: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerPhone: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 12,
  },
  replyButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Typography.body,
    color: '#888',
  },
  statusOptions: {
    gap: 8,
    marginBottom: Spacing.lg,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#2A2A2A',
    borderLeftWidth: 3,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInfo: {
    flex: 1,
  },
  statusOptionText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  statusOptionDescription: {
    ...Typography.caption,
    color: '#888',
    fontSize: 12,
  },
  noOptions: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  noOptionsText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  noOptionsSubtext: {
    ...Typography.caption,
    color: '#888',
    textAlign: 'center',
  },
  modalCancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#2A2A2A',
  },
  modalCancelText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.white,
  },
  // Skeleton
  skeletonContainer: {
    paddingVertical: Spacing.sm,
  },
  skeletonCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skeletonLine: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.sm,
  },
  skeletonBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.round,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  skeletonIcon: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.sm,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: Spacing.md,
  },
  skeletonButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.round,
  },
  skeletonCircle: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.round,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emptyStateTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  refreshButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default BookingManagement;