# HealWin Driver + Staff (New) — React Native

Combined **driver & ambulance-staff** app (role-based), built on the **same bare React
Native (CLI) + TypeScript stack and theme as `healwin_patient_new`**. Front-end only
(in-memory stores, sample data) — ready to wire to the backend dispatch/driver/staff APIs.

Mirrors the original Flutter `healwin_driver`, which already shipped both **driver** and
**attendant (staff)** roles in one app.

## Role flow
**Splash → Login → OTP → Role Picker** → *Driver* (→ Onboarding → Driver Home) or
*Staff* (→ Staff Home). Role is held in `src/state/roleStore.ts` (a Driver/Staff picker
stands in until the backend login returns the role).

## Stack
- React Native 0.74.5 (bare CLI, no Expo) · TypeScript · React 18.2
- Metro + Babel · `@react-navigation/native` native-stack
- `react-native-svg` + transformer (shared icon set & logo from the patient app)
- Poppins fonts (linked via `npm run fonts`)

## Driver role
- **Driver Home** — On/Off **duty toggle**, active-dispatch banner or "waiting for
  dispatches" with a *Simulate incoming dispatch* action, and quick tiles.
- **Incoming Dispatch** — full-screen emergency alert: priority, patient location,
  **count-down to respond**, Accept / Reject.
- **Active Dispatch** — map, patient + route, **status stepper** (`ACKNOWLEDGED →
  EN_ROUTE → ON_SCENE → COMPLETED`), Call / Navigate, status-advancing CTA.
- **My Trips**, **Earnings**, **My Shifts**, **Profile**, **Notifications**.

## Staff (ambulance attendant) role
- **Staff Home** — duty toggle, current assigned case, quick actions.
- **Add Patient**, **Case Notes** (vitals + notes), **Stock Update Request**,
  **Trip History**, **Leave Management** + **Apply Leave**, **Staff Profile**,
  **Staff Notifications**.

State lives in `src/state/` — `roleStore`, `dutyStore`, `dispatchStore` (driver),
and `stores.ts` (staff duty/patients/leaves), all via `useSyncExternalStore`.

## Run
```bash
cd healwin_driver_new
npm install
npm run fonts        # link Poppins into native projects
npm start            # Metro
npm run android      # or: npm run ios
```
