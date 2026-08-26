import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../utils/constants';
import { fetchUser, setToken } from '../redux/slices/authSlice';

import RoleBasedNavigator from './RoleBasedNavigator';
import AuthNavigator from './AuthNavigator';
import ActiveSOSScreen from '../screens/sos/ActiveSOSScreen';
import HelplinesScreen from '../screens/helplines/HelplinesScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import SplashScreen from '../screens/auth/SplashScreen';

// Admin feature screens
import AdminCouponsScreen from '../screens/main/AdminCouponsScreen';
import AdminReferralsScreen from '../screens/main/AdminReferralsScreen';
import AdminSettingsScreen from '../screens/main/AdminSettingsScreen';

// Informational screens
import AboutScreen from '../screens/info/AboutScreen';
import PrivacyScreen from '../screens/info/PrivacyScreen';
import TermsScreen from '../screens/info/TermsScreen';
import HelpScreen from '../screens/info/HelpScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          dispatch(setToken(storedToken));
          dispatch(fetchUser());
        }
      } catch (e) {}
      setIsLoading(false);
    };
    bootstrapAsync();
  }, [dispatch]);

  if (isLoading) return <SplashScreen />;

  const isAuthenticated = !!(token && user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={RoleBasedNavigator} />
            <Stack.Screen
              name="ActiveSOS"
              component={ActiveSOSScreen}
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="Helplines" component={HelplinesScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} options={{ headerShown: true, title: 'Manage Coupons' }} />
            <Stack.Screen name="AdminReferrals" component={AdminReferralsScreen} options={{ headerShown: true, title: 'Manage Referrals' }} />
            <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ headerShown: true, title: 'Global Settings' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
