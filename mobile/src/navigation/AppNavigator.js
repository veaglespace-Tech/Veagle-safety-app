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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
