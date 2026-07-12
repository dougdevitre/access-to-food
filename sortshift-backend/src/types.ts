export type Mode = "solo" | "team";

export interface ShiftTokenPayload {
  jti: string;
  iat: number; // epoch ms, server-issued
  mode: Mode;
  eventCode?: string;
}

export interface ScoreSubmission {
  token: string;
  initials: string;
  meals: number;
  lbs: number;
  flagged: number;
}

export interface MissBatch {
  token: string;
  misses: { actual: string; chosen: string; n: number }[];
}
