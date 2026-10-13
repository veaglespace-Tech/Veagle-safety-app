import React, { useEffect, useCallback, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../utils/constants';
import { fetchUser, setToken, bootstrapComplete } from '../redux/slices/authSlice';

// Core navigators
import RoleBasedNavigator from './RoleBasedNavigator';
import AuthNavigator      from './AuthNavigator';

// Always-visible screens
import SplashScreen              from '../screens/auth/SplashScreen';
import GlobalEmergencyListener   from '../components/common/GlobalEmergencyListener';
import { useLocation }           from '../hooks/useLocation';

// Lazy-loaded modal & overlay screens
import ActiveSOSScreen           from '../screens/sos/ActiveSOSScreen';
import HelplinesScreen           from '../screens/helplines/HelplinesScreen';

// Informational screens
import AboutScreen               from '../screens/info/AboutScreen';
import PrivacyScreen             from '../screens/info/PrivacyScreen';
import TermsScreen               from '../screens/info/TermsScreen';
import HelpScreen                from '../screens/info/HelpScreen';
import HelpContactScreen         from '../screens/info/HelpContactScreen';

// Admin feature screens
import AdminCouponsScreen        from '../screens/main/AdminCouponsScreen';
import AdminReferralsScreen      from '../screens/main/AdminReferralsScreen';
import AdminSettingsScreen       from '../screens/main/AdminSettingsScreen';

// Feature screens
import GalleryScreen             from '../screens/main/GalleryScreen';
import AdminEnquiriesScreen      from '../screens/main/AdminEnquiriesScreen';
import UserSettingsScreen        from '../screens/main/UserSettingsScreen';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const Stack = createNativeStackNavigator();

/** Default screen options — avoids creating a new object on every render */
const SCREEN_OPTIONS = { headerShown: false, animation: 'fade_from_bottom' };

/** Consistent header style for admin/settings screens */
const ADMIN_HEADER_OPTIONS = (title) => ({
  headerShown: true,
  title,
  headerBackTitle: '',
  headerStyle: { backgroundColor: '#FFF0F3' },
  headerTintColor: '#FF2A6D',
  headerTitleStyle: { fontWeight: '900', fontSize: 15 },
});

// ---------------------------------------------------------------------------
// LocationManager — renders nothing, runs the location hook
// ---------------------------------------------------------------------------

function LocationManager() {
  useLocation();
  return null;
}

// ---------------------------------------------------------------------------
// Bootstrap hook — reads the stored token once on mount
// ---------------------------------------------------------------------------

function useBootstrap() {
  const dispatch = useDispatch();
  const { token, user, isBootstrapping } = useSelector((state) => state.auth);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          dispatch(setToken(storedToken));
          await dispatch(fetchUser());
        }
      } catch {
        // If AsyncStorage fails, fall through to the auth flow
      } finally {
        dispatch(bootstrapComplete());
      }
    })();
  }, [dispatch]);

  const isAuthenticated = useMemo(() => !!(token && user), [token, user]);

  return { isBootstrapping, isAuthenticated };
}

// ---------------------------------------------------------------------------
// AppNavigator
// ---------------------------------------------------------------------------

export default function AppNavigator() {
  const { isBootstrapping, isAuthenticated } = useBootstrap();

  if (isBootstrapping) return <SplashScreen />;

  return (
    <>
      <GlobalEmergencyListener />
      {isAuthenticated && <LocationManager />}

      <NavigationContainer>
        <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
          {!isAuthenticated ? (
            // ── Auth Flow ──────────────────────────────────────────────────
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            // ── Authenticated Flow ─────────────────────────────────────────
            <>
              <Stack.Screen name="Main" component={RoleBasedNavigator} />

              {/* Emergency overlay — full-screen modal */}
              <Stack.Screen
                name="ActiveSOS"
                component={ActiveSOSScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />

              {/* Safety resources */}
              <Stack.Screen name="Helplines"   component={HelplinesScreen} />

              {/* Informational */}
              <Stack.Screen name="About"       component={AboutScreen} />
              <Stack.Screen name="Privacy"     component={PrivacyScreen} />
              <Stack.Screen name="Terms"       component={TermsScreen} />
              <Stack.Screen name="Help"        component={HelpScreen} />
              <Stack.Screen name="HelpContact" component={HelpContactScreen} />

              {/* Admin tools */}
              <Stack.Screen
                name="AdminCoupons"
                component={AdminCouponsScreen}
                options={ADMIN_HEADER_OPTIONS('Manage Coupons')}
              />
              <Stack.Screen
                name="AdminReferrals"
                component={AdminReferralsScreen}
                options={ADMIN_HEADER_OPTIONS('Manage Referrals')}
              />
              <Stack.Screen
                name="AdminSettings"
                component={AdminSettingsScreen}
                options={ADMIN_HEADER_OPTIONS('Global Settings')}
              />
              <Stack.Screen
                name="AdminEnquiries"
                component={AdminEnquiriesScreen}
                options={ADMIN_HEADER_OPTIONS('Enquiries')}
              />

              {/* Feature screens */}
              <Stack.Screen name="Gallery"      component={GalleryScreen} />
              <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
