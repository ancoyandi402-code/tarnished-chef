// The game's rules and state, with no drawing and no browser in it: the orders on the
// board, the wok, the cooking and its Wok Hei moment, the plate and its burn, the combo,
// the rush hour, the VIP dragon, and the Aplikasi Shoping that brings ingredients from
// across time. step() advances one fixed step and returns what happened as bit flags, so
// the caller can react without the world knowing about screens or sound. Nothing here
// allocates after createWorld returns.

import {
  COMBO_MAX, CUSTOMERS, DELIVERY_SECONDS, DISHES, FAST_BONUS, LEVEL, MAX_DELIVERIES,
  MAX_ORDERS, MAX_SHOP_ORDERS, MAX_WALKOUTS, PATIENCE, PLATE_BURN_SECONDS, RUSH_START,
  SHIFT_SECONDS, SPAWN, TIME_INGREDIENTS, VIP_AT_SECONDS, VIP_PATIENCE, VIP_PAY_MUL,
  WOK_HEI_BONUS, WOK_HEI_ZONE, WOK_MAX,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_WALKOUT = 2;
export const EVENT_OVER = 4;
export const EVENT_COOKED = 8;
export const EVENT_BURNT = 16;
export const EVENT_DELIVERED = 32;
export const EVENT_VIP = 64;

function dishById(id) {
  for (let i = 0; i < DISHES.length; i += 1) if (DISHES[i].id === id) return DISHES[i];
  return DISHES[0];
}

function timeIngredientById(id) {
  for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) if (TIME_INGREDIENTS[i].id === id) return TIME_INGREDIENTS[i];
  return null;
}

/** True when the wok's ingredients are exactly the dish's recipe, in any order. */
function matchesRecipe(wok, recipe) {
  if (wok.length !== recipe.length) return false;
  for (let i = 0; i < recipe.length; i += 1) if (wok.indexOf(recipe[i]) === -1) return false;
  return true;
}

export function createWorld(random) {
  const state = {
    money: 0, served: 0, walkouts: 0, combo: 1,
    timeLeft: SHIFT_SECONDS, elapsed: 0, level: 1, rush: false,
    orders: [], wok: [], cooking: null, plate: null,
    deliveries: [], tray: [], shopOrdersLeft: MAX_SHOP_ORDERS,
    vipSpawned: false, vipServed: false,
    spawnTimer: 1.2, nextOrderId: 1, over: false, overReason: '',
    lastServe: null, lastWalkoutVip: false,
  };

  function patienceForLevel() {
    return Math.max(PATIENCE.min, PATIENCE.base + PATIENCE.perLevel * (state.level - 1));
  }

  function spawnInterval() {
    const base = Math.max(SPAWN.min, SPAWN.base + SPAWN.perLevel * (state.level - 1));
    return state.rush ? base / 2 : base;
  }

  function pickCustomer() {
    const roll = random();
    if (roll < 0.55) return CUSTOMERS[0];
    if (roll < 0.8) return CUSTOMERS[1];
    if (roll < 0.92) return CUSTOMERS[2];
    return CUSTOMERS[3];
  }

  function pickDish() {
    // Fusion dishes appear more often as the shift goes on; never in the first 15 seconds.
    const fusionChance = state.elapsed < 15 ? 0 : 0.18 + 0.12 * (state.level - 1);
    if (random() < fusionChance) {
      const fusion = DISHES.filter((d) => d.fusion);
      return fusion[Math.floor(random() * fusion.length)];
    }
    const normal = DISHES.filter((d) => !d.fusion);
    return normal[Math.floor(random() * normal.length)];
  }

  function spawnOrder(vip) {
    let dish;
    let customer;
    let patience;
    let payMul = 1;
    if (vip) {
      const fusion = DISHES.filter((d) => d.fusion);
      dish = fusion[Math.floor(random() * fusion.length)];
      customer = { id: 'dragon', name: 'NAGA', patienceMul: 1, payMul: 1 };
      patience = VIP_PATIENCE;
      payMul = VIP_PAY_MUL;
    } else {
      dish = pickDish();
      customer = pickCustomer();
      patience = patienceForLevel() * customer.patienceMul;
      payMul = customer.payMul;
    }
    state.orders.push({
      id: state.nextOrderId, dish: dish.id, customer: customer.id, customerName: customer.name,
      patience, patienceMax: patience, reward: dish.reward, cook: dish.cook,
      payMul, vip: !!vip,
    });
    state.nextOrderId += 1;
  }

  function reset() {
    state.money = 0;
    state.served = 0;
    state.walkouts = 0;
    state.combo = 1;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.level = 1;
    state.rush = false;
    state.orders.length = 0;
    state.wok.length = 0;
    state.cooking = null;
    state.plate = null;
    state.deliveries.length = 0;
    state.tray.length = 0;
    state.shopOrdersLeft = MAX_SHOP_ORDERS;
    state.vipSpawned = false;
    state.vipServed = false;
    state.spawnTimer = 1.2;
    state.nextOrderId = 1;
    state.over = false;
    state.overReason = '';
    state.lastServe = null;
    state.lastWalkoutVip = false;
    spawnOrder(false);
  }

  /** The active order the wok's contents match, or null. */
  function matchedOrder() {
    for (let i = 0; i < state.orders.length; i += 1) {
      const order = state.orders[i];
      if (matchesRecipe(state.wok, dishById(order.dish).recipe)) return order;
    }
    return null;
  }

  function canCook() {
    return state.cooking === null && state.plate === null && matchedOrder() !== null;
  }

  function canServe() {
    return state.plate !== null && !state.plate.burnt;
  }

  function isPlateBurnt() {
    return state.plate !== null && state.plate.burnt === true;
  }

  /**
   * Add one ingredient to the wok. A time ingredient must be sitting in the delivery tray;
   * it is taken from there. Returns true when it went in.
   */
  function addIngredient(id) {
    if (state.cooking !== null || state.over) return false;
    if (state.wok.length >= WOK_MAX) return false;
    if (timeIngredientById(id) !== null) {
      const at = state.tray.indexOf(id);
      if (at === -1) return false;
      state.tray.splice(at, 1);
    }
    state.wok.push(id);
    return true;
  }

  /** Empty the wok (only when nothing is cooking). */
  function clearWok() {
    if (state.cooking !== null || state.over) return false;
    if (state.wok.length === 0) return false;
    state.wok.length = 0;
    return true;
  }

  /** Order one time ingredient through the app. It arrives after a delivery delay. */
  function orderFromApp(id) {
    if (state.over) return false;
    if (timeIngredientById(id) === null) return false;
    if (state.shopOrdersLeft <= 0) return false;
    if (state.deliveries.length >= MAX_DELIVERIES) return false;
    state.deliveries.push({ id, timeLeft: DELIVERY_SECONDS });
    state.shopOrdersLeft -= 1;
    return true;
  }

  /** Start cooking the order the wok matches. Returns true when cooking started. */
  function cook() {
    if (!canCook()) return false;
    const order = matchedOrder();
    const dish = dishById(order.dish);
    // The order leaves the board: this customer is being cooked for now.
    state.orders.splice(state.orders.indexOf(order), 1);
    state.cooking = {
      orderId: order.id, dish: order.dish, progress: 0, duration: dish.cook,
      patienceFrac: order.patience / order.patienceMax, payMul: order.payMul, vip: order.vip,
      tossed: false, wokHei: false,
    };
    state.wok.length = 0;
    return true;
  }

  /**
   * Toss the wok while it cooks. Landing the toss while the flame is in the green Wok Hei
   * zone makes it a perfect Wok Hei. Only the first toss in a cook counts.
   */
  function toss() {
    if (state.cooking === null || state.cooking.tossed) return false;
    state.cooking.tossed = true;
    const p = state.cooking.progress;
    state.cooking.wokHei = p >= WOK_HEI_ZONE.from && p <= WOK_HEI_ZONE.to;
    return state.cooking.wokHei;
  }

  /** Serve the dish on the plate. Returns the money earned, or 0 when nothing is served. */
  function serve() {
    if (state.plate === null || state.plate.burnt || state.over) return 0;
    const plate = state.plate;
    const dish = dishById(plate.dish);
    const rushMul = state.rush ? 2 : 1;
    const base = dish.reward * plate.payMul * rushMul;
    let earned = Math.round(base * state.combo);
    const fast = plate.patienceFrac > 0.5;
    if (fast) earned += FAST_BONUS;
    if (plate.wokHei) earned += WOK_HEI_BONUS;
    state.money += earned;
    state.served += 1;
    if (plate.vip) state.vipServed = true;
    state.lastServe = { earned, fast, wokHei: plate.wokHei, vip: plate.vip, legendary: plate.vip && plate.wokHei };
    state.plate = null;
    state.combo = Math.min(COMBO_MAX, state.combo + 1);
    return earned;
  }

  /** Throw away a burnt dish from the plate. Returns true when something was thrown away. */
  function discardPlate() {
    if (state.plate === null || !state.plate.burnt) return false;
    state.plate = null;
    state.combo = 1;
    return true;
  }

  /**
   * One fixed step. Returns what happened as EVENT_* flags. With `harmless` set (the title
   * screen's backdrop) time does not run and nothing is served or lost.
   */
  function step(dt, harmless) {
    let events = 0;
    if (harmless) return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));
    state.rush = state.elapsed >= RUSH_START;

    // The VIP dragon arrives once, mid-shift.
    if (!state.vipSpawned && state.elapsed >= VIP_AT_SECONDS && state.orders.length < MAX_ORDERS) {
      spawnOrder(true);
      state.vipSpawned = true;
      events |= EVENT_VIP;
    }

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder(false);
      state.spawnTimer = spawnInterval();
    }

    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.walkouts += 1;
        state.combo = 1;
        state.lastWalkoutVip = order.vip;
        events |= EVENT_WALKOUT;
        if (state.walkouts >= MAX_WALKOUTS) {
          state.over = true;
          state.overReason = 'walkouts';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // Deliveries from the app arrive.
    for (let i = state.deliveries.length - 1; i >= 0; i -= 1) {
      const delivery = state.deliveries[i];
      delivery.timeLeft -= dt;
      if (delivery.timeLeft <= 0) {
        state.deliveries.splice(i, 1);
        state.tray.push(delivery.id);
        events |= EVENT_DELIVERED;
      }
    }

    if (state.cooking !== null) {
      state.cooking.progress += dt / state.cooking.duration;
      if (state.cooking.progress >= 1) {
        state.plate = {
          orderId: state.cooking.orderId, dish: state.cooking.dish,
          patienceFrac: state.cooking.patienceFrac, payMul: state.cooking.payMul,
          vip: state.cooking.vip, wokHei: state.cooking.wokHei, age: 0, burnt: false,
        };
        state.cooking = null;
        events |= EVENT_COOKED;
      }
    }

    if (state.plate !== null && !state.plate.burnt) {
      state.plate.age += dt;
      if (state.plate.age > PLATE_BURN_SECONDS) {
        state.plate.burnt = true;
        state.combo = 1;
        events |= EVENT_BURNT;
      }
    }

    if (state.timeLeft <= 0 && !state.over) {
      state.over = true;
      state.overReason = 'time';
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return {
    state, reset, step, addIngredient, clearWok, cook, toss, serve, discardPlate,
    orderFromApp, matchedOrder, canCook, canServe, isPlateBurnt,
  };
}
