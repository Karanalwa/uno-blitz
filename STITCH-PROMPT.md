# Stitch Prompt — UNO Blitz UI

Paste the **Master Prompt** into Google Stitch. If Stitch truncates, use the **Condensed
Prompt** instead, then refine screen-by-screen with the follow-ups at the bottom.

---

## MASTER PROMPT

Design a polished, modern web game UI (responsive, desktop-first, also works on mobile) for
**UNO Blitz**, a fast multiplayer UNO-style card game. The vibe: a premium digital card-game
table — playful, energetic, tactile, and a little arcade-neon, but clean and readable. Think
"a card game you'd see in a top-tier mobile game" — glossy cards, soft depth, satisfying.

ART DIRECTION
- Background: a dark casino-felt table with a soft radial spotlight in the center, subtle
  vignette, faint noise/texture, and gentle ambient glow. Deep charcoal-to-midnight gradient
  (#11131A → #1B1E2B). Not flat black.
- Card colors (the four classic suits): Red #E4322B, Yellow #F6B500, Green #18A558,
  Blue #1E7FD6. Wild = four-color quadrant / rainbow.
- Accent / UI highlights: warm gold #FFD15C and electric cyan #36E0FF for glows, focus
  rings, and "your turn" emphasis.
- Cards: rounded-rectangle, glossy white border (~6%), the iconic diagonal oval in the
  center tilted ~20°, bold chunky numerals with a crisp outline + soft drop shadow, subtle
  top gloss highlight, and a faint inner bevel so they feel physical. Card backs: deep navy
  with a stylized glowing "UNO Blitz" emblem.
- Typography: a rounded, heavy display font (Baloo 2 / Paytone One / Luckiest Guy energy)
  for the logo, numerals, and headings; a clean rounded sans (Inter / Nunito) for body and
  buttons. Big, confident, high-contrast.
- Surfaces: glassmorphism panels (frosted, soft border, drop shadow) for modals, the lobby
  card, and the HUD. Rounded corners (2xl), generous padding, soft shadows.

SCREENS TO DESIGN

1. TITLE / HOME SCREEN
   - Huge animated "UNO Blitz" logo, cards fanning behind it.
   - Primary buttons: "Play Solo" (vs AI bots) and "Play Online".
   - Online section: "Create Room" and "Join Room" (6-digit code input with large segmented
     OTP-style boxes).
   - A small avatar + name picker (8 character avatars: robot, cat, alien, ninja, pirate,
     astronaut, dragon, unicorn) shown as a horizontal selectable carousel of glossy chips.
   - Connection status pill ("Online / Connecting…") top-right; settings (sound on/off) gear.

2. LOBBY / WAITING ROOM
   - Room name + big copyable 6-digit code.
   - Player slots around a table: avatar, name, "Ready" toggle (glowing check when ready),
     host crown badge.
   - Game settings card: max players, mode (Classic / Quick), turn timer.
   - "Start Game" CTA for host (disabled until ≥2 ready), with a subtle pulse when enabled.
   - Lightweight chat panel on the side.

3. GAME BOARD (the hero screen)
   - Center: the discard pile (top card large + glossy) and the draw deck (stacked cards with
     depth), with the active color shown as a glowing ring around the pile.
   - Opponents arranged around the top/sides as compact avatar pods showing name, card count
     (face-down mini fan), and a turn highlight.
   - YOUR HAND: a fanned arc of cards along the bottom, cards lift and glow on hover, playable
     cards subtly highlighted, non-playable dimmed.
   - HUD: current turn indicator, direction arrow (clockwise/counter), turn timer ring,
     round/score chip, a big glowing "UNO!" call button, and a draw button.
   - Wild color picker: a radial 4-color wheel modal that bursts open when a Wild is played.
   - Win/round-end overlay with a trophy, confetti, and scores.

MOTION / ANIMATION (make this feel alive)
- Deal: cards fly from the deck in an arc to each hand with stagger + slight rotation.
- Play a card: it lifts, arcs to the pile, lands with a squash-and-stretch "snap" and a tiny
  dust/impact ripple; the pile briefly scales.
- Draw: a card whooshes from the deck into your hand and slots into the fan.
- Active color change: the ring around the pile cross-fades to the new color with a glow pulse.
- Reverse: direction arrow spins 180°; Skip: skipped avatar shakes + a red "Skip" stamp.
- Draw 2 / Wild Draw 4: cards stack onto the target's hand with a counting pop.
- "Your turn": the player's hand and frame breathe with a soft cyan/gold glow + timer ring.
- UNO call: a celebratory radial burst + the word "UNO!" punches in with scale + shimmer.
- Win: confetti, trophy zoom-in, score counters tick up.
- Micro-interactions: buttons have press depth + ripple; hover lifts; smooth 200–300ms eases
  (easeOutBack for playful pops). Everything springy, never janky.

TONE: fun and premium, high readability, accessible contrast, color-blind-safe icons on the
suit colors (small symbol differences, not color alone). Deliver Home, Lobby, and Game Board
as separate screens plus the Wild color-picker and win overlay as components.

---

## CONDENSED PROMPT (if Stitch limits length)

Design a responsive, desktop-first web UI for "UNO Blitz", a multiplayer UNO-style card game.
Premium digital card-table vibe: dark casino-felt background with a center spotlight and soft
glow, glossy rounded cards with the classic diagonal oval and chunky outlined numerals, four
suit colors (Red #E4322B, Yellow #F6B500, Green #18A558, Blue #1E7FD6) plus a rainbow Wild,
gold/cyan accent glows, glassmorphism panels, and a rounded heavy display font (Baloo 2 /
Paytone One energy). Design three screens: (1) Home — big animated logo, "Play Solo" and
"Play Online" buttons, Create/Join room with a 6-digit OTP-style code input, and an 8-avatar
picker carousel; (2) Lobby — room code, player slots with ready toggles + host crown, game
settings, glowing "Start Game" CTA, chat; (3) Game Board — center discard pile + draw deck
with a glowing active-color ring, opponent avatar pods with card counts, a fanned bottom hand
with hover-lift and playable-card highlights, a HUD with turn indicator, direction arrow, turn
timer ring, score chip, draw button and a glowing "UNO!" button, plus a radial Wild color
picker and a confetti win overlay. Make it feel alive with springy card-deal arcs, a
squash-and-stretch play "snap", whoosh draws, glow pulses on turn, and a celebratory UNO
burst. Fun, premium, high-contrast, color-blind-safe suit icons.

---

## SOUND DESIGN SPEC (implement in code, not Stitch)

The app already uses the Web Audio API. Layer these cues (synth or sampled):
- **Card snap / play:** short woody "tok" with a quick pitch drop + tiny reverb tail.
- **Draw card:** soft paper "whoosh" (filtered noise sweep).
- **Shuffle / deal:** rapid riffle of paper ticks at deal start.
- **Color / wild pick:** bright rainbow "shimmer" arpeggio (ascending 4 notes, one per color).
- **Skip:** a quick "denied" buzz; **Reverse:** a short rising-then-falling swoop.
- **Draw 2 / +4:** stacked "pop-pop" counting blips that rise in pitch.
- **Your turn:** a gentle two-note chime; soft ticking as the timer runs low.
- **UNO call:** a punchy fanfare stinger + crowd "cheer" swell.
- **Win:** triumphant fanfare with confetti shimmer.
- **UI:** subtle button taps/clicks; hover ticks.
- **Ambient:** optional low-volume lounge/casino loop with a mute toggle (persist preference).
Keep SFX short (<400ms), ducked under music, and respect the sound on/off setting.

---

## FOLLOW-UP REFINEMENTS (send after the first generation)
- "Make the Game Board card hand a wider fanned arc with more overlap and stronger hover lift."
- "Add a glowing turn-timer ring around the active player's avatar."
- "Show the Wild color picker as a radial 4-segment wheel that bursts from the played card."
- "Give the discard pile an animated glowing ring in the current active color."
- "Add a mobile portrait layout: opponents as a top bar, hand as a thumb-reachable bottom fan."
