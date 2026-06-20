import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// Driver
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { IncomingDispatchScreen } from '../screens/IncomingDispatchScreen';
import { ActiveDispatchScreen } from '../screens/ActiveDispatchScreen';
import { HospitalSelectScreen } from '../screens/HospitalSelectScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ShiftsScreen } from '../screens/ShiftsScreen';
import { ShiftDetailScreen } from '../screens/ShiftDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

// Staff
import { StaffHomeScreen } from '../screens/StaffHomeScreen';
import { AddPatientScreen } from '../screens/AddPatientScreen';
import { CaseNotesScreen } from '../screens/CaseNotesScreen';
import { StockRequestScreen } from '../screens/StockRequestScreen';
import { TripHistoryScreen } from '../screens/TripHistoryScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { ApplyLeaveScreen } from '../screens/ApplyLeaveScreen';
import { AddLeaveScreen } from '../screens/AddLeaveScreen';
import { StaffProfileScreen } from '../screens/StaffProfileScreen';
import { StaffNotificationsScreen } from '../screens/StaffNotificationsScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Splash"
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Otp" component={OtpScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />

    {/* Driver */}
    <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
    <Stack.Screen
      name="IncomingDispatch"
      component={IncomingDispatchScreen}
      options={{ animation: 'fade', presentation: 'transparentModal' }}
    />
    <Stack.Screen name="ActiveDispatch" component={ActiveDispatchScreen} />
    <Stack.Screen name="HospitalSelect" component={HospitalSelectScreen} />
    <Stack.Screen name="Trips" component={TripsScreen} />
    <Stack.Screen name="Earnings" component={EarningsScreen} />
    <Stack.Screen name="Shifts" component={ShiftsScreen} />
    <Stack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />

    {/* Staff */}
    <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
    <Stack.Screen name="AddPatient" component={AddPatientScreen} />
    <Stack.Screen name="CaseNotes" component={CaseNotesScreen} />
    <Stack.Screen name="StockRequest" component={StockRequestScreen} />
    <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
    <Stack.Screen name="TripDetail" component={TripDetailScreen} />
    <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
    <Stack.Screen name="AddLeave" component={AddLeaveScreen} />
    <Stack.Screen name="StaffProfile" component={StaffProfileScreen} />
    <Stack.Screen name="StaffNotifications" component={StaffNotificationsScreen} />
  </Stack.Navigator>
);
