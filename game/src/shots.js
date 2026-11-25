// The screenshot scenes behind ?shot=start|play|serve|end. Each one stages a real state of
// the game — the same world the player plays, set to a fixed moment — so a frame is what a
// real game looks like and the same seed always gives the same frame. The play scene shows
// the order board (with a VIP dragon and a fusion dish), the counter, a time ingredient in
// the tray, one dish mid-assembly in the wok and a plate ready to serve; the serve scene
// shows the wok cooking in the Wok Hei zone during the rush hour.

import { DISHES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function dishById(id) {
  for (let i = 0; i < DISHES.length; i += 1) if (DISHES[i].id === id) return DISHES[i];
  return DISHES[0];
}

function makeOrder(id, dishId, patience, patienceMax, customer, customerName, payMul, vip) {
  const dish = dishById(dishId);
  return {
    id, dish: dishId, customer, customerName, patience, patienceMax,
    reward: dish.reward, cook: dish.cook, payMul: payMul || 1, vip: !!vip,
  };
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best money
 * to show. Any other name is the title scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    state.orders.length = 0;
    state.orders.push(makeOrder(1, 'nasgor_naga', 8, 10, 'dragon', 'NAGA', 3, true));
    state.orders.push(makeOrder(2, 'miegor', 16, 22, 'knight', 'Kesatria', 1, false));
    state.orders.push(makeOrder(3, 'sate', 7, 22, 'sorceress', 'Penyihir', 1.2, false));
    state.wok.push('nasi', 'telur_naga');
    state.tray.push('cabai_neon');
    state.plate = { orderId: 99, dish: 'miegor', patienceFrac: 0.7, payMul: 1, vip: false, wokHei: true, age: 1, burnt: false };
    state.money = 41;
    state.served = 3;
    state.combo = 3;
    state.shopOrdersLeft = 2;
    state.timeLeft = 32;
    state.elapsed = 58;
    state.level = 2;
    return { screen: SCREEN_PLAY, best: 42 };
  }
  if (name === 'serve') {
    state.orders.length = 0;
    state.orders.push(makeOrder(1, 'mie_depan', 12, 22, 'merchant', 'Pedagang', 1.3, false));
    state.orders.push(makeOrder(2, 'nasgor', 6, 22, 'sorceress', 'Penyihir', 1.2, false));
    state.orders.push(makeOrder(3, 'esteh', 14, 22, 'villager', 'Penduduk', 1, false));
    state.cooking = {
      orderId: 97, dish: 'mie_depan', progress: 0.68, duration: 3.0,
      patienceFrac: 0.6, payMul: 1.3, vip: false, tossed: false, wokHei: false,
    };
    state.plate = { orderId: 98, dish: 'sate', patienceFrac: 0.8, payMul: 1, vip: false, wokHei: false, age: 1, burnt: false };
    state.tray.push('keju_leleh');
    state.money = 63;
    state.served = 4;
    state.combo = 4;
    state.shopOrdersLeft = 1;
    state.timeLeft = 25;
    state.elapsed = 65;
    state.level = 3;
    state.rush = true;
    return { screen: SCREEN_PLAY, best: 63 };
  }
  if (name === 'end') {
    state.money = 78;
    state.served = 6;
    state.walkouts = 1;
    state.combo = 1;
    state.vipServed = true;
    state.timeLeft = 0;
    state.elapsed = 90;
    state.level = 3;
    state.over = true;
    state.overReason = 'time';
    return { screen: SCREEN_OVER, best: 78 };
  }
  return { screen: SCREEN_TITLE, best: 42 };
}
