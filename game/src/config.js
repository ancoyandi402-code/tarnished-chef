// Every tuning number, colour, dish and ingredient in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size. Money is counted in thousands of rupiah and shown as "Rp 48k".
//
// TARNISHED CHEF — a cooking tale from the Lands Between. The chef is a Tarnished, a
// survivor cast out of time, who orders ingredients from across the ages with a glowing
// "Aplikasi Shoping". The folk of the Lands Between gather at the stall, amazed by dishes
// no one in this age has ever tasted.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; when it runs out the stall closes and the game ends. */
export const SHIFT_SECONDS = 90;

/** How many customers may walk out angry before the shift ends early. */
export const MAX_WALKOUTS = 3;

/** At most this many orders on the board at once. */
export const MAX_ORDERS = 3;

export const LEVEL = { seconds: 30, max: 3 };

/** The last seconds of the shift are the rush: orders arrive faster and pay double. */
export const RUSH_START = 60;

/** A cooked dish left on the plate this long overcooks and must be thrown away. */
export const PLATE_BURN_SECONDS = 6;

/** The ingredients on the counter, in the order they sit there (keys 1-8). */
export const INGREDIENTS = [
  { id: 'nasi', name: 'NASI', key: '1', color: '#f5efe0', dark: '#8a7d5f' },
  { id: 'mie', name: 'MIE', key: '2', color: '#e8c97a', dark: '#8a6d2f' },
  { id: 'telur', name: 'TELUR', key: '3', color: '#f2c94c', dark: '#8a6d1f' },
  { id: 'daging', name: 'DAGING', key: '4', color: '#e8862e', dark: '#7a3d12' },
  { id: 'sayur', name: 'SAYUR', key: '5', color: '#4caf50', dark: '#1f5c22' },
  { id: 'cabai', name: 'CABAI', key: '6', color: '#d9382b', dark: '#6e130c' },
  { id: 'kecap', name: 'KECAP', key: '7', color: '#5b3a1e', dark: '#2b1a0c' },
  { id: 'teh', name: 'TEH', key: '8', color: '#c98a2e', dark: '#5f3d10' },
];

/**
 * The ingredients only the Aplikasi Shoping can bring, ordered from across time. Each one
 * is bought with a shop order and takes a few seconds to arrive. They are what the fusion
 * dishes are made of.
 */
export const TIME_INGREDIENTS = [
  { id: 'telur_naga', name: 'TELUR NAGA', era: 'zaman purba', color: '#8e2f5c', dark: '#3d1027' },
  { id: 'cabai_neon', name: 'CABAI NEON', era: 'masa neon', color: '#ff2e88', dark: '#6e0f3d' },
  { id: 'mie_instan', name: 'MIE INSTAN', era: 'masa depan', color: '#ffe14d', dark: '#7a6410' },
  { id: 'keju_leleh', name: 'KEJU LELEH', era: 'masa depan', color: '#ffb02e', dark: '#6e4a05' },
  { id: 'jamur_ajaib', name: 'JAMUR AJAIB', era: 'zaman mistis', color: '#7b5cff', dark: '#2c1a6e' },
];

/** Seconds an ingredient ordered through the app takes to arrive. */
export const DELIVERY_SECONDS = 4;
/** At most this many deliveries in flight at once. */
export const MAX_DELIVERIES = 2;
/** At most this many shop orders in one shift. */
export const MAX_SHOP_ORDERS = 3;

/** The menu. A fusion dish needs at least one time ingredient from the app. */
export const DISHES = [
  { id: 'nasgor', name: 'NASI GORENG', recipe: ['nasi', 'telur', 'daging'], reward: 15, cook: 2.5, fusion: false },
  { id: 'miegor', name: 'MIE GORENG', recipe: ['mie', 'telur', 'sayur'], reward: 13, cook: 2.5, fusion: false },
  { id: 'sate', name: 'SATE', recipe: ['daging', 'kecap', 'cabai'], reward: 18, cook: 3.0, fusion: false },
  { id: 'esteh', name: 'ES TEH', recipe: ['teh'], reward: 5, cook: 1.0, fusion: false },
  { id: 'nasgor_naga', name: 'NASI GORENG NAGA', recipe: ['nasi', 'telur_naga', 'cabai_neon'], reward: 35, cook: 3.0, fusion: true },
  { id: 'mie_depan', name: 'MIE INSTAN MASA DEPAN', recipe: ['mie_instan', 'telur', 'keju_leleh'], reward: 30, cook: 3.0, fusion: true },
  { id: 'sup_jamur', name: 'SUP JAMUR AJAIB', recipe: ['jamur_ajaib', 'sayur', 'daging'], reward: 28, cook: 3.0, fusion: true },
];

/** The folk who come to the stall. A VIP is a dragon: gold card, little patience, pays 3x. */
export const CUSTOMERS = [
  { id: 'knight', name: 'Kesatria', patienceMul: 1.0, payMul: 1.0 },
  { id: 'villager', name: 'Penduduk', patienceMul: 1.0, payMul: 1.0 },
  { id: 'sorceress', name: 'Penyihir', patienceMul: 0.6, payMul: 1.2 },
  { id: 'merchant', name: 'Pedagang', patienceMul: 1.5, payMul: 1.3 },
];

/** A perfect Wok Hei (tossing while the flame is in the green zone) pays this bonus. */
export const WOK_HEI_BONUS = 5;
/** The green Wok Hei zone, as a fraction of the cook's progress (0-1). */
export const WOK_HEI_ZONE = { from: 0.55, to: 0.85 };

/** Fast-serve bonus, paid when a dish is served with more than half its patience left. */
export const FAST_BONUS = 3;

/** The combo multiplier caps here; each serve without a walk-out or a burn raises it by 1. */
export const COMBO_MAX = 5;

/** Patience (seconds) an order starts with, by level; a new order's patience. */
export const PATIENCE = { base: 22, perLevel: -3, min: 13 };

/** Seconds between new orders arriving, by level (halved again during the rush). */
export const SPAWN = { base: 5.0, perLevel: -0.8, min: 2.6 };

/** How many ingredients the wok holds at most. */
export const WOK_MAX = 4;

/** The VIP dragon appears once, around this many seconds into the shift. */
export const VIP_AT_SECONDS = 45;
/** The VIP's patience is short, and it pays this many times the dish's reward. */
export const VIP_PATIENCE = 10;
export const VIP_PAY_MUL = 3;

export const PALETTE = {
  backdrop: '#17120e',
  wall: '#1f1811',
  counterTop: '#3a2a1a',
  panel: '#f5e6c8',
  panelDark: '#2e2115',
  ink: '#2b1d12',
  text: '#f5e6c8',
  muted: '#c9b18a',
  accent: '#e8862e',
  chili: '#d9382b',
  good: '#4caf50',
  gold: '#f2c94c',
  wok: '#1c1c22',
  plate: '#f5efe0',
  disabled: '#6b5b45',
  appGlow: '#39d5ff',
  appPanel: '#0e2a33',
  vip: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best money is kept between visits (this browser only). */
export const BEST_KEY = 'tarnished-chef.best';
