import { api } from './client';
import { storage } from './storage';

/**
 * Auth for both roles.
 *  Driver: POST /driver-auth/login {mobileNumber} -> {txnId}; verify -> {token, driverId}
 *  Staff:  POST /ambulance-staff-auth/login {mobileNumber} -> {txnId, role}; verify -> {token, staffId, role}
 */

export interface SendOtpResult {
  txnId: string;
  role?: string;
  userRegister?: boolean;
}
export interface VerifyResult {
  token: string;
  id: string; // driverId or staffId
  role: 'driver' | 'staff';
}

export const driverAuth = {
  sendOtp: (mobileNumber: string) =>
    api.post<SendOtpResult>('/driver-auth/login', { mobileNumber, countryCode: '+91' }, false),
  resendOtp: (mobileNumber: string) =>
    api.post<SendOtpResult>('/driver-auth/resend-otp', { mobileNumber, countryCode: '+91' }, false),
  async verifyOtp(txnId: string, otp: string, mobileNumber?: string): Promise<VerifyResult> {
    const r = await api.post<any>(
      '/driver-auth/verify-otp',
      { txnId, otp, mobileNumber, countryCode: '+91' },
      false,
    );
    return { token: r.token, id: String(r.driverId || r.id || ''), role: 'driver' };
  },
  onboardingStatus: () => api.get('/driver-auth/onboarding-status'),
  profile: () => api.get('/driver/profile'),
  logout: () => api.post('/driver-auth/logout', {}).catch(() => undefined),
};

export const staffAuth = {
  sendOtp: (mobileNumber: string) =>
    api.post<SendOtpResult>('/ambulance-staff-auth/login', { mobileNumber, countryCode: '+91' }, false),
  resendOtp: (mobileNumber: string) =>
    api.post<SendOtpResult>('/ambulance-staff-auth/resend-otp', { mobileNumber, countryCode: '+91' }, false),
  // Backend matches the OTP record by txnId AND mobileNumber/countryCode, so
  // both must be sent or a real (non-master) OTP is rejected as invalid.
  async verifyOtp(txnId: string, otp: string, mobileNumber?: string): Promise<VerifyResult> {
    const r = await api.post<any>(
      '/ambulance-staff-auth/verify-otp',
      { txnId, otp, mobileNumber, countryCode: '+91' },
      false,
    );
    return { token: r.token, id: String(r.staffId || r.id || ''), role: 'staff' };
  },
  profile: () => api.get('/ambulance-staff/me'),
  logout: () => api.post('/ambulance-staff-auth/logout', {}).catch(() => undefined),
};

/** Register the device for push (driver via /driver, staff via /ambulance-staff). */
export const registerDevice = async (
  role: 'driver' | 'staff',
  fcmToken: string,
  platform: 'android' | 'ios',
) => {
  const deviceId = await storage.getDeviceId();
  const path = role === 'staff' ? '/ambulance-staff/fcm-token' : '/driver/notifications/fcm-token';
  return api.post(path, { fcmToken, deviceId, platform }).catch(() => undefined);
};
