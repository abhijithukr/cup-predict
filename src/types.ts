export type ViewType = 'LOGIN' | 'DASHBOARD' | 'PREDICTIONS' | 'KNOCKOUTS' | 'LEADERBOARD' | 'PROFILE';

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  studentId: string;
  points: number;
  rank: number;
  accuracy: number | null;
  predictionsCount: number;
  winStreak: number;
  classYear: string;
  department: string;
  avatarUrl: string;
}

export interface MatchPrediction {
  id: string; // "groupA_1", etc.
  group: string; // "Group A"
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  scoreA: string; // Current pre-filled input or saved value
  scoreB: string;
  kickoffTime: string; // e.g. "Today, 20:45"
  dateLabel: string; // e.g. "Tomorrow, June 14th"
  isClosed: boolean;
  actualScoreA?: number;
  actualScoreB?: number;
  userScoreA?: number;
  userScoreB?: number;
  status?: 'CORRECT' | 'INCORRECT' | 'OPEN';
  pointsEarned?: number;
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  username: string;
  department: string;
  correctPercentage: number;
  points: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface BracketPath {
  id: string; // e.g. 'q1-1', 'q1-2', etc.
  teamName: string;
  teamCode: string;
}

export interface BracketState {
  // Round of 16 match winners
  m1: string; // GER or DEN
  m2: string; // ESP or GEO
  m3: string; // POR or SVN
  m4: string; // FRA or BEL
  
  // Quarter finalists
  q1: string; // Winner of m1 vs m2
  q2: string; // Winner of m3 vs m4
  
  // Semi finalists
  s1: string; // Winner of q1 vs q2
  
  // Champion
  champion: string;
}
