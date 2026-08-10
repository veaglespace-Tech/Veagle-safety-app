import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../theme/colors';

// Dashboards
import AdminDashboardScreen from '../screens/main/AdminDashboardScreen';
import TeamLeaderDashboardScreen from '../screens/main/TeamLeaderDashboardScreen';
import MemberDashboardScreen from '../screens/main/MemberDashboardScreen';

// Common Screens
import ContactsScreen from '../screens/main/ContactsScreen';
import JourneyScreen from '../screens/main/JourneyScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Admin Placeholder Screens
import AdminUsersScreen from '../screens/main/AdminUsersScreen';
import AdminPlansScreen from '../screens/main/AdminPlansScreen';
import AdminPaymentsScreen from '../screens/main/AdminPaymentsScreen';

const Tab = createBottomTabNavigator();

const commonScreenOptions = ({ route, TAB_ICONS }) => ({
  headerShown: false,
  tabBarShowLabel: true,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textMuted,
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabLabel,
  tabBarIcon: ({ focused }) => {
    const icons = TAB_ICONS[route.name] || { focused: 'help-circle', unfocused: 'help-circle-outline' };
    const iconName = focused ? icons.focused : icons.unfocused;
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons name={iconName} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
      </View>
    );
  },
});

// -- ADMIN NAVIGATOR --
function AdminTabNavigator() {
  const TAB_ICONS = {
    Home: { focused: 'shield', unfocused: 'shield-outline' },
    Users: { focused: 'people', unfocused: 'people-outline' },
    Plans: { focused: 'options', unfocused: 'options-outline' },
    Payments: { focused: 'card', unfocused: 'card-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  return (
    <Tab.Navigator screenOptions={(props) => commonScreenOptions({ ...props, TAB_ICONS })}>
      <Tab.Screen name="Home" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Plans" component={AdminPlansScreen} />
      <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// -- TEAM LEADER NAVIGATOR --
function TeamLeaderTabNavigator() {
  const TAB_ICONS = {
    Home: { focused: 'shield', unfocused: 'shield-outline' },
    Team: { focused: 'people', unfocused: 'people-outline' },
    Journey: { focused: 'map', unfocused: 'map-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  return (
    <Tab.Navigator screenOptions={(props) => commonScreenOptions({ ...props, TAB_ICONS })}>
      <Tab.Screen name="Home" component={TeamLeaderDashboardScreen} />
      <Tab.Screen name="Team" component={ContactsScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// -- MEMBER NAVIGATOR --
function MemberTabNavigator() {
  const TAB_ICONS = {
    Home: { focused: 'shield', unfocused: 'shield-outline' },
    Guardians: { focused: 'people', unfocused: 'people-outline' },
    Journey: { focused: 'navigate', unfocused: 'navigate-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  return (
    <Tab.Navigator screenOptions={(props) => commonScreenOptions({ ...props, TAB_ICONS })}>
      <Tab.Screen name="Home" component={MemberDashboardScreen} />
      <Tab.Screen name="Guardians" component={ContactsScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RoleBasedNavigator() {
  const { user } = useSelector((state) => state.auth);
  
  // Default to 'member' if no role is explicitly defined
  const role = user?.role?.toLowerCase() || 'member';

  if (role === 'admin' || role === 'org' || role === 'super_admin' || role === 'organization') {
    return <AdminTabNavigator />;
  } else if (role === 'team-leader' || role === 'teamleader') {
    return <TeamLeaderTabNavigator />;
  } else {
    // Default to Member view
    return <MemberTabNavigator />;
  }
}

const styles = StyleSheet.create({
  tabBar: {
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
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
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
