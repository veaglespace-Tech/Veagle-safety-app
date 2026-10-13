import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../theme/colors';
import { ROLES } from '../redux/slices/authSlice';

// Dashboards — one per role
import AdminDashboardScreen        from '../screens/main/AdminDashboardScreen';
import DashboardScreen             from '../screens/main/DashboardScreen';
import OrganizationDashboardScreen from '../screens/main/OrganizationDashboardScreen';
import ParentDashboardScreen       from '../screens/main/ParentDashboardScreen';

// Common screens
import ContactsScreen from '../screens/main/ContactsScreen';
import JourneyScreen  from '../screens/main/JourneyScreen';
import ProfileScreen  from '../screens/main/ProfileScreen';
import AlarmScreen    from '../screens/main/AlarmScreen';

// Admin-only screens
import AdminUsersScreen    from '../screens/main/AdminUsersScreen';
import AdminPaymentsScreen from '../screens/main/AdminPaymentsScreen';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator();

/** Shared tab bar appearance */
const TAB_BAR_STYLE = {
  backgroundColor: COLORS.surface,
  borderTopWidth: 1.5,
  borderTopColor: COLORS.primaryBorder,
  paddingTop: 6,
  paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  height: Platform.OS === 'ios' ? 82 : 68,
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.10,
  shadowRadius: 12,
  elevation: 12,
};

const TAB_LABEL_STYLE = {
  fontSize: 10,
  fontWeight: '700',
  marginTop: 2,
  letterSpacing: 0.3,
};

// ---------------------------------------------------------------------------
// Shared screen options factory
// ---------------------------------------------------------------------------

/**
 * Returns screenOptions for a Tab.Navigator.
 * TAB_ICONS is passed in so each navigator controls its own icons.
 */
const makeScreenOptions = (TAB_ICONS) => ({ route }) => ({
  headerShown: false,
  tabBarShowLabel: true,
  tabBarActiveTintColor:   COLORS.primary,
  tabBarInactiveTintColor: COLORS.textMuted,
  tabBarStyle:      TAB_BAR_STYLE,
  tabBarLabelStyle: TAB_LABEL_STYLE,
  tabBarIcon: ({ focused }) => {
    const icons    = TAB_ICONS[route.name] || { focused: 'help-circle', unfocused: 'help-circle-outline' };
    const iconName = focused ? icons.focused : icons.unfocused;
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={iconName}
          size={22}
          color={focused ? COLORS.primary : COLORS.textMuted}
        />
      </View>
    );
  },
});

// ---------------------------------------------------------------------------
// Per-role Tab Navigators
// ---------------------------------------------------------------------------

/** Super Admin — full management access */
function AdminTabNavigator() {
  const screenOptions = useMemo(() => makeScreenOptions({
    Home:     { focused: 'shield',  unfocused: 'shield-outline' },
    Users:    { focused: 'people',  unfocused: 'people-outline' },
    Payments: { focused: 'card',    unfocused: 'card-outline' },
    Profile:  { focused: 'person',  unfocused: 'person-outline' },
  }), []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home"     component={AdminDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Users"    component={AdminUsersScreen} />
      <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** Regular User — safety-focused features */
function UserTabNavigator() {
  const screenOptions = useMemo(() => makeScreenOptions({
    Home:     { focused: 'shield',       unfocused: 'shield-outline' },
    Contacts: { focused: 'people',       unfocused: 'people-outline' },
    Journey:  { focused: 'navigate',     unfocused: 'navigate-outline' },
    Alarm:    { focused: 'alert-circle', unfocused: 'alert-circle-outline' },
    Profile:  { focused: 'person',       unfocused: 'person-outline' },
  }), []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home"     component={DashboardScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen}  options={{ tabBarLabel: 'Guardians' }} />
      <Tab.Screen name="Journey"  component={JourneyScreen} />
      <Tab.Screen name="Alarm"    component={AlarmScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** Organisation admin */
function OrganizationTabNavigator() {
  const screenOptions = useMemo(() => makeScreenOptions({
    Home:    { focused: 'business', unfocused: 'business-outline' },
    Profile: { focused: 'person',   unfocused: 'person-outline' },
  }), []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home"    component={OrganizationDashboardScreen} options={{ tabBarLabel: 'Org Portal' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** Parent / Guardian */
function ParentTabNavigator() {
  const screenOptions = useMemo(() => makeScreenOptions({
    Home:    { focused: 'heart',  unfocused: 'heart-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  }), []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home"    component={ParentDashboardScreen} options={{ tabBarLabel: 'Parent Portal' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Role selector map — keeps the switch logic declarative
// ---------------------------------------------------------------------------

const ROLE_NAVIGATOR_MAP = {
  [ROLES.SUPER_ADMIN]:  AdminTabNavigator,
  [ROLES.ORGANIZATION]: OrganizationTabNavigator,
  [ROLES.PARENT]:       ParentTabNavigator,
  [ROLES.USER]:         UserTabNavigator,
};

// ---------------------------------------------------------------------------
// Root export — picks the correct navigator based on the logged-in user's role
// ---------------------------------------------------------------------------

export default function RoleBasedNavigator() {
  const role = useSelector((state) =>
    state.auth.user?.role?.toUpperCase() || ROLES.USER,
  );

  // Resolve the navigator component, default to UserTabNavigator for unknown roles
  const Navigator = ROLE_NAVIGATOR_MAP[role] ?? UserTabNavigator;

  return <Navigator />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryBg,
  },
});
