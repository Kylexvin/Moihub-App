import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import theme from '../../theme/Theme';

const baseURL = Platform.OS === 'ios' 
  ? 'http://localhost:5000' 
  : 'https://moihub.onrender.com';

const FOOD_CATEGORIES = [
  'Main Dishes',
  'Appetizers',
  'Desserts',
  'Beverages',
  'Snacks',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Organic',
  'Fast Food',
  'Traditional',
  'International',
  'Healthy',
  'Comfort Food',
  'Street Food',
  'Gourmet'
];

const AddListingScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!selectedImage) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📷 Camera', 
          onPress: takePhoto,
          style: 'default'
        },
        { 
          text: '🖼️ Gallery', 
          onPress: pickImage,
          style: 'default'
        },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const selectCategory = (category) => {
    handleInputChange('category', category);
    setShowCategories(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('price', formData.price.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category.trim());
      
      formDataToSend.append('image', {
        uri: selectedImage.uri,
        type: 'image/jpeg',
        name: 'listing-image.jpg',
      });

      const response = await axios.post(
        `${baseURL}/api/food/listings`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          '🎉 Success!',
          'Your listing has been created successfully.',
          [
            {
              text: 'View Listings',
              onPress: () => navigation.navigate('Listings'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      
      if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={22} color={theme.Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.title}>Add New Listing</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Image Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image" size={18} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Product Photo</Text>
            </View>
            <TouchableOpacity
              style={[styles.imageContainer, errors.image && styles.inputError]}
              onPress={showImagePickerOptions}
              activeOpacity={0.8}
            >
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <LinearGradient
                      colors={[theme.Colors.danger, theme.Colors.danger + '80']}
                      style={styles.removeImageGradient}
                    >
                      <Ionicons name="close" size={16} color={theme.Colors.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={styles.imageOverlay}
                  >
                    <Text style={styles.imageOverlayText}>Tap to change</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imagePlaceholderIcon}>
                    <Ionicons name="cloud-upload" size={40} color={theme.Colors.primary} />
                  </View>
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                  <Text style={styles.imagePlaceholderSubtext}>JPG, PNG up to 5MB</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.Colors.danger} />
                <Text style={styles.errorText}>{errors.image}</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant" size={18} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Name</Text>
            </View>
            <View style={[styles.inputWrapper, errors.name && styles.inputErrorWrapper]}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Beef Burger"
                placeholderTextColor={theme.Colors.textTertiary}
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
              />
            </View>
            {errors.name && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.Colors.danger} />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag" size={18} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Price</Text>
            </View>
            <View style={[styles.inputWrapper, errors.price && styles.inputErrorWrapper]}>
              <Text style={styles.currencySymbol}>KSh</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="0.00"
                placeholderTextColor={theme.Colors.textTertiary}
                keyboardType="numeric"
                value={formData.price}
                onChangeText={value => handleInputChange('price', value)}
              />
            </View>
            {errors.price && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.Colors.danger} />
                <Text style={styles.errorText}>{errors.price}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <View style={[styles.inputWrapper, errors.description && styles.inputErrorWrapper]}>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Describe your dish... ingredients, preparation, etc."
                placeholderTextColor={theme.Colors.textTertiary}
                value={formData.description}
                onChangeText={value => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {errors.description && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.Colors.danger} />
                <Text style={styles.errorText}>{errors.description}</Text>
              </View>
            )}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="apps" size={18} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <TouchableOpacity
              style={[styles.inputWrapper, styles.categorySelector, errors.category && styles.inputErrorWrapper]}
              onPress={() => setShowCategories(!showCategories)}
              activeOpacity={0.7}
            >
              <Text style={formData.category ? styles.selectedCategoryText : styles.placeholderText}>
                {formData.category || 'Select a category'}
              </Text>
              <Ionicons 
                name={showCategories ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.Colors.textSecondary} 
              />
            </TouchableOpacity>
            {errors.category && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.Colors.danger} />
                <Text style={styles.errorText}>{errors.category}</Text>
              </View>
            )}
            
            {/* Categories Dropdown */}
            {showCategories && (
              <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                style={styles.dropdown}
              >
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {FOOD_CATEGORIES.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        index === FOOD_CATEGORIES.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => selectCategory(cat)}
                    >
                      <Text style={styles.dropdownItemText}>{cat}</Text>
                      {formData.category === cat && (
                        <Ionicons name="checkmark" size={18} color={theme.Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </LinearGradient>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.Colors.primary, theme.Colors.primaryDark]}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={theme.Colors.black} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={theme.Colors.black} />
                  <Text style={styles.submitButtonText}>Create Listing</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.cardBorder,
  },
  backButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  backButtonGradient: {
    padding: theme.Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.Typography.h3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.Spacing.lg,
  },
  section: {
    marginBottom: theme.Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  sectionTitle: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
  },
  imageContainer: {
    ...theme.Components.card,
    padding: 0,
    overflow: 'hidden',
    minHeight: 200,
  },
  imagePlaceholder: {
    padding: theme.Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  imagePlaceholderText: {
    ...theme.Typography.body,
    marginBottom: theme.Spacing.xs,
  },
  imagePlaceholderSubtext: {
    ...theme.Typography.caption,
    color: theme.Colors.textTertiary,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    padding: theme.Spacing.sm,
  },
  imageOverlayText: {
    ...theme.Typography.caption,
    color: theme.Colors.white,
  },
  removeImageButton: {
    position: 'absolute',
    top: theme.Spacing.sm,
    right: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  removeImageGradient: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
    paddingHorizontal: theme.Spacing.md,
  },
  inputErrorWrapper: {
    borderColor: theme.Colors.danger,
  },
  input: {
    flex: 1,
    ...theme.Typography.body,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.text,
  },
  priceInput: {
    marginLeft: theme.Spacing.xs,
  },
  currencySymbol: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    justifyContent: 'space-between',
  },
  placeholderText: {
    ...theme.Typography.body,
    color: theme.Colors.textTertiary,
  },
  selectedCategoryText: {
    ...theme.Typography.body,
    color: theme.Colors.text,
  },
  dropdown: {
    marginTop: theme.Spacing.xs,
    ...theme.Components.card,
    maxHeight: 250,
    padding: 0,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.cardBorder,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    ...theme.Typography.body,
    color: theme.Colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginTop: theme.Spacing.xs,
  },
  errorText: {
    ...theme.Typography.caption,
    color: theme.Colors.danger,
  },
  inputError: {
    borderColor: theme.Colors.danger,
  },
  submitButton: {
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
    marginTop: theme.Spacing.md,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  submitButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
});

export default AddListingScreen;