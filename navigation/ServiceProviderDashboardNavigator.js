// navigation/ServiceProviderDashboardNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ServiceProviderDashboard from '../screens/localservices/dashboard/ServiceProviderDashboard';
import BusinessProfile from '../screens/localservices/dashboard/BusinessProfile';
import ReviewsManagement from '../screens/localservices/dashboard/ReviewsManagement';

const Stack = createStackNavigator();

const ServiceProviderDashboardNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#093028' },
        animationEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ServiceProviderDashboard" 
        component={ServiceProviderDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BusinessProfile" 
        component={BusinessProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReviewsManagement" 
        component={ReviewsManagement}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ServiceProviderDashboardNavigator;