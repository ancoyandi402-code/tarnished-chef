# tarnished-chef

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ancoyandi402-code/tarnished-chef/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ancoyandi402-code/tarnished-chef/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Tarnished Chef — a cooking game from the Lands Between. You are a Tarnished, a survivor cast out of time, running a food stall in a dark medieval world. With a glowing Aplikasi Shoping you order ingredients from across the ages: dragon eggs from the ancient past, instant noodles from the far future, neon chili from a neon age. Knights, a sorceress, a merchant — and a dragon — gather at your stall, amazed by dishes no one in this age has ever tasted.

Cook over the dragon flame, land the Wok Hei toss in the green zone, keep your combo alive through the knights' rush hour, and serve the dragon perfectly to go LEGENDARY. 7 dishes (4 classic, 3 fusion), 5 time-travel ingredients, 4 customer types plus a VIP dragon, combo multiplier, rush hour, plate burn, and a 90-second shift.

## Run it

```sh
node serve.ts --port 8080
# then open http://localhost:8080
```

Or open `game/index.html` directly in a desktop browser — no build step, no network, keyboard + mouse.

## How to play

- Orders appear on the board. Click ingredients on the counter (or keys 1–8) to fill the wok.
- **S** opens the Aplikasi Shoping: order a time ingredient (dragon egg, neon chili, instant noodles, melting cheese, magic mushroom). It arrives in 4 seconds, in the delivery tray. Fusion dishes need them.
- **Space** cooks when the wok matches an order. While it cooks, click the wok (or Space) when the gold ring is inside the green zone for a perfect **WOK HEI!** (+bonus).
- Serve from the plate (**Enter** or click) before patience runs out. A cooked dish left on the plate overcooks — throw it away.
- Serve in a row to build a **COMBO** (up to x5). A walk-out or a burn resets it.
- The last 30 seconds are **RUSH HOUR**: orders arrive twice as fast and pay double.
- Once per shift a **dragon** (VIP, gold card) orders a fusion dish and pays 3x. Serve it perfectly with Wok Hei to go **LEGENDARY!**

---

<sub>Entered on [make.fun](https://make.fun/?ref=17p7h411&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
