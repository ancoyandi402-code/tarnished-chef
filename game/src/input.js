// Keyboard and pointer input. One-shot presses are queued as bit flags and taken once by
// the loop, so a press between two frames is never lost and never counted twice. Clicks and
// ingredient keys are queued too; the loop takes them all each frame. Click positions are
// reported in the playfield's logical coordinates (1280x720), matching the renderer.

import { FIELD, INGREDIENTS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_CLEAR = 8;
export const ACTION_SHOP = 16;

const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const SERVE_KEYS = new Set(['Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const CLEAR_KEYS = new Set(['KeyC', 'Backspace']);
const SHOP_KEYS = new Set(['KeyS']);
const INGREDIENT_KEYS = new Map();
for (const ingredient of INGREDIENTS) INGREDIENT_KEYS.set('Digit' + ingredient.key, ingredient.id);

export function createInput(target) {
  let actions = 0;
  const ingredientQueue = [];
  const clickQueue = [];

  function toLogical(clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (INGREDIENT_KEYS.has(event.code)) {
      ingredientQueue.push(INGREDIENT_KEYS.get(event.code));
      event.preventDefault();
      return;
    }
    if (CONFIRM_KEYS.has(event.code)) actions |= ACTION_CONFIRM;
    if (SERVE_KEYS.has(event.code)) actions |= ACTION_SERVE;
    if (PAUSE_KEYS.has(event.code)) actions |= ACTION_PAUSE;
    if (CLEAR_KEYS.has(event.code)) actions |= ACTION_CLEAR;
    if (SHOP_KEYS.has(event.code)) actions |= ACTION_SHOP;
    if (CONFIRM_KEYS.has(event.code) || SERVE_KEYS.has(event.code) || PAUSE_KEYS.has(event.code) || CLEAR_KEYS.has(event.code) || SHOP_KEYS.has(event.code)) {
      event.preventDefault();
    }
  });

  target.addEventListener('pointerdown', (event) => {
    actions |= ACTION_CONFIRM;
    clickQueue.push(toLogical(event.clientX, event.clientY));
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Ingredient ids pressed (keys 1-8) since the last call, in order. */
    takeIngredients() {
      if (ingredientQueue.length === 0) return ingredientQueue;
      const taken = ingredientQueue.slice();
      ingredientQueue.length = 0;
      return taken;
    },
    /** Click positions since the last call, in logical coordinates, in order. */
    takeClicks() {
      if (clickQueue.length === 0) return clickQueue;
      const taken = clickQueue.slice();
      clickQueue.length = 0;
      return taken;
    },
  };
}
