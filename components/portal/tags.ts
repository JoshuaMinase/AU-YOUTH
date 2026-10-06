import s from '../../styles/Portal.module.css';

/** news tag → colour class (plain module so server components can use it) */
export const TAG_CLASS: Record<string, string> = {
  Initiative: s.tGreen, Opportunity: s.tGold, Event: s.tBlue, Development: s.tPlum, Partnership: s.tTeal, Announcement: s.tMuted,
};
