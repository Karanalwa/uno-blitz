// In-memory schema for rooms - using simple objects instead of DB tables
// for active game sessions

export interface RoomRecord {
  id: bigint;
  code: string;
  name: string;
  hostId: bigint;
  maxPlayers: number;
  gameMode: string;
  turnTimer: number;
  password: string | null;
  status: string;
  createdAt: Date;
}

export interface RoomPlayerRecord {
  id: bigint;
  roomId: bigint;
  userId: bigint;
  username: string;
  isReady: boolean;
  isHost: boolean;
  avatar: string;
}

// These are kept as types only since we use in-memory storage
export const rooms = {} as any;
export const roomPlayers = {} as any;
