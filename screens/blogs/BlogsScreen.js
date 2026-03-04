import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  RefreshControl,
  Alert,  
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Blog-themed color palette
const BlogColors = {
  primary: '#7C4DFF',      // Vibrant Purple
  secondary: '#FF6B6B',    // Coral
  accent: '#4ECDC4',       // Turquoise
  background: '#0A0A0A',   // Dark Background
  surface: '#1A1A1A',      // Surface Dark
  card: '#242424',         // Card Background
  text: '#FFFFFF',         // White
  textSecondary: '#B0B0B0', // Light Gray
  textMuted: '#757575',     // Muted Gray
  border: '#333333',        // Border
  like: '#FF6B6B',         // Like color
  readTime: '#4ECDC4',     // Read time color
};

const BlogsScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchBlogs = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    
    try {
      const res = await axios.get('https://moihub.onrender.com/api/posts/');
      setBlogs(res.data.posts || []);
    } catch (error) {
      console.error('Failed to load blogs:', error);
      setError('Failed to load blogs. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load blogs. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlogs(true);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Technology': 'computer',
      'Lifestyle': 'spa',
      'Health': 'fitness-center',
      'Education': 'school',
      'Entertainment': 'movie',
      'Sports': 'sports-soccer',
      'Food': 'restaurant',
      'Travel': 'flight',
    };
    return icons[category] || 'article';
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity 
        onPress={() => navigation.navigate('BlogDetails', { id: item._id })} 
        style={styles.card}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[BlogColors.card, BlogColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Decorative Pattern */}
          <View style={styles.cardPattern}>
            <Text style={styles.patternIcon}>📝</Text>
            <Text style={styles.patternIcon}>✍️</Text>
          </View>

          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400' }} 
              style={styles.image}
              resizeMode="cover"
            />
            
            {/* Category Badge */}
            <LinearGradient
              colors={[BlogColors.primary, BlogColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryBadge}
            >
              <Icon name={getCategoryIcon(item.category)} size={12} color="#fff" />
              <Text style={styles.categoryText}>{item.category}</Text>
            </LinearGradient>

            {/* Likes Badge */}
            <View style={styles.likesBadge}>
              <Icon name="favorite" size={14} color={BlogColors.like} />
              <Text style={styles.likesText}>{item.likes?.length || 0}</Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            
            <Text numberOfLines={2} style={styles.excerpt}>
              {item.excerpt || item.content?.substring(0, 120) + '...'}
            </Text>
            
            <View style={styles.metaContainer}>
              {/* Author */}
              <View style={styles.authorContainer}>
                <LinearGradient
                  colors={[BlogColors.primary, BlogColors.secondary]}
                  style={styles.authorAvatar}
                >
                  <Text style={styles.authorInitial}>
                    {item.author?.username?.charAt(0)?.toUpperCase()}
                  </Text>
                </LinearGradient>
                <View>
                  <Text style={styles.authorName}>{item.author?.username}</Text>
                  <Text style={styles.authorRole}>Writer</Text>
                </View>
              </View>

              {/* Meta Info */}
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Icon name="access-time" size={14} color={BlogColors.readTime} />
                  <Text style={styles.readTime}>{item.readTime || 5} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="calendar-today" size={14} color={BlogColors.textMuted} />
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" duration={800} style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="library-books" size={60} color={BlogColors.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>No articles yet</Text>
      <Text style={styles.emptyStateText}>
        Check back later for new content from our writers
      </Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => fetchBlogs()}
      >
        <LinearGradient
          colors={[BlogColors.primary, BlogColors.secondary]}
          style={styles.retryGradient}
        >
          <Icon name="refresh" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderHeader = () => (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Blog</Text>
        <Text style={styles.headerSubtitle}>
          Discover stories, insights & ideas
        </Text>
      </View>
      <View style={styles.headerStats}>
        <View style={styles.statBadge}>
          <Icon name="article" size={16} color={BlogColors.primary} />
          <Text style={styles.statText}>{blogs.length} articles</Text>
        </View>
      </View>
    </Animatable.View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <LinearGradient
        colors={[BlogColors.primary + '20', 'transparent']}
        style={styles.footerGradient}
      >
        <Icon name="arrow-downward" size={20} color={BlogColors.primary} />
        <Text style={styles.footerText}>Keep scrolling for more</Text>
      </LinearGradient>
    </View>
  );

  if (loading && blogs.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BlogColors.background} />
        <LinearGradient
          colors={[BlogColors.background, BlogColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="auto-stories" size={60} color={BlogColors.primary} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={BlogColors.primary} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BlogColors.background} />
      
      <LinearGradient
        colors={[BlogColors.background, BlogColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>📚</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✍️</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>📖</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>📝</Text>
      </View>

      <FlatList
        data={blogs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={blogs.length > 0 ? renderFooter : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BlogColors.primary]}
            tintColor={BlogColors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BlogColors.background,
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
    color: BlogColors.textMuted,
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
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
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
    backgroundColor: BlogColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: BlogColors.textSecondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BlogColors.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    marginTop: 4,
  },
  headerStats: {
    backgroundColor: BlogColors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: BlogColors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  cardGradient: {
    position: 'relative',
  },
  cardPattern: {
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
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  likesBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  likesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: BlogColors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  excerpt: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 13,
    color: BlogColors.text,
    fontWeight: '600',
  },
  authorRole: {
    fontSize: 11,
    color: BlogColors.textMuted,
  },
  metaInfo: {
    alignItems: 'flex-end',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  readTime: {
    fontSize: 12,
    color: BlogColors.readTime,
    marginLeft: 4,
    fontWeight: '500',
  },
  date: {
    fontSize: 11,
    color: BlogColors.textMuted,
    marginLeft: 4,
  },
  footer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  footerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  footerText: {
    color: BlogColors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BlogColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BlogColors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BlogsScreen;