import type { Card, CardColor, GameState, Player, GameSettings } from "./types";
import { CARD_COLORS, AVATARS, BOT_NAMES } from "./types";

let cardIdCounter = 0;
function genId(): string {
  return `c_${++cardIdCounter}_${Math.random().toString(36).slice(2, 5)}`;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of CARD_COLORS) {
    deck.push({ id: genId(), color, type: "number", value: 0, display: "0" });
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: genId(), color, type: "number", value: n, display: `${n}` });
      deck.push({ id: genId(), color, type: "number", value: n, display: `${n}` });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: genId(), color, type: "skip", value: 20, display: "S" });
      deck.push({ id: genId(), color, type: "reverse", value: 20, display: "R" });
      deck.push({ id: genId(), color, type: "draw2", value: 20, display: "+2" });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: genId(), color: "wild", type: "wild", value: 50, display: "W" });
    deck.push({ id: genId(), color: "wild", type: "wild4", value: 50, display: "+4" });
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function canPlayCard(card: Card, topCard: Card, activeColor: CardColor): boolean {
  if (card.type === "wild" || card.type === "wild4") return true;
  if (card.color === activeColor) return true;
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  if (card.type !== "number" && card.type === topCard.type) return true;
  return false;
}

export function hasPlayableCard(player: Player, topCard: Card, activeColor: CardColor): boolean {
  return player.hand.some((c) => canPlayCard(c, topCard, activeColor));
}

export function getNextPlayerIndex(current: number, dir: "clockwise" | "counter_clockwise", count: number, skip = false): number {
  const step = dir === "clockwise" ? 1 : -1;
  let next = current;
  const moves = skip ? 2 : 1;
  for (let i = 0; i < moves; i++) {
    next = (next + step + count) % count;
  }
  return next;
}

export function calcHandScore(hand: Card[]): number {
  return hand.reduce((s, c) => s + c.value, 0);
}

export function createBotPlayers(count: number, startIndex: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bot_${startIndex + i}`,
    username: BOT_NAMES[(startIndex + i) % BOT_NAMES.length],
    avatar: AVATARS[(startIndex + i + 2) % AVATARS.length],
    hand: [],
    cardCount: 0,
    score: 0,
    declaredUno: false,
    isActive: false,
    isHost: false,
    isReady: true,
    isBot: true,
  }));
}

export function initGame(settings: GameSettings, humanName: string, humanAvatar: string): GameState {
  const deck = shuffle(createDeck());
  const players: Player[] = [
    {
      id: "human",
      username: humanName,
      avatar: humanAvatar,
      hand: [],
      cardCount: 0,
      score: 0,
      declaredUno: false,
      isActive: false,
      isHost: true,
      isReady: true,
      isBot: false,
    },
    ...createBotPlayers(settings.botCount, 0),
  ];

  // Deal 7 cards each
  for (const p of players) {
    p.hand = deck.splice(0, 7);
    p.cardCount = 7;
    p.declaredUno = false;
  }

  // First non-wild card
  let ti = 0;
  while (ti < deck.length && (deck[ti].type === "wild" || deck[ti].type === "wild4")) ti++;
  const topCard = deck.splice(ti, 1)[0];
  const discardPile = [topCard];
  const activeColor = topCard.color === "wild" ? "red" : (topCard.color as CardColor);

  let currentPlayerIndex = 0;

  // Handle first-card actions
  if (topCard.type === "skip") {
    currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
  } else if (topCard.type === "reverse" && players.length === 2) {
    currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
  } else if (topCard.type === "draw2") {
    const drawn = deck.splice(0, 2);
    players[0].hand.push(...drawn);
    players[0].cardCount = players[0].hand.length;
    currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
  }

  return {
    phase: "playing",
    players,
    currentPlayerIndex,
    direction: "clockwise",
    activeColor,
    discardPile,
    drawPile: deck,
    turnTimer: settings.turnTimer,
    turnTimeLeft: settings.turnTimer,
    lastAction: `First card: ${topCard.color} ${topCard.display}`,
    roundNumber: 1,
    targetScore: settings.mode === "classic" ? 500 : 200,
  };
}

export function drawCards(state: GameState, playerIndex: number, count: number): Card[] {
  const player = state.players[playerIndex];
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length > 1) {
        const top = state.discardPile[state.discardPile.length - 1];
        state.drawPile = shuffle(state.discardPile.slice(0, -1));
        state.discardPile = [top];
      } else break;
    }
    const card = state.drawPile.pop()!;
    drawn.push(card);
    player.hand.push(card);
  }
  player.cardCount = player.hand.length;
  return drawn;
}

export interface PlayResult {
  success: boolean;
  action?: string;
  roundEnd?: { winnerId: string; winnerName: string; scores: RoundScore[]; cumulative: CumScore[] };
  matchEnd?: { winnerId: string; winnerName: string; finalScores: FinalScore[] };
}

export interface RoundScore { playerId: string; username: string; cardsRemaining: number; points: number; roundWinner: boolean; }
export interface CumScore { playerId: string; score: number; }
export interface FinalScore { playerId: string; username: string; score: number; rank: number; }

export function playCard(state: GameState, playerIndex: number, cardIndex: number, chosenColor?: CardColor): PlayResult {
  const player = state.players[playerIndex];
  const card = player.hand[cardIndex];
  if (!card) return { success: false };

  const topCard = state.discardPile[state.discardPile.length - 1];
  if (!canPlayCard(card, topCard, state.activeColor)) return { success: false };

  if (card.type === "wild4") {
    const hasMatching = player.hand.some((c) => c.id !== card.id && c.color === state.activeColor);
    if (hasMatching) return { success: false };
  }

  // Play the card
  player.hand.splice(cardIndex, 1);
  player.cardCount = player.hand.length;
  state.discardPile.push(card);

  if (card.type === "wild" || card.type === "wild4") {
    if (!chosenColor) return { success: false };
    state.activeColor = chosenColor;
  } else {
    state.activeColor = card.color as CardColor;
  }

  player.declaredUno = false;

  let skip = false;
  let action = `${player.username} played ${card.type === "wild" || card.type === "wild4" ? card.display : card.color + " " + card.display}`;

  switch (card.type) {
    case "skip":
      skip = true;
      action = `${player.username} played SKIP!`;
      break;
    case "reverse":
      state.direction = state.direction === "clockwise" ? "counter_clockwise" : "clockwise";
      if (state.players.length === 2) {
        skip = true;
        action = `${player.username} played REVERSE! (skip)`;
      } else {
        action = `${player.username} played REVERSE!`;
      }
      break;
    case "draw2": {
      const ni = getNextPlayerIndex(playerIndex, state.direction, state.players.length);
      drawCards(state, ni, 2);
      action = `${player.username} played +2! ${state.players[ni].username} draws 2!`;
      skip = true;
      break;
    }
    case "wild":
      action = `${player.username} played WILD! Color: ${chosenColor}!`;
      break;
    case "wild4": {
      const ni = getNextPlayerIndex(playerIndex, state.direction, state.players.length);
      drawCards(state, ni, 4);
      action = `${player.username} played WILD +4! ${state.players[ni].username} draws 4!`;
      skip = true;
      break;
    }
    default:
      action = `${player.username} played ${card.display}`;
  }

  // Check for round win
  if (player.cardCount === 0) {
    state.lastAction = action;
    const roundResult = resolveRoundEnd(state, player.id);
    return { success: true, action: "round_win", roundEnd: roundResult };
  }

  // UNO
  if (player.cardCount === 1) {
    player.declaredUno = true;
    action += " - UNO!";
  }

  state.currentPlayerIndex = getNextPlayerIndex(playerIndex, state.direction, state.players.length, skip);
  state.turnTimeLeft = state.turnTimer;
  state.lastAction = action;

  return { success: true, action };
}

function resolveRoundEnd(state: GameState, winnerId: string): { winnerId: string; winnerName: string; scores: RoundScore[]; cumulative: CumScore[] } {
  const winner = state.players.find((p) => p.id === winnerId)!;
  let totalPoints = 0;

  const scores: RoundScore[] = state.players.map((p) => {
    const pts = calcHandScore(p.hand);
    if (p.id !== winnerId) totalPoints += pts;
    return { playerId: p.id, username: p.username, cardsRemaining: p.cardCount, points: p.id === winnerId ? 0 : pts, roundWinner: p.id === winnerId };
  });

  winner.score += totalPoints;

  const cumulative: CumScore[] = state.players.map((p) => ({ playerId: p.id, score: p.score }));

  return { winnerId: winner.id, winnerName: winner.username, scores, cumulative };
}

export function handleDraw(state: GameState, playerIndex: number): boolean {
  const player = state.players[playerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (hasPlayableCard(player, topCard, state.activeColor)) return false;

  const drawn = drawCards(state, playerIndex, 1);
  if (drawn.length === 0) {
    state.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
    state.turnTimeLeft = state.turnTimer;
    state.lastAction = `${player.username} had to pass`;
    return true;
  }

  // Check if drawn card is playable
  const drawnCard = drawn[0];
  if (canPlayCard(drawnCard, topCard, state.activeColor)) {
    state.lastAction = `${player.username} drew a card (playable)`;
  } else {
    state.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
    state.turnTimeLeft = state.turnTimer;
    state.lastAction = `${player.username} drew and passed`;
  }
  return true;
}

export function handlePass(state: GameState, playerIndex: number): boolean {
  if (playerIndex !== state.currentPlayerIndex) return false;
  state.currentPlayerIndex = getNextPlayerIndex(playerIndex, state.direction, state.players.length);
  state.turnTimeLeft = state.turnTimer;
  state.lastAction = `${state.players[playerIndex].username} passed`;
  return true;
}

export function handleDeclareUno(state: GameState, playerIndex: number): boolean {
  const player = state.players[playerIndex];
  if (player.cardCount !== 1) return false;
  player.declaredUno = true;
  state.lastAction = `${player.username} declared UNO!`;
  return true;
}

export function checkMatchEnd(state: GameState): { winnerId: string; winnerName: string; finalScores: FinalScore[] } | null {
  const winner = state.players.find((p) => p.score >= state.targetScore);
  if (!winner) return null;

  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  return {
    winnerId: winner.id,
    winnerName: winner.username,
    finalScores: sorted.map((p, i) => ({ playerId: p.id, username: p.username, score: p.score, rank: i + 1 })),
  };
}

export function startNewRound(state: GameState): void {
  const deck = shuffle(createDeck());
  for (const p of state.players) {
    p.hand = deck.splice(0, 7);
    p.cardCount = 7;
    p.declaredUno = false;
  }

  let ti = 0;
  while (ti < deck.length && (deck[ti].type === "wild" || deck[ti].type === "wild4")) ti++;
  const topCard = deck.splice(ti, 1)[0];

  state.discardPile = [topCard];
  state.drawPile = deck;
  state.currentPlayerIndex = 0;
  state.direction = "clockwise";
  state.activeColor = topCard.color === "wild" ? "red" : (topCard.color as CardColor);
  state.turnTimeLeft = state.turnTimer;
  state.phase = "playing";
  state.roundNumber++;
  state.lastAction = `Round ${state.roundNumber}! First: ${topCard.color} ${topCard.display}`;
  state.winner = undefined;
}

// AI Bot Logic
export function getBotPlay(state: GameState, botIndex: number): { action: "play"; cardIndex: number; chosenColor?: CardColor } | { action: "draw" } | { action: "pass" } {
  const bot = state.players[botIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  // Find playable cards
  const playableIndices: number[] = [];
  bot.hand.forEach((card, i) => {
    if (canPlayCard(card, topCard, state.activeColor)) {
      playableIndices.push(i);
    }
  });

  if (playableIndices.length === 0) {
    // Must draw
    return { action: "draw" };
  }

  // Strategy: prioritize cards that are most beneficial
  // 1. If we have 2 cards and one is playable, play the one that leads to UNO
  // 2. Prefer action cards (skip, reverse, draw2) to disrupt opponents
  // 3. Save wild cards for emergencies (when few cards left)
  // 4. Prefer matching the active color

  let bestIndex = playableIndices[0];
  let bestScore = -1;

  for (const idx of playableIndices) {
    const card = bot.hand[idx];
    let score = 0;

    // Prefer playing when hand is small
    if (bot.hand.length <= 3) score += 10;

    // Prefer non-wild cards when we have other options
    if (card.type === "wild" && bot.hand.length > 2) score -= 3;
    if (card.type === "wild4" && bot.hand.length > 2) score -= 5;

    // Prefer action cards that hurt opponents
    if (card.type === "skip") score += 4;
    if (card.type === "draw2") score += 5;
    if (card.type === "wild4") score += 6;
    if (card.type === "reverse" && state.players.length > 2) score += 2;

    // Prefer matching color over number
    if (card.color === state.activeColor) score += 2;

    // If this would win the round, always play it
    if (bot.hand.length === 1) score += 100;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  }

  const chosenCard = bot.hand[bestIndex];
  let chosenColor: CardColor | undefined;

  if (chosenCard.type === "wild" || chosenCard.type === "wild4") {
    // Pick the color we have the most of in remaining hand
    const colorCounts: Record<string, number> = {};
    for (const c of bot.hand) {
      if (c.id !== chosenCard.id && c.color !== "wild") {
        colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
      }
    }
    const bestColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0];
    chosenColor = (bestColor?.[0] as CardColor) || "red";
  }

  return { action: "play", cardIndex: bestIndex, chosenColor };
}
