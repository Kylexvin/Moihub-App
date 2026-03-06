// screens/localservices/dashboard/ReviewsManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReviewsManagement = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(false);
  const [showModerateModal, setShowModerateModal] = useState(false);
  const [moderatingReview, setModeratingReview] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews(1, true);
  }, [filter]);

  const fetchReviews = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/business/reviews', {
        params: { 
          page: pageNum, 
          limit: 20,
          status: filter !== 'all' ? filter : undefined
        }
      });
      
      if (response.data.success) {
        if (reset) {
          setReviews(response.data.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data.data.reviews]);
        }
        setHasMore(response.data.data.reviews.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/services/reviews/stats/me');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleReplyToReview = async () => {
    if (!replyText.trim() || replyText.trim().length < 2) {
      Alert.alert('Error', 'Reply must be at least 2 characters');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const endpoint = editingReply 
        ? `/api/services/business/reviews/${replyingTo}/reply`
        : `/api/services/business/reviews/${replyingTo}/reply`;

      const response = editingReply
        ? await axios.put(endpoint, { reply: replyText.trim() })
        : await axios.post(endpoint, { reply: replyText.trim() });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', editingReply ? 'Reply updated' : 'Reply added');
        setShowReplyModal(false);
        setReplyText('');
        setReplyingTo(null);
        setEditingReply(false);
        fetchReviews(1, true);
      }
    } catch (error) {
      console.error('Reply error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save reply');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.delete(`/api/services/business/reviews/${reviewId}/reply`);
              
              if (response.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Reply deleted');
                fetchReviews(1, true);
              }
            } catch (error) {
              console.error('Delete reply error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete reply');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleModerateReview = async (reviewId, action) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/services/business/reviews/${reviewId}/moderate`, {
        action
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', action === 'approve' ? 'Review approved' : 'Review rejected');
        setShowModerateModal(false);
        fetchReviews(1, true);
        fetchStats();
      }
    } catch (error) {
      console.error('Moderate review error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to moderate review');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(page + 1);
    }
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={Colors.warning}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Reviews Management</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{stats.summary.average.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {renderStars(Math.round(stats.summary.average))}
            </View>
            <Text style={styles.statsLabel}>Average Rating</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{stats.summary.total}</Text>
            <Text style={styles.statsLabel}>Total Reviews</Text>
            <Text style={styles.statsSubtext}>{stats.recentReviews} in 30 days</Text>
          </View>
        </View>

        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={rating} style={styles.distributionRow}>
              <Text style={styles.distributionRating}>{rating}★</Text>
              <View style={styles.distributionBarContainer}>
                <View 
                  style={[
                    styles.distributionBar,
                    { 
                      width: `${stats.summary.total > 0 
                        ? (stats.summary.distribution[rating] / stats.summary.total) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>
                {stats.summary.distribution[rating]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {['all', 'pending', 'approved'].map((filterType) => (
        <TouchableOpacity
          key={filterType}
          style={[
            styles.filterChip,
            filter === filterType && styles.filterChipActive
          ]}
          onPress={() => setFilter(filterType)}
        >
          <Text style={[
            styles.filterChipText,
            filter === filterType && styles.filterChipTextActive
          ]}>
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewCard = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {review.user.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.reviewAvatar} />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <Text style={styles.reviewAvatarText}>
                {review.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.reviewUserInfo}>
            <Text style={styles.reviewUserName}>{review.user.name}</Text>
            <View style={styles.reviewRating}>
              {renderStars(review.rating)}
              <Text style={styles.reviewTime}>{getTimeAgo(review.date)}</Text>
            </View>
          </View>
        </View>
        
        {!review.isApproved && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Pending</Text>
          </View>
        )}
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      {/* Provider Reply Section */}
      {review.providerReply ? (
        <View style={styles.replySection}>
          <View style={styles.replyHeader}>
            <View style={styles.replyUser}>
              <Ionicons name="business" size={16} color={Colors.primary} />
              <Text style={styles.replyBusinessName}>Your Reply</Text>
            </View>
            <View style={styles.replyActions}>
              <TouchableOpacity 
                onPress={() => {
                  setReplyingTo(review.id);
                  setReplyText(review.providerReply.text);
                  setEditingReply(true);
                  setShowReplyModal(true);
                }}
                style={styles.replyAction}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteReply(review.id)}
                style={styles.replyAction}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.replyText}>{review.providerReply.text}</Text>
          <Text style={styles.replyDate}>
            Replied {formatDate(review.providerReply.repliedAt)}
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => {
            setReplyingTo(review.id);
            setReplyText('');
            setEditingReply(false);
            setShowReplyModal(true);
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
          <Text style={styles.replyButtonText}>Reply to Review</Text>
        </TouchableOpacity>
      )}

      {/* Moderation Actions for pending reviews */}
      {!review.isApproved && (
        <View style={styles.moderationActions}>
          <TouchableOpacity 
            style={[styles.moderationButton, styles.approveButton]}
            onPress={() => {
              setModeratingReview(review);
              setShowModerateModal(true);
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.moderationButton, styles.rejectButton]}
            onPress={() => {
              setModeratingReview(review);
              setShowModerateModal(true);
            }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.error} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReplyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showReplyModal}
      onRequestClose={() => {
        setShowReplyModal(false);
        setReplyText('');
        setReplyingTo(null);
        setEditingReply(false);
      }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {editingReply ? 'Edit Reply' : 'Reply to Review'}
          </Text>
          
          <TextInput
            style={[styles.textInput, styles.replyTextArea]}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write your reply..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowReplyModal(false);
                setReplyText('');
                setReplyingTo(null);
                setEditingReply(false);
              }}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleReplyToReview}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingReply ? 'Update Reply' : 'Post Reply'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderModerateModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showModerateModal}
      onRequestClose={() => setShowModerateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.confirmModal]}>
          <Ionicons name="warning" size={48} color={Colors.warning} />
          <Text style={styles.confirmTitle}>Moderate Review</Text>
          <Text style={styles.confirmText}>
            Do you want to approve or reject this review?
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.moderationButton, styles.approveButton, styles.fullButton]}
              onPress={() => {
                handleModerateReview(moderatingReview?.id, 'approve');
                setShowModerateModal(false);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.approveFullButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.moderationButton, styles.rejectButton, styles.fullButton]}
              onPress={() => {
                handleModerateReview(moderatingReview?.id, 'reject');
                setShowModerateModal(false);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color={Colors.white} />
                  <Text style={styles.rejectFullButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmCancel}
            onPress={() => setShowModerateModal(false)}
            disabled={loading}
          >
            <Text style={styles.confirmCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= 
            nativeEvent.contentSize.height - 20;
          if (isCloseToBottom) loadMore();
        }}
        scrollEventThrottle={400}
      >
        {renderStats()}
        {renderFilters()}
        
        {loading && reviews.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>
              When customers review your business, they'll appear here
            </Text>
          </View>
        ) : (
          <>
            {reviews.map(renderReviewCard)}
            {loading && reviews.length > 0 && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
          </>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderReplyModal()}
      {renderModerateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingMore: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  statsCard: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  statsHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.md,
  },
  statsValue: {
    ...Typography.h1,
    color: Colors.text,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statsLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  statsSubtext: {
    ...Typography.caption,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  ratingDistribution: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  distributionRating: {
    width: 30,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
  },
  distributionBar: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  reviewUserName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  replySection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  replyUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  replyBusinessName: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  replyActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  replyAction: {
    padding: 4,
  },
  replyText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  replyDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  replyButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  moderationActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  moderationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  approveButton: {
    backgroundColor: Colors.success + '10',
  },
  rejectButton: {
    backgroundColor: Colors.error + '10',
  },
  approveButtonText: {
    color: Colors.success,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: '600',
  },
  fullButton: {
    backgroundColor: Colors.primary,
  },
  approveFullButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  rejectFullButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
  },
  replyTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  confirmModal: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confirmTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  confirmText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  confirmCancel: {
    marginTop: Spacing.md,
  },
  confirmCancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});

export default ReviewsManagement;