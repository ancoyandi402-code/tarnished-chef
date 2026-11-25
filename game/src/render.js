// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Flat rectangles, circles and canvas text: a dark medieval kitchen in the Lands
// Between, a parchment order board, a wok over a bonfire, a light plate, a row of
// ingredient buttons, and the glowing Aplikasi Shoping. The layout is exported so the
// loop can hit-test clicks against the same coordinates it draws.

import {
  DISHES, FIELD, FONT, INGREDIENTS, MAX_ORDERS, MAX_WALKOUTS, PALETTE, TIME_INGREDIENTS,
  WOK_HEI_ZONE,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Every drawn region, in logical coordinates; main.js hit-tests clicks against these. */
export const LAYOUT = {
  orders: { x: 24, y: 104, width: 392, height: 120, gap: 24 },
  wok: { x: 360, y: 340, r: 100 },
  plate: { x: 920, y: 340, r: 100 },
  cookButton: { x: 260, y: 470, width: 200, height: 56 },
  shopButton: { x: 700, y: 470, width: 260, height: 56 },
  tray: { x: 976, y: 474, width: 48, height: 48, gap: 6 },
  ingredients: { x: 24, y: 528, width: 145, height: 126, gap: 10 },
  hint: { y: 674 },
};

/** The shop panel (the app), in logical coordinates; main.js hit-tests its rows. */
export const APP_PANEL = {
  x: 320, y: 96, width: 640, height: 500,
  rowsY: 196, rowHeight: 56, rowGap: 8,
  orderButton: { x: 840, width: 96, height: 36 },
  closeButton: { x: 896, y: 112, width: 48, height: 32 },
};

function dishById(id) {
  for (let i = 0; i < DISHES.length; i += 1) if (DISHES[i].id === id) return DISHES[i];
  return DISHES[0];
}

function ingredientById(id) {
  for (let i = 0; i < INGREDIENTS.length; i += 1) if (INGREDIENTS[i].id === id) return INGREDIENTS[i];
  for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) if (TIME_INGREDIENTS[i].id === id) return TIME_INGREDIENTS[i];
  return INGREDIENTS[0];
}

function moneyLabel(n) {
  return 'Rp ' + n + 'k';
}

function timeLabel(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function patienceColor(frac) {
  if (frac > 0.5) return PALETTE.good;
  if (frac > 0.25) return PALETTE.gold;
  return PALETTE.chili;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, (weight ? weight + ' ' : '') + size + 'px ' + FONT);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function circle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text('TARNISHED CHEF', 24, 18, 28, PALETTE.text, 'left', '700');
    text('Level ' + state.level + '  •  Lands Between', 24, 48, 15, PALETTE.muted, 'left');
    const t = timeLabel(state.timeLeft);
    text(t, FIELD.width / 2, 12, 34, state.timeLeft <= 10 ? PALETTE.chili : PALETTE.text, 'center', '700');
    const barW = 220;
    const barX = FIELD.width / 2 - barW / 2;
    context.fillStyle = PALETTE.panelDark;
    context.fillRect(barX, 52, barW, 8);
    context.fillStyle = state.timeLeft <= 10 ? PALETTE.chili : PALETTE.gold;
    context.fillRect(barX, 52, barW * Math.max(0, state.timeLeft / 90), 8);
    text(moneyLabel(state.money), FIELD.width - 24, 18, 28, PALETTE.gold, 'right', '700');
    // Combo badge: the multiplier for the next serve, gold when it is above x1.
    if (state.combo > 1) {
      const label = 'COMBO x' + state.combo;
      const w = 30 + label.length * 11;
      const x = FIELD.width - 24 - w;
      context.fillStyle = PALETTE.gold;
      roundRect(x, 46, w, 26, 13);
      context.fill();
      text(label, x + w / 2, 51, 17, '#241a12', 'center', '800');
    }
    for (let i = 0; i < MAX_WALKOUTS; i += 1) {
      const x = FIELD.width - 24 - i * 26;
      const y = 92;
      context.beginPath();
      context.arc(x, y, 8, 0, Math.PI * 2);
      if (i < state.walkouts) {
        context.fillStyle = PALETTE.chili;
        context.fill();
      } else {
        context.strokeStyle = PALETTE.muted;
        context.lineWidth = 2;
        context.stroke();
      }
    }
    text('marah', FIELD.width - 24 - MAX_WALKOUTS * 26 - 8, 86, 14, PALETTE.muted, 'right');
    // Rush hour banner.
    if (state.rush) {
      const bw = 560;
      const bx = (FIELD.width - bw) / 2;
      context.fillStyle = PALETTE.chili;
      roundRect(bx, 64, bw, 26, 13);
      context.fill();
      text('SERBUAN KESATRIA — RUSH HOUR! Semua hidangan bayar 2x', FIELD.width / 2, 69, 16, '#fff', 'center', '800');
    }
  }

  function drawOrderCard(order, x, y, w, h, matched) {
    const dish = dishById(order.dish);
    const vip = order.vip;
    context.fillStyle = vip ? '#3a2f10' : PALETTE.panel;
    roundRect(x, y, w, h, 12);
    context.fill();
    if (vip) {
      context.strokeStyle = PALETTE.vip;
      context.lineWidth = 4;
      roundRect(x, y, w, h, 12);
      context.stroke();
    } else if (matched) {
      context.strokeStyle = PALETTE.good;
      context.lineWidth = 4;
      roundRect(x, y, w, h, 12);
      context.stroke();
    }
    context.textBaseline = 'top';
    const titleColor = vip ? PALETTE.vip : PALETTE.ink;
    text(dish.name, x + 16, y + 12, 22, titleColor, 'left', '700');
    text(moneyLabel(Math.round(order.reward * order.payMul)), x + w - 16, y + 12, 20, vip ? PALETTE.vip : '#8a6d1f', 'right', '700');
    // Customer + fusion tag.
    const tag = (vip ? 'NAGA VIP  •  ' : order.customerName + '  •  ') + (dish.fusion ? 'FUSION' : 'klasik');
    text(tag, x + 16, y + 40, 13, vip ? '#e8c97a' : '#8a7d5f', 'left', '700');
    // Ingredient chips.
    const recipe = dish.recipe;
    let chipX = x + 16;
    const chipY = y + 62;
    for (let i = 0; i < recipe.length; i += 1) {
      const ing = ingredientById(recipe[i]);
      const label = ing.name;
      const chipW = 14 + label.length * 8 + 18;
      context.fillStyle = vip ? '#5b4a1a' : '#e8dcc0';
      roundRect(chipX, chipY, chipW, 26, 13);
      context.fill();
      circle(chipX + 16, chipY + 13, 7, ing.color);
      context.strokeStyle = 'rgba(0,0,0,0.25)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(chipX + 16, chipY + 13, 7, 0, Math.PI * 2);
      context.stroke();
      text(label, chipX + 28, chipY + 5, 14, vip ? '#f5e6c8' : PALETTE.ink, 'left', '600');
      chipX += chipW + 8;
    }
    if (matched) text('SIAP DIMASAK', x + w - 16, chipY + 5, 14, PALETTE.good, 'right', '700');
    // Patience bar.
    const frac = Math.max(0, order.patience / order.patienceMax);
    const barX = x + 16;
    const barY = y + h - 22;
    const barW = w - 32;
    context.fillStyle = vip ? '#5b4a1a' : '#d8cbb0';
    context.fillRect(barX, barY, barW, 10);
    context.fillStyle = patienceColor(frac);
    context.fillRect(barX, barY, barW * frac, 10);
  }

  function drawOrders(state, matchedId) {
    for (let i = 0; i < MAX_ORDERS; i += 1) {
      const x = LAYOUT.orders.x + i * (LAYOUT.orders.width + LAYOUT.orders.gap);
      const y = LAYOUT.orders.y;
      const order = state.orders[i];
      if (!order) {
        context.fillStyle = 'rgba(245,230,200,0.12)';
        roundRect(x, y, LAYOUT.orders.width, LAYOUT.orders.height, 12);
        context.fill();
        context.textBaseline = 'top';
        text('menunggu pelanggan...', x + LAYOUT.orders.width / 2, y + 48, 18, PALETTE.muted, 'center');
        continue;
      }
      drawOrderCard(order, x, y, LAYOUT.orders.width, LAYOUT.orders.height, matchedId === order.id);
    }
  }

  function drawWok(state) {
    const { x, y, r } = LAYOUT.wok;
    // Bonfire under the wok: a warm glow that grows while cooking.
    const glow = state.cooking ? 0.95 : 0.55;
    context.globalAlpha = glow * 0.35;
    circle(x, y + r - 6, r + 26, '#e8862e');
    context.globalAlpha = glow * 0.5;
    circle(x, y + r - 6, r - 6, '#f2c94c');
    context.globalAlpha = 1;
    // Wok: a dark bowl with a rim.
    context.fillStyle = '#0f0f13';
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#4a4a55';
    context.lineWidth = 5;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = PALETTE.wok;
    context.beginPath();
    context.arc(x, y, r - 12, 0, Math.PI * 2);
    context.fill();
    if (state.cooking) {
      const p = Math.min(1, state.cooking.progress);
      // The green Wok Hei zone, as an arc on the ring: toss when the gold tip is inside it.
      const zoneFrom = -Math.PI / 2 + WOK_HEI_ZONE.from * Math.PI * 2;
      const zoneTo = -Math.PI / 2 + WOK_HEI_ZONE.to * Math.PI * 2;
      context.strokeStyle = PALETTE.good;
      context.lineWidth = 10;
      context.beginPath();
      context.arc(x, y, r - 22, zoneFrom, zoneTo);
      context.stroke();
      context.strokeStyle = PALETTE.gold;
      context.lineWidth = 10;
      context.beginPath();
      context.arc(x, y, r - 22, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      context.stroke();
      if (state.cooking.wokHei) {
        context.textBaseline = 'alphabetic';
        text('WOK HEI!', x, y - 8, 30, PALETTE.gold, 'center', '800');
        text('api naga!', x, y + 22, 16, '#e8c97a', 'center', '700');
      } else {
        context.textBaseline = 'alphabetic';
        text('MEMASAK...', x, y + 8, 22, PALETTE.text, 'center', '700');
        text('klik wok di zona hijau', x, y + 34, 14, PALETTE.muted, 'center');
      }
    } else if (state.wok.length > 0) {
      const spots = [[-32, -18], [32, -18], [-32, 26], [32, 26]];
      for (let i = 0; i < state.wok.length; i += 1) {
        const ing = ingredientById(state.wok[i]);
        const spot = spots[i % spots.length];
        circle(x + spot[0], y + spot[1], 24, ing.color);
        context.textBaseline = 'alphabetic';
        text(ing.name.split(' ')[0], x + spot[0], y + spot[1] + 5, 12, ing.dark, 'center', '700');
      }
    } else {
      context.textBaseline = 'alphabetic';
      text('wok kosong', x, y + 6, 18, PALETTE.muted, 'center');
    }
    context.textBaseline = 'top';
    text('WOK — API NAGA', x, y + r + 10, 18, PALETTE.muted, 'center', '700');
  }

  function drawCookButton(state) {
    const { x, y, width, height } = LAYOUT.cookButton;
    const can = state.cooking === null && state.plate === null && state.wok.length > 0 && state.orders.some((o) => {
      const recipe = dishById(o.dish).recipe;
      if (state.wok.length !== recipe.length) return false;
      for (let i = 0; i < recipe.length; i += 1) if (state.wok.indexOf(recipe[i]) === -1) return false;
      return true;
    });
    const cooking = state.cooking !== null;
    context.fillStyle = cooking ? PALETTE.gold : can ? PALETTE.accent : PALETTE.disabled;
    roundRect(x, y, width, height, 12);
    context.fill();
    context.textBaseline = 'alphabetic';
    const label = cooking ? 'MEMASAK...' : can ? 'MASAK  (Spasi)' : 'MASAK';
    text(label, x + width / 2, y + height / 2 + 8, 22, cooking || can ? '#241a12' : '#d8cbb0', 'center', '700');
  }

  function drawShopButton(state) {
    const { x, y, width, height } = LAYOUT.shopButton;
    const canShop = state.shopOrdersLeft > 0 && state.deliveries.length < 2;
    context.fillStyle = canShop ? PALETTE.appGlow : PALETTE.disabled;
    roundRect(x, y, width, height, 12);
    context.fill();
    context.textBaseline = 'alphabetic';
    text('APLIKASI SHOPING (S)', x + width / 2, y + height / 2 + 7, 20, canShop ? '#06222b' : '#d8cbb0', 'center', '800');
  }

  function drawTray(state) {
    const { x, y, width, height, gap } = LAYOUT.tray;
    for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) {
      const ing = TIME_INGREDIENTS[i];
      const bx = x + i * (width + gap);
      const inTray = state.tray.indexOf(ing.id) !== -1;
      context.fillStyle = inTray ? ing.color : 'rgba(245,230,200,0.10)';
      roundRect(bx, y, width, height, 10);
      context.fill();
      if (inTray) {
        context.textBaseline = 'alphabetic';
        text(ing.name.split(' ')[0], bx + width / 2, y + height / 2 + 5, 12, ing.dark, 'center', '800');
      }
    }
  }

  function drawPlate(state) {
    const { x, y, r } = LAYOUT.plate;
    const ready = state.plate !== null;
    const burnt = ready && state.plate.burnt;
    if (ready && !burnt) {
      context.strokeStyle = PALETTE.gold;
      context.lineWidth = 5;
      context.beginPath();
      context.arc(x, y, r + 8, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = burnt ? '#3a2a1a' : PALETTE.plate;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#d8cbb0';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y, r - 16, 0, Math.PI * 2);
    context.stroke();
    if (ready) {
      const dish = dishById(state.plate.dish);
      if (burnt) {
        context.textBaseline = 'alphabetic';
        text('GOSONG!', x, y - 4, 26, '#e8862e', 'center', '800');
        text('klik piring untuk buang', x, y + 26, 16, PALETTE.muted, 'center');
      } else {
        const main = ingredientById(dish.recipe[0]);
        context.fillStyle = main.color;
        context.beginPath();
        context.ellipse(x, y + 6, 58, 34, 0, 0, Math.PI * 2);
        context.fill();
        for (let i = 1; i < dish.recipe.length; i += 1) {
          const ing = ingredientById(dish.recipe[i]);
          circle(x - 34 + i * 30, y - 18, 11, ing.color);
        }
        if (state.plate.wokHei) {
          text('★ WOK HEI', x, y - 44, 20, PALETTE.gold, 'center', '800');
        }
        context.textBaseline = 'alphabetic';
        text(dish.name, x, y + 58, 20, PALETTE.ink, 'center', '700');
        text('SIAP — KLIK', x, y + 82, 15, '#8a6d1f', 'center', '800');
      }
    } else {
      context.textBaseline = 'alphabetic';
      text('piring kosong', x, y + 6, 18, '#8a7d5f', 'center');
      context.textBaseline = 'top';
      text('PIRING', x, y + r + 10, 18, PALETTE.muted, 'center', '700');
    }
  }

  function drawCounter() {
    const { x, y, width, height, gap } = LAYOUT.ingredients;
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const ing = INGREDIENTS[i];
      const bx = x + i * (width + gap);
      context.fillStyle = PALETTE.panel;
      roundRect(bx, y, width, height, 12);
      context.fill();
      circle(bx + width / 2, y + 34, 22, ing.color);
      context.strokeStyle = 'rgba(0,0,0,0.25)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(bx + width / 2, y + 34, 22, 0, Math.PI * 2);
      context.stroke();
      context.textBaseline = 'top';
      text(ing.name, bx + width / 2, y + 66, 19, PALETTE.ink, 'center', '700');
      text('[' + ing.key + ']', bx + width - 10, y + 8, 14, PALETTE.muted, 'right');
    }
    context.textBaseline = 'top';
    text('Klik bahan atau tekan 1-8  •  Spasi = masak / toss  •  Enter = sajikan  •  S = aplikasi shoping  •  C = buang isi wok  •  P = jeda', FIELD.width / 2, LAYOUT.hint.y, 15, PALETTE.muted, 'center');
  }

  function drawAppPanel(state) {
    const p = APP_PANEL;
    context.fillStyle = 'rgba(10,8,6,0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.appPanel;
    roundRect(p.x, p.y, p.width, p.height, 16);
    context.fill();
    context.strokeStyle = PALETTE.appGlow;
    context.lineWidth = 3;
    roundRect(p.x, p.y, p.width, p.height, 16);
    context.stroke();
    context.textBaseline = 'top';
    text('APLIKASI SHOPING', p.x + 24, p.y + 16, 30, PALETTE.appGlow, 'left', '800');
    text('bahan lintas waktu — dikirim ke warungmu', p.x + 24, p.y + 52, 16, '#9adfff', 'left');
    // Close button.
    const cb = p.closeButton;
    context.fillStyle = PALETTE.panelDark;
    roundRect(cb.x, cb.y, cb.width, cb.height, 8);
    context.fill();
    text('X', cb.x + cb.width / 2, cb.y + 6, 18, PALETTE.text, 'center', '700');
    // Rows: one per time ingredient.
    for (let i = 0; i < TIME_INGREDIENTS.length; i += 1) {
      const ing = TIME_INGREDIENTS[i];
      const ry = p.rowsY + i * (p.rowHeight + p.rowGap);
      context.fillStyle = '#123a44';
      roundRect(p.x + 24, ry, p.width - 48, p.rowHeight, 10);
      context.fill();
      circle(p.x + 56, ry + p.rowHeight / 2, 18, ing.color);
      text(ing.name, p.x + 88, ry + 10, 19, PALETTE.text, 'left', '700');
      text('dari ' + ing.era, p.x + 88, ry + 33, 14, '#9adfff', 'left');
      const ob = p.orderButton;
      const inFlight = state.deliveries.some((d) => d.id === ing.id);
      const canOrder = state.shopOrdersLeft > 0 && state.deliveries.length < 2 && !inFlight;
      context.fillStyle = canOrder ? PALETTE.appGlow : PALETTE.disabled;
      roundRect(ob.x, ry + 10, ob.width, ob.height, 8);
      context.fill();
      const label = inFlight ? 'DIKIRIM...' : canOrder ? 'PESAN' : '—';
      text(label, ob.x + ob.width / 2, ry + 18, 16, canOrder ? '#06222b' : '#d8cbb0', 'center', '800');
    }
    const footY = p.rowsY + TIME_INGREDIENTS.length * (p.rowHeight + p.rowGap) + 8;
    text('Pesanan tersisa: ' + state.shopOrdersLeft + '  •  Tiba dalam 4 detik  •  Dipakai untuk hidangan FUSION', p.x + 24, footY, 15, '#9adfff', 'left');
    text('Klik di luar panel untuk menutup', p.x + 24, footY + 24, 14, PALETTE.muted, 'left');
  }

  function drawField(state, matchedId, shopOpen) {
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(0, LAYOUT.ingredients.y - 14, FIELD.width, LAYOUT.ingredients.height + 28);
    drawOrders(state, matchedId);
    drawWok(state);
    drawCookButton(state);
    drawShopButton(state);
    drawTray(state);
    context.strokeStyle = PALETTE.muted;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(LAYOUT.wok.x + LAYOUT.wok.r + 14, LAYOUT.wok.y);
    context.lineTo(LAYOUT.plate.x - LAYOUT.plate.r - 14, LAYOUT.plate.y);
    context.stroke();
    context.fillStyle = PALETTE.muted;
    context.beginPath();
    context.moveTo(LAYOUT.plate.x - LAYOUT.plate.r - 14, LAYOUT.plate.y);
    context.lineTo(LAYOUT.plate.x - LAYOUT.plate.r - 28, LAYOUT.plate.y - 8);
    context.lineTo(LAYOUT.plate.x - LAYOUT.plate.r - 28, LAYOUT.plate.y + 8);
    context.closePath();
    context.fill();
    drawPlate(state);
    drawCounter();
    if (shopOpen) drawAppPanel(state);
  }

  function drawPanel(title, lines, prompt) {
    const width = 680;
    const lineH = 32;
    const height = 120 + lines.length * lineH + 74;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, width, height, 16);
    context.fill();
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 46, PALETTE.ink, 'center', '800');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 120 + i * lineH, 20, '#5b4a33', 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, '#8a6d1f', 'center', '700');
  }

  /** Paint one frame: the field, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best, matchedId, shopOpen) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state, matchedId, shopOpen);
    if (screen === SCREEN_TITLE) {
      drawPanel('TARNISHED CHEF', [
        'A cooking tale from the Lands Between.',
        'Kau seorang Tarnished — penyintas waktu. Dengan Aplikasi Shoping,',
        'kau memesan bahan lintas waktu: telur naga dari zaman purba,',
        'mie instan dari masa depan. Kesatria, penyihir, bahkan naga',
        'takjub pada hidangan yang tak pernah ada di zaman ini.',
        '',
        'Pesanan muncul di papan. Klik bahan, masak di wok, sajikan',
        'sebelum pelanggan pergi. 3 pelanggan marah = shift berakhir.',
        '',
        'Rekor: ' + moneyLabel(best),
      ], 'Tekan Spasi atau klik untuk mulai');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Api naga menunggu.'], 'Tekan P untuk lanjut');
    } else if (screen === SCREEN_OVER) {
      const reason = state.overReason === 'walkouts'
        ? 'Terlalu banyak pelanggan marah pergi.'
        : 'Waktu shift habis. Warung tutup.';
      drawPanel('Shift Selesai!', [
        reason,
        '',
        'Uang didapat: ' + moneyLabel(state.money),
        'Hidangan disajikan: ' + state.served,
        'Naga dilayani: ' + (state.vipServed ? 'ya — LEGENDARY!' : 'tidak'),
        'Rekor: ' + moneyLabel(best),
      ], 'Tekan Spasi atau klik untuk main lagi');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
