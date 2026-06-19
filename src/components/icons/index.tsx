import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '../../theme';

export interface IconProps {
  size?: number;
  color?: string;
  /** Stroke width for outline icons. */
  strokeWidth?: number;
}

const DEFAULT_SIZE = 24;

/** Box / stock carton — outline. */
export const BoxIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <Path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </G>
  </Svg>
);

/** Clipboard / notes — outline. */
export const NotesIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4h12v17H6z" />
      <Path d="M9 4V2.8h6V4" />
      <Path d="M9 9.5h6M9 13h6M9 16.5h4" />
    </G>
  </Svg>
);

/** Chevron-back (‹) — outline. */
export const ChevronBackIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Notification bell — outline. */
export const BellIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.1 21a2 2 0 0 0 3.8 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Home — outline. */
export const HomeIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.8 12 3l9 6.8V20a1 1 0 0 1-1 1h-4.5v-6.2h-7V21H4a1 1 0 0 1-1-1Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Family care — two people (group) outline. */
export const FamilyCareIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8} r={3.2} />
      <Path d="M3.2 20c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4" />
      <Path d="M16 5.2a3 3 0 0 1 0 5.8" />
      <Path d="M17 14.8c2.5.5 4 2.6 4 5.2" />
    </G>
  </Svg>
);

/** Phone handset (filled) — used for the SOS button. */
export const PhoneIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textWhite,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .56 3.5 1 1 0 0 1-.25 1Z"
      fill={color}
    />
  </Svg>
);

/** Chevron-forward (›) — outline. */
export const ChevronForwardIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 6L15 12L9 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Edit / pencil — outline. */
export const EditIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20h4L19 9a2 2 0 0 0-2.8-2.8L5 17.2 4 20Z" />
      <Path d="M14.5 7.5 17 10" />
    </G>
  </Svg>
);

/** Calendar / bookings — outline. */
export const BookingIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5Z" />
      <Path d="M8 3.5V6M16 3.5V6M4 9.5h16" />
    </G>
  </Svg>
);

/** Settings / gear — outline. */
export const SettingsIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 7 19.5l-.1.1A2 2 0 1 1 4 16.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.5 7l-.1-.1A2 2 0 1 1 7.2 4.1l.1.1A1.6 1.6 0 0 0 9 4.6V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1A2 2 0 1 1 20 8l-.1.1a1.6 1.6 0 0 0 .3 1.8 1.6 1.6 0 0 0 1.2.5H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
    </G>
  </Svg>
);

/** Help / question — outline. */
export const HelpIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M9.5 9.2a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2.2-2.3 3.6" />
      <Path d="M12 17.2h.01" />
    </G>
  </Svg>
);

/** Logout — outline. */
export const LogoutIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <Path d="M16 16l5-4-5-4M21 12H9" />
    </G>
  </Svg>
);

/** Filter / sliders — outline. */
export const FilterIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7h11M19 7h1M4 17h3M11 17h9" />
      <Circle cx={17} cy={7} r={2.2} />
      <Circle cx={9} cy={17} r={2.2} />
    </G>
  </Svg>
);

/** Circular refresh arrow — used on the "Rebook" button. */
export const RebookIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.brandRedDark,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 11a8 8 0 1 0-.6 4" />
      <Path d="M20 4v5h-5" />
    </G>
  </Svg>
);

/** Minus (–). */
export const MinusIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textBlack,
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** Envelope / mail — outline. */
export const MailIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 6.5h17v11h-17z" />
      <Path d="M4 7l8 6 8-6" />
    </G>
  </Svg>
);

/** Warning triangle (filled) — emergencies. */
export const WarningIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#E2342B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3 22 20H2z" fill={color} />
    <Path d="M12 9v5" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={1.1} fill="#FFFFFF" />
  </Svg>
);

/** Stethoscope-ish doctor glyph (outline). */
export const DoctorIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.folderBlue,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4v5a4 4 0 0 0 8 0V4" />
      <Path d="M4 4h3M13 4h3" />
      <Path d="M10 17a5 5 0 0 0 8 0v-2" />
      <Circle cx={18} cy={12} r={2.2} />
    </G>
  </Svg>
);

/** Lab flask (outline). */
export const FlaskIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.folderBlue,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
      <Path d="M7.5 15h9" />
    </G>
  </Svg>
);

/** Plus (+) — two strokes. */
export const PlusIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textBlack,
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** Close (×). */
export const CloseIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** Magnifier. */
export const SearchIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = '#979797',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.2-3.2" />
    </G>
  </Svg>
);

/** Cloud with up-arrow — file upload. */
export const UploadCloudIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 17a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6-1.03A3.75 3.75 0 0 1 17.5 17" />
      <Path d="M12 12v8M9 14.5 12 11.5 15 14.5" />
    </G>
  </Svg>
);

/** Shield badge — two-tone (pass `color`/`light` for silver vs gold). */
export const ShieldBadgeIcon: React.FC<IconProps & { light?: string }> = ({
  size = DEFAULT_SIZE,
  color = '#E6B23A',
  light = '#F6D472',
}) => (
  <Svg width={size} height={size} viewBox="0 0 64 72" fill="none">
    <Path d="M32 3 58 12v22c0 17-12 28-26 35C18 62 6 51 6 34V12z" fill={color} />
    <Path d="M32 3 58 12v22c0 17-12 28-26 35V3z" fill={light} opacity={0.55} />
    <Path
      d="M32 9 52 16v18c0 13.5-9.4 22.4-20 28C21.4 56.4 12 47.5 12 34V16z"
      fill="none"
      stroke="#FFFFFF"
      strokeOpacity={0.5}
      strokeWidth={1.5}
    />
  </Svg>
);

/** Blue rounded folder tile. */
export const FolderTileIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#2F6BD8' }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path d="M0 12a12 12 0 0 1 12-12h40a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H12A12 12 0 0 1 0 52z" fill={color} />
    <Path d="M14 22h13l4 4h19a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2z" fill="#FFFFFF" opacity={0.95} />
    <Path d="M14 26l4-4h13l4 4z" fill="#DCE6FB" />
  </Svg>
);

/** Document file with lines (blue accent). */
export const FileDocIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#2F6BD8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#EAF1FE" stroke={color} strokeWidth={1.3} />
    <Path d="M14 2v5h5" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    <Path d="M8 13h8M8 16.5h8M8 9.5h3" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
  </Svg>
);

/** Filled circle with a check — used for paid/success status. */
export const CheckCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = '#2E9B2E',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} fill={color} />
    <Path
      d="M7 12.5l3.2 3.2L17 9"
      stroke="#FFFFFF"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Wallet — outline. */
export const WalletIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H18a2 2 0 0 1 2 2v1H5a2 2 0 0 1-2-2Z" />
      <Path d="M3 8v9.5A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5V11a1.5 1.5 0 0 0-1.5-1.5H4.5" />
      <Circle cx={16.5} cy={14} r={1.2} fill={color} stroke="none" />
    </G>
  </Svg>
);

/** Chevron-down (▾) — outline. */
export const ChevronDownIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Single person — outline. */
export const PersonIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={3.6} />
      <Path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </G>
  </Svg>
);

/** Person with a plus — add contact. */
export const PersonAddIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={10} cy={8} r={3.4} />
      <Path d="M3.5 20c0-3.4 2.9-5.8 6.5-5.8 1.4 0 2.7.35 3.8 1" />
      <Path d="M18 14.5v5M15.5 17h5" />
    </G>
  </Svg>
);

/** External-link / open arrow (diagonal). */
export const ExternalLinkIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 7h8v8" />
      <Path d="M17 7L7 17" />
    </G>
  </Svg>
);

/** Clock — outline (estimated time). */
export const ClockIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7.5V12l3 2" />
    </G>
  </Svg>
);

/** Red location pin (map marker). */
export const MapPinIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#E2342B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.2c-4 0-7.2 3.1-7.2 7 0 5 7.2 12.6 7.2 12.6S19.2 14.2 19.2 9.2c0-3.9-3.2-7-7.2-7Z"
      fill={color}
    />
    <Circle cx={12} cy={9} r={2.7} fill="#FFFFFF" />
  </Svg>
);

/** Origin marker — concentric ring (pickup). */
export const OriginMarkerIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#6B0404' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8} fill="none" stroke={color} strokeWidth={3} />
    <Circle cx={12} cy={12} r={2.6} fill={color} />
  </Svg>
);

/** Destination marker — filled square (drop). */
export const DestMarkerIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#6B0404' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 5h14v14H5z" fill={color} />
    <Path d="M10 10h4v4h-4z" fill="#FFFFFF" />
  </Svg>
);

/** Filled star — rating. */
export const StarIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#F5B301' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.3l5.8-.8z"
      fill={color}
      stroke={color}
      strokeWidth={1}
      strokeLinejoin="round"
    />
  </Svg>
);

/** List / lines — top-right of the centres list. */
export const ListIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Path d="M8 7h12M8 12h12M8 17h12" />
      <Circle cx={4} cy={7} r={0.9} fill={color} stroke="none" />
      <Circle cx={4} cy={12} r={0.9} fill={color} stroke="none" />
      <Circle cx={4} cy={17} r={0.9} fill={color} stroke="none" />
    </G>
  </Svg>
);

/** Turn / directions arrow (filled, white) — Directions button. */
export const DirectionsArrowIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.textWhite,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 17v-3a3 3 0 0 1 3-3h8" />
      <Path d="M13 7l4 4-4 4" />
    </G>
  </Svg>
);

/** Hospital building — colored illustration for the service picker / list sheet. */
export const HospitalBuildingIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#3D7BE0' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M8 20 24 9l16 11v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill={color} />
    <Path d="M14 24h20v15H14z" fill="#EAF2FE" />
    <Path d="M22 16h4v3h3v4h-3v3h-4v-3h-3v-4h3z" fill={color} />
    <Path d="M19 30h4v9h-4zM25 30h4v9h-4z" fill={color} opacity={0.55} />
  </Svg>
);

/** Pharmacy — capsule + bottle colored illustration. */
export const PharmacyIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M12 16h16v22a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#4FB6E6" />
    <Path d="M11 12h18v6H11z" fill="#2E8FCB" />
    <Path d="M16 22h8v3h-8z" fill="#FFFFFF" />
    <Path d="M18.5 19.5h3v8h-3z" fill="#FFFFFF" />
    <G transform="rotate(40 33 30)">
      <Path d="M27 26h12a5 5 0 0 1 0 10H27a5 5 0 0 1 0-10z" fill="#7FD6A6" />
      <Path d="M33 26h6a5 5 0 0 1 0 10h-6z" fill="#3FB87E" />
    </G>
  </Svg>
);

/** Shield with a plus — HealWin Centre / Pharmacy filter. */
export const ShieldPlusIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#3262C9' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.5 20 5v6c0 5-3.5 8.5-8 10.5C7.5 19.5 4 16 4 11V5z" fill={color} />
    <Path d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="#FFFFFF" />
  </Svg>
);

/** Shield with a check — HealWin enrolled / verified filter. */
export const ShieldCheckIcon: React.FC<IconProps> = ({ size = DEFAULT_SIZE, color = '#1FA6A0' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.5 20 5v6c0 5-3.5 8.5-8 10.5C7.5 19.5 4 16 4 11V5z" fill={color} />
    <Path
      d="M8.5 12l2.3 2.3L15.5 9.5"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Small ambulance glyph for the "Where To?" search row. */
export const AmbulanceGlyphIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = colors.brandRed,
}) => (
  <Svg width={size} height={size * 0.62} viewBox="0 0 64 40" fill="none">
    <G stroke={color} strokeWidth={2.4} strokeLinejoin="round" fill="none">
      <Path d="M3 12h30v18H3z" />
      <Path d="M33 17h13l9 8v5H33z" />
      <Circle cx={16} cy={32} r={5} fill={colors.surface} />
      <Circle cx={46} cy={32} r={5} fill={colors.surface} />
    </G>
    <Path d="M16 18v8M12 22h8" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
