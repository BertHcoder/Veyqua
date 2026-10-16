import type { CareEventType } from '../lib/types';
import type { IconName } from './Icon';

export const CARE_ICON: Record<CareEventType, IconName> = {
  'water-change': 'drop',
  filter: 'filter',
  cleaning: 'sparkle',
  dosing: 'flask',
  medication: 'pill',
  livestock: 'fish',
  other: 'dots',
};
