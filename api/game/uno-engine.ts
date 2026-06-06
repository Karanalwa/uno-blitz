import type { Card, CardColor, GameState, Player, Room, SerializedGameState, SerializedPlayer, RoundScore, CumulativeScore, FinalScore } from "./types";

let cardIdCounter = 0;

function generateCardId(): string {
  return `card_${++cardIdCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  const colors: CardColor[] = ["red", "blue", "green", "yellow"];

  for (const color of colors) {
    // One zero per color
    deck.push({ id: generateCardId(), color, type: "number", value: 0, display: "0" });
    // Two of each 1-9
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: generateCardId(), color, type: "number", value: num, display: `${num}` });
      deck.push({ id: generateCardId(), color, type: "number", value: num, display: `${num}` });
    }
    // Two of each action card per color
    for (let i = 0; i < 2; i++) {
      deck.push({ id: generateCardId(), color, type: "skip", value: 20, display: "SKIP" });
      deck.push({ id: generateCardId(), color, type: "reverse", value: 20, display: "REV" });
      deck.push({ id: generateCardId(), color, type: "draw2", value: 20, display: "+2" });
    }
  }

  // 4 wild cards and 4 wild draw 4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: generateCardId(), color: "wild", type: "wild", value: 50, display: "WILD" });
    deck.push({ id: generateCardId(), color: "wild", type: "wild4", value: 50, display: "+4" });
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function canPlayCard(card: Card, topCard: Card, activeColor: CardColor): boolean {
  // Wild cards can always be played
  if (card.type === "wild" || card.type === "wild4") return true;
  // Match color
  if (card.color === activeColor) return true;
  // Match number or type
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  if (card.type !== "number" && card.type === topCard.type) return true;
  return false;
}

export function hasPlayableCard(player: Player, topCard: Card, activeColor: CardColor): boolean {
  return player.hand.some((card) => canPlayCard(card, topCard, activeColor));
}

export function getNextPlayerIndex(current: number, direction: "clockwise" | "counter_clockwise", playerCount: number, skip = false): number {
  const step = direction === "clockwise" ? 1 : -1;
  let next = current;
  const moves = skip ? 2 : 1;
  for (let i = 0; i < moves; i++) {
    next = (next + step + playerCount) % playerCount;
  }
  return next;
}

export function calculateHandScore(hand: Card[]): number {
  return hand.reduce((sum, card) => sum + card.value, 0);
}

export function serializePlayer(player: Player, isSelf: boolean): SerializedPlayer {
  return {
    id: player.id,
    username: player.username,
    avatar: player.avatar,
    cardCount: player.cardCount,
    hand: isSelf ? player.hand : undefined,
    score: player.score,
    declaredUno: player.declaredUno,
    isActive: player.isActive,
    isHost: player.isHost,
    isReady: player.isReady,
  };
}

export function serializeGameState(state: GameState, forPlayerId: string): SerializedGameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  return {
    phase: state.phase,
    roomCode: state.roomCode,
    roomName: state.roomName,
    players: state.players.map((p) => serializePlayer(p, p.id === forPlayerId)),
    currentPlayerId: currentPlayer?.id || "",
    direction: state.direction,
    activeColor: state.activeColor,
    topCard,
    drawPileCount: state.drawPile.length,
    turnTimer: state.turnTimer,
    turnTimeLeft: state.turnTimeLeft,
    lastAction: state.lastAction,
    roundNumber: state.roundNumber,
    mode: state.mode,
    isYourTurn: currentPlayer?.id === forPlayerId,
    winner: state.winner,
  };
}

export function initGameState(room: Room): GameState {
  const players = Array.from(room.players.values());
  const deck = shuffleDeck(createDeck());

  // Deal 7 cards to each player
  for (const player of players) {
    player.hand = deck.splice(0, 7);
    player.cardCount = 7;
    player.declaredUno = false;
  }

  // Find first non-wild top card
  let topCardIndex = 0;
  while (topCardIndex < deck.length && (deck[topCardIndex].type === "wild" || deck[topCardIndex].type === "wild4")) {
    topCardIndex++;
  }

  const topCard = deck.splice(topCardIndex, 1)[0];
  const discardPile = [topCard];
  const activeColor = topCard.color === "wild" ? "red" : topCard.color as CardColor;

  // If first card is action, apply it
  let currentPlayerIndex = 0;
  if (topCard.type === "skip") {
    currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
  } else if (topCard.type === "reverse") {
    // In 2-player game, reverse acts as skip
    if (players.length === 2) {
      currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
    }
  } else if (topCard.type === "draw2") {
    // First player draws 2
    const firstPlayer = players[0];
    const drawn = deck.splice(0, 2);
    firstPlayer.hand.push(...drawn);
    firstPlayer.cardCount = firstPlayer.hand.length;
    currentPlayerIndex = getNextPlayerIndex(0, "clockwise", players.length);
  }

  return {
    phase: "playing",
    roomId: room.id,
    roomCode: room.code,
    roomName: room.settings.name,
    players,
    currentPlayerIndex,
    direction: "clockwise",
    activeColor,
    discardPile,
    drawPile: deck,
    turnTimer: room.settings.turnTimer,
    turnTimeLeft: room.settings.turnTimer,
    drawStack: 0,
    lastAction: `Game started! First card: ${topCard.color} ${topCard.display}`,
    roundNumber: 1,
    mode: room.settings.mode,
    maxPlayers: room.settings.maxPlayers,
  };
}

export function drawCards(state: GameState, playerIndex: number, count: number): Card[] {
  const player = state.players[playerIndex];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      // Reshuffle discard pile (except top card)
      if (state.discardPile.length > 1) {
        const topCard = state.discardPile[state.discardPile.length - 1];
        const toReshuffle = state.discardPile.slice(0, -1);
        state.drawPile = shuffleDeck(toReshuffle);
        state.discardPile = [topCard];
      } else {
        break; // No more cards
      }
    }
    const card = state.drawPile.pop()!;
    drawn.push(card);
    player.hand.push(card);
  }

  player.cardCount = player.hand.length;
  return drawn;
}

export function playCard(state: GameState, playerIndex: number, cardIndex: number, chosenColor?: CardColor): { success: boolean; message?: string; action?: string } {
  const player = state.players[playerIndex];
  const card = player.hand[cardIndex];

  if (!card) return { success: false, message: "Invalid card" };

  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlayCard(card, topCard, state.activeColor)) {
    return { success: false, message: "Cannot play this card" };
  }

  // For Wild Draw 4, check if player has other matching color cards
  if (card.type === "wild4") {
    const hasMatchingColor = player.hand.some(
      (c) => c.id !== card.id && c.color === state.activeColor
    );
    if (hasMatchingColor) {
      return { success: false, message: "You have matching color cards - cannot play Wild Draw 4" };
    }
  }

  // Remove card from hand
  player.hand.splice(cardIndex, 1);
  player.cardCount = player.hand.length;
  state.discardPile.push(card);

  // Set active color
  if (card.type === "wild" || card.type === "wild4") {
    if (!chosenColor) {
      return { success: false, message: "Must choose a color for Wild card" };
    }
    state.activeColor = chosenColor;
  } else {
    state.activeColor = card.color as CardColor;
  }

  // Reset UNO declaration
  player.declaredUno = false;

  // Resolve action
  let skip = false;
  let action = `${player.username} played ${card.color} ${card.display}`;

  switch (card.type) {
    case "skip":
      skip = true;
      action = `${player.username} played SKIP!`;
      break;
    case "reverse":
      state.direction = state.direction === "clockwise" ? "counter_clockwise" : "clockwise";
      // In 2-player, reverse acts as skip
      if (state.players.length === 2) {
        skip = true;
        action = `${player.username} played REVERSE! (acts as skip in 2-player)`;
      } else {
        action = `${player.username} played REVERSE! Direction changed!`;
      }
      break;
    case "draw2":
      {
        const nextIndex = getNextPlayerIndex(playerIndex, state.direction, state.players.length);
        drawCards(state, nextIndex, 2);
        const nextPlayer = state.players[nextIndex];
        action = `${player.username} played +2! ${nextPlayer.username} draws 2!`;
        skip = true;
      }
      break;
    case "wild":
      action = `${player.username} played WILD! Color changed to ${chosenColor}!`;
      break;
    case "wild4":
      {
        const nextIndex = getNextPlayerIndex(playerIndex, state.direction, state.players.length);
        drawCards(state, nextIndex, 4);
        const nextPlayer = state.players[nextIndex];
        action = `${player.username} played WILD +4! ${nextPlayer.username} draws 4! Color: ${chosenColor}!`;
        skip = true;
      }
      break;
    default:
      action = `${player.username} played ${card.display}`;
  }

  // Check for UNO (1 card left)
  if (player.cardCount === 1) {
    action += ` - UNO!`;
  }

  // Check for win (0 cards)
  if (player.cardCount === 0) {
    state.lastAction = action;
    return { success: true, action, message: "round_win" };
  }

  // Advance turn
  state.currentPlayerIndex = getNextPlayerIndex(playerIndex, state.direction, state.players.length, skip);
  state.turnTimeLeft = state.turnTimer;
  state.lastAction = action;

  return { success: true, action };
}

export function checkUnoViolation(state: GameState): { caught: boolean; targetId?: string } {
  // Check if the previous player played to 1 card without declaring UNO
  // This is called at the start of a new turn
  const prevIndex = state.direction === "clockwise"
    ? (state.currentPlayerIndex - 1 + state.players.length) % state.players.length
    : (state.currentPlayerIndex + 1) % state.players.length;

  const prevPlayer = state.players[prevIndex];
  if (prevPlayer && prevPlayer.cardCount === 1 && !prevPlayer.declaredUno) {
    // They forgot to say UNO! Give them 2 penalty cards
    drawCards(state, prevIndex, 2);
    prevPlayer.declaredUno = true; // Mark as caught so we don't catch again
    return { caught: true, targetId: prevPlayer.id };
  }

  return { caught: false };
}

export function endRound(state: GameState): { winnerId: string; winnerUsername: string; roundScores: RoundScore[]; cumulativeScores: CumulativeScore[] } {
  // Find winner (player with 0 cards)
  const winner = state.players.find((p) => p.cardCount === 0);
  if (!winner) {
    return { winnerId: "", winnerUsername: "", roundScores: [], cumulativeScores: [] };
  }

  // Calculate scores
  let totalPoints = 0;
  const roundScores: RoundScore[] = state.players.map((p) => {
    const points = calculateHandScore(p.hand);
    if (p.id !== winner.id) {
      totalPoints += points;
    }
    return {
      playerId: p.id,
      username: p.username,
      cardsRemaining: p.cardCount,
      points: p.id === winner.id ? 0 : points,
      roundWinner: p.id === winner.id,
    };
  });

  // Add points to winner
  winner.score += totalPoints;

  const cumulativeScores: CumulativeScore[] = state.players.map((p) => ({
    playerId: p.id,
    score: p.score,
  }));

  return {
    winnerId: winner.id,
    winnerUsername: winner.username,
    roundScores,
    cumulativeScores,
  };
}

export function shouldEndMatch(state: GameState): boolean {
  const targetScore = state.mode === "classic" ? 500 : 200;
  return state.players.some((p) => p.score >= targetScore);
}

export function getMatchWinner(state: GameState): { winnerId: string; winnerUsername: string; finalScores: FinalScore[] } {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const finalScores: FinalScore[] = sorted.map((p, i) => ({
    playerId: p.id,
    username: p.username,
    score: p.score,
    rank: i + 1,
  }));

  return {
    winnerId: winner.id,
    winnerUsername: winner.username,
    finalScores,
  };
}

export function startNewRound(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());

  // Deal 7 cards to each player
  for (const player of state.players) {
    player.hand = deck.splice(0, 7);
    player.cardCount = 7;
    player.declaredUno = false;
  }

  // Find first non-wild top card
  let topCardIndex = 0;
  while (topCardIndex < deck.length && (deck[topCardIndex].type === "wild" || deck[topCardIndex].type === "wild4")) {
    topCardIndex++;
  }

  const topCard = deck.splice(topCardIndex, 1)[0];
  const activeColor = topCard.color === "wild" ? "red" : topCard.color as CardColor;

  state.discardPile = [topCard];
  state.drawPile = deck;
  state.currentPlayerIndex = 0;
  state.direction = "clockwise";
  state.activeColor = activeColor;
  state.turnTimeLeft = state.turnTimer;
  state.drawStack = 0;
  state.phase = "playing";
  state.roundNumber++;
  state.lastAction = `Round ${state.roundNumber} started!`;
  state.winner = undefined;

  return state;
}
