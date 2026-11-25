// TARNISHED CHEF — entrypoint for make.fun's "Make the best cooking game" bounty.
// A medieval fantasy cooking game from the Lands Between: a Tarnished, a survivor of time,
// runs a kitchen stall and orders impossible ingredients across eras with a glowing
// shopping app (TELUR NAGA from the ancient age, CABAI NEON from the neon age, MIE INSTAN
// from the future). Signature systems: Wok Hei flame-timing, a combo multiplier, a
// 30-second Rush Hour, a VIP Dragon who pays triple, and plates that burn if you dawdle.
// The game itself is plain static files (game/index.html + ES modules, no library, no
// network) that a desktop browser loads offline. This program hands it in: it copies
// game/ and screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this file lives, and where the entry goes.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Count the files a directory tree holds, so the hand-in can say what it carried.
function countTree(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      const sub = countTree(path);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += info.size;
    }
  }
  return { files, bytes };
}

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('Tarnished Chef is missing game/index.html — nothing to hand in.');
}
const gameStats = countTree(gameDir);
const shotStats = existsSync(shotsDir) ? countTree(shotsDir) : { files: 0, bytes: 0 };

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(
  `Tarnished Chef handed in: ${gameStats.files} game files (${gameStats.bytes} bytes), ` +
  `${shotStats.files} screenshots (${shotStats.bytes} bytes), dossier.json written to ${out}.`,
);
