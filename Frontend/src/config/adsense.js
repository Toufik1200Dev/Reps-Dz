/**
 * Google AdSense – Ad unit IDs
 * Replace each value with your actual ad unit ID from AdSense (Ads > By ad unit).
 * Use responsive display units; keep IDs in quotes.
 */

export const AD_CLIENT = 'ca-pub-5477601117591913';

/** Ad unit slot IDs – replace with your IDs from AdSense */
export const AD_SLOTS = {
  /** Below page header (all pages) – responsive leaderboard/banner */
  belowHeader: 'REPLACE_WITH_YOUR_SLOT_ID',

  /** Programs page – in-content, after first section (form) */
  programsInContent: 'REPLACE_WITH_YOUR_SLOT_ID',

  /** Calorie calculator – above results */
  calorieAboveResults: 'REPLACE_WITH_YOUR_SLOT_ID',

  /** Calorie calculator – below results */
  calorieBelowResults: 'REPLACE_WITH_YOUR_SLOT_ID',

  /** Calorie calculator – shown when user clicks Calculate (submit) */
  calorieOnSubmit: 'REPLACE_WITH_YOUR_SLOT_ID',

  /** Shop – between product rows (in-feed style, not near Buy buttons) */
  shopBetweenProducts: 'REPLACE_WITH_YOUR_SLOT_ID',
};

export function getAdSlot(name) {
  return AD_SLOTS[name] || AD_SLOTS.belowHeader;
}
