/** Route param list for the driver + staff (role-based) app root stack. */
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: { mobileNumber: string; txnId: string; role: 'driver' | 'staff' };
  Onboarding: undefined;

  // Driver
  DriverHome: undefined;
  IncomingDispatch: undefined;
  ActiveDispatch: undefined;
  HospitalSelect: undefined;
  Trips: undefined;
  Earnings: undefined;
  DriverWallet: undefined;
  Shifts: undefined;
  ShiftDetail: { shift: any };
  StaffEarnings: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;

  // Staff (ambulance attendant)
  StaffHome: undefined;
  AddPatient: undefined;
  CaseNotes: undefined;
  StockRequest: undefined;
  TripHistory: undefined;
  TripDetail: { trip: any };
  ApplyLeave: undefined;
  AddLeave: undefined;
  StaffProfile: undefined;
  StaffNotifications: undefined;
};
