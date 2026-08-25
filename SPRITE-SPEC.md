# Glenn: The Game — sprite sheet spec

The game engine loads full-colour character sheets from `public/images/game/` and
falls back to the built-in placeholder pixel art for any file that's missing.
So you can drop sheets in one era at a time and see them live immediately.

## Character sheets (the priority)

One PNG per life era, named exactly:

| File | Character |
|---|---|
| `player-0.png` | Baby (crawling) |
| `player-1.png` | Toddler |
| `player-2.png` | Child |
| `player-3.png` | Teenager |
| `player-4.png` | Adult (you — bald, beard) |

**Format: 288 × 48px strip. Six 48×48 frames, left to right:**
(Memao's native 48px frame size — export at 1x, no scaling. The engine renders
the hero at 2 tiles tall, a clean 2× of the 48px frame, so pixels stay perfect.
No need for 4x-scaled exports — upscaling happens losslessly in the engine.)

```
| down-0 | down-1 | up-0 | up-1 | side-0 | side-1 |
```

- Or just drop in the full Memao 8×10 sheet (384×480, like `glenn_adult.png`)
  named `glenn_<era>.png` and I'll cut the strip — for the adult I used
  walk rows 2 (down), 6 (up) and 4 (side), columns 1 and 3.
- `down` = facing the camera, `up` = back to camera, `side` = facing RIGHT
  (the engine mirrors it for left — so no left-facing frames needed).
- The two frames per direction are the walk cycle (alternating legs).
  Frame 0 is also the standing idle.
- Transparent background, character roughly centred in each 32×32 cell,
  feet near the bottom edge.
- Full colour is fine and encouraged — the 16-bit look with dark outlines,
  like the Memao style. No palette restrictions.
- Export at 1x (each frame exactly 32×32 real pixels, no scaling/smoothing).

Memao Sprite Sheet Creator note: if it exports each direction as its own strip
or a 4×N grid, send me whatever it produces — I'll re-cut it to this layout.

## What I'd draw per character (art direction)

- **Baby**: crawling pose for all frames (the down/up/side distinction can be subtle).
- **Toddler**: big head ratio, stubby limbs, bright clothes.
- **Child**: cap or distinctive hair, shorts, sticker book under one arm?
- **Teen**: headphones, hoodie, lankier proportions.
- **Adult**: bald + dark beard + purple jumper. It's your cameo — make it count.

## Later (optional, same idea)

When you're happy with characters, the same pipeline can skin the world:
tiles (grass, path, trees, water, roofs, walls, doors, signs) as a tileset PNG,
and the 8×8 collectible icons as 16×16 full-colour versions. Say the word and
I'll wire the loader + spec for those.
