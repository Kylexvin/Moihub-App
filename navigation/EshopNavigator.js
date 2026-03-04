// navigation/EshopNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EshopHomeScreen from '../screens/eshop/EshopHomeScreen';
import CategoryShopsScreen from '../screens/eshop/CategoryShopsScreen';
import ShopProductsScreen from '../screens/eshop/ShopProductsScreen';
import ProductDetailScreen from '../screens/eshop/ProductDetailScreen';
import CartScreen from '../screens/eshop/CartScreen';
import OrdersScreen from '../screens/eshop/OrdersScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

const EshopNavigator = () => {
  const { currentUser } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName="EshopHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669',
          elevation: 4,
          shadowOpacity: 0.1,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        cardStyle: {
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <Stack.Screen
        name="EshopHome"
        component={EshopHomeScreen}
        options={{
          title: '🛍️ E-Shop',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CategoryShops"
        component={CategoryShopsScreen}
        options={({ route }) => ({
          title: `🏪 ${route.params?.categoryName || 'Shops'}`,
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="ShopProducts"
        component={ShopProductsScreen}
        options={({ route }) => ({
          title: `📦 ${route.params?.shopName || 'Products'}`,
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: '📱 Product Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: '🛒 Shopping Cart',
          headerShown: false,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerTitle: currentUser?.username
            ? `📋 ${currentUser.username}'s Orders`
            : '📋 My Orders',
            headerShown: false,
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default EshopNavigator;
