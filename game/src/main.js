// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between four screens: title,
// play, paused and game over. Clicks land on the counter's ingredients, the delivery tray,
// the wok, the MASAK button, the APLIKASI SHOPING button, the shop panel or the plate;
// keys 1-8 add ingredients, Space cooks (or tosses the wok while it cooks), Enter serves,
// S opens the shopping app, C clears the wok and P pauses.
//
// ?seed=N fixes the order the dishes arrive in. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, FIELD, INGREDIENTS, STEP, TIME_INGREDIENTS } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_BURNT, EVENT_COOKED, EVENT_DELIVERED, EVENT_OVER, EVENT_VIP, EVENT_WALKOUT,
} from './world.js';
import { ACTION_CLEAR, ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, ACTION_SHOP, createInput } from './input.js';
import { APP_PANEL, LAYOUT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best money then lasts this visit only.
  }
}

/**
 * What a click at logical (x, y) hits: an ingredient id, 'cook', 'shop', 'wok', 'plate',
 * 'app:<ingredient id>' for a shop row, 'appClose', or null. When the shop panel is open
 * it covers the field: a click inside it is an app hit, outside it closes the panel.
 */
function hitTest(x, y, shopOpen) {
  if (shopOpen) {
    const p = APP_PANEL;
    const cb = p.closeButton;
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) return 'appClose';
    if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) {
      const ob = p.orderButton;
      for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) {
        const ry = p.rowsY + i * (p.rowHeight + p.rowGap);
        if (y >= ry && y <= ry + p.rowHeight && x >= ob.x && x <= ob.x + ob.width) {
          return 'app:' + TIME_INGREDIENTS[i].id;
        }
      }
      return 'appPanel';
    }
    return 'appClose';
  }
  const ing = LAYOUT.ingredients;
  if (y >= ing.y && y <= ing.y + ing.height) {
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const bx = ing.x + i * (ing.width + ing.gap);
      if (x >= bx && x <= bx + ing.width) return INGREDIENTS[i].id;
    }
  }
  const tray = LAYOUT.tray;
  if (y >= tray.y && y <= tray.y + tray.height) {
    for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) {
      const bx = tray.x + i * (tray.width + tray.gap);
      if (x >= bx && x <= bx + tray.width) return TIME_INGREDIENTS[i].id;
    }
  }
  const cook = LAYOUT.cookButton;
  if (x >= cook.x && x <= cook.x + cook.width && y >= cook.y && y <= cook.y + cook.height) return 'cook';
  const shop = LAYOUT.shopButton;
  if (x >= shop.x && x <= shop.x + shop.width && y >= shop.y && y <= shop.y + shop.height) return 'shop';
  const wok = LAYOUT.wok;
  if ((x - wok.x) * (x - wok.x) + (y - wok.y) * (y - wok.y) <= wok.r * wok.r) return 'wok';
  const plate = LAYOUT.plate;
  if ((x - plate.x) * (x - plate.x) + (y - plate.y) * (y - plate.y) <= plate.r * plate.r) return 'plate';
  return null;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    const matched = world.matchedOrder();
    renderer.draw(world.state, scene.screen, scene.best, matched ? matched.id : null, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let shopOpen = false;
  // A handle for automated play-testing (screenshots, self-play); harmless in play.
  window.__world = world;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    shopOpen = false;
    screen = SCREEN_PLAY;
    announce('Playing. Shift 90 seconds. 3 walk-outs end the shift.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    shopOpen = false;
    if (world.state.money > best) {
      best = world.state.money;
      saveBest(best);
    }
    announce('Shift over. Money Rp ' + world.state.money + 'k. Best Rp ' + best + 'k.');
  }

  function servePlate() {
    if (world.isPlateBurnt()) {
      if (world.discardPlate()) announce('Burnt dish thrown away. Combo reset.');
      return;
    }
    const earned = world.serve();
    if (earned > 0) {
      const s = world.state.lastServe;
      let msg = 'Served. Rp ' + earned + 'k.';
      if (s && s.legendary) msg = 'LEGENDARY! The dragon loved it. Rp ' + earned + 'k.';
      else if (s && s.wokHei) msg = 'WOK HEI! Served. Rp ' + earned + 'k.';
      else if (s && s.fast) msg = 'Served fast. Rp ' + earned + 'k.';
      announce(msg);
    }
  }

  function handleClicks() {
    const clicks = input.takeClicks();
    for (let i = 0; i < clicks.length; i += 1) {
      const hit = hitTest(clicks[i].x, clicks[i].y, shopOpen);
      if (hit === null) continue;
      if (hit === 'appClose') { shopOpen = false; continue; }
      if (hit === 'appPanel') continue;
      if (hit.startsWith('app:')) {
        const id = hit.slice(4);
        if (world.orderFromApp(id)) announce('Ordered ' + id + '. Arriving in 4 seconds.');
        continue;
      }
      if (hit === 'shop') { shopOpen = !shopOpen; continue; }
      if (hit === 'cook') { world.cook(); continue; }
      if (hit === 'wok') {
        if (world.state.cooking !== null) {
          if (world.toss()) announce('WOK HEI! Perfect toss.');
        } else {
          world.clearWok();
        }
        continue;
      }
      if (hit === 'plate') { servePlate(); continue; }
      world.addIngredient(hit);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_SHOP && screen === SCREEN_PLAY) {
      shopOpen = !shopOpen;
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      shopOpen = false;
      announce('Paused.');
      return;
    }
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    if (actions & ACTION_CLEAR) world.clearWok();
    if (actions & ACTION_CONFIRM) {
      if (world.state.cooking !== null) {
        if (world.toss()) announce('WOK HEI! Perfect toss.');
      } else {
        world.cook();
      }
    }
    if (actions & ACTION_SERVE) servePlate();
  }

  function step() {
    const events = world.step(STEP, false);
    if (events & EVENT_COOKED) announce('Dish ready on the plate.');
    if (events & EVENT_BURNT) announce('The dish on the plate burnt! Throw it away.');
    if (events & EVENT_DELIVERED) announce('Delivery arrived from across time.');
    if (events & EVENT_VIP) announce('A DRAGON approaches! A VIP order appeared.');
    if (events & EVENT_WALKOUT) {
      announce(world.state.walkouts >= 3 ? 'A customer walked out. Shift over.' : 'A customer walked out. Combo reset.');
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      const ingredients = input.takeIngredients();
      for (let i = 0; i < ingredients.length; i += 1) world.addIngredient(ingredients[i]);
      handleClicks();
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      input.takeIngredients();
      input.takeClicks();
    }
    const matched = screen === SCREEN_PLAY ? world.matchedOrder() : null;
    renderer.draw(world.state, screen, best, matched ? matched.id : null, shopOpen);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      shopOpen = false;
      announce('Paused.');
    }
  });

  announce('Tarnished Chef. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
