/**
 * Color tokens — extracted directly from the Figma file
 * "HealWin User Re-Design (node 5:595)".
 */
export const colors = {
  /** App / screen background */
  background: '#F7FCFF',
  backgroundAlt: '#F0FAFF', // "Type of ambulance" screen
  surface: '#FFFFFF',

  /** Primary text (Welcome, Rahul Kumar, Where To, nav labels) */
  textPrimary: '#262424',
  textBlack: '#000000',
  textWhite: '#FFFFFF',

  /** Brand reds */
  brandRed: '#C92525', // "Book Now" label + SOS button
  brandRedDark: '#880808', // "Healthcare Centre" heading

  /** Borders & hairlines */
  avatarBorder: 'rgba(220,220,220,0.97)',
  cardBorder: 'rgba(255,255,255,0.5)',

  /** Overlays */
  glass: 'rgba(255,255,255,0.10)',
  scrim: 'rgba(0,0,0,0.18)',

  /** Carousel dots */
  dotActive: '#C92525',
  dotInactive: 'rgba(0,0,0,0.18)',

  /** "Nearby Ambulances" / trip screen */
  ink: '#0F0F0F', // near-black headings/body
  inkMuted: '#6B7480', // secondary text
  softPurple: '#EEE9F6', // Direction / Call button background
  avatarCircle: '#DFE6ED', // trip-card avatar disc
  hairline: '#E5E5E5', // trip-card border
  callGreen: '#3DBE6B', // Call phone icon

  /** "My Credits" / wallet screen */
  inputBg: '#E2E2E2', // amount field + selected chip
  inputBorder: '#CBCBCB', // chip border
  placeholder: '#746F6F', // input placeholder
  creditGreen: '#2E9B2E', // paid check circle

  /** Service picker + centres list */
  cardLine: '#E0DFDF', // card border
  directionsBlue: '#3262C9', // Directions button
  ratingText: '#333232',
  metaGray: '#8F8F8F',
  serviceTitle: '#151921',
  serviceSub: '#989898',
  lorem: '#7D7C7C',
  // tag chips
  tagCentreBg: '#F5E1CC',
  tagCentreText: '#886823',
  tagVerifiedBg: '#DEEADB',
  tagVerifiedText: '#567A44',
  tagOtherBg: '#E0E5F2',
  tagOtherText: '#707996',
  // filter sheet
  sheetSelected: '#DFEAF8',
  sheetCancel: '#EDEDF2',
  sheetEnrolledText: '#002A5D',

  /** "Plan your Ambulance" screens */
  planBlue: '#135EBE', // selected toggle pill
  toggleBorder: '#C0C0C0',
  addrTitle: '#3C3C3C',
  addrText: '#969696',
  linkBlue: '#002A5D',
  dashBg: '#EAE9ED',
  dashBorder: '#ADADAD',

  /** Membership / documents / edit-profile */
  shieldGold: '#E6B23A',
  shieldGoldLight: '#F6D472',
  shieldSilver: '#B7BABE',
  shieldSilverLight: '#E2E4E7',
  folderBlue: '#2F6BD8',
  tabActive: '#C2C2C2',
  tabInactive: '#EEEEEE',
  profileCardBg: '#ECECEC',

  /** Tracking screen */
  chipPinkBg: '#FCDCDC', // "2 Mins" / "Pay Now" small chips
  payGreen: '#2EA45D', // Pay Now button
  plateBg: '#D9D9D9', // number-plate highlight
  trackInk: '#111111',

  /** Shadow color */
  shadow: 'rgba(0,0,0,0.25)',
} as const;

export type ColorToken = keyof typeof colors;
