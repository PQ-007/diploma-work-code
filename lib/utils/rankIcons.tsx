import {
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessQueen,
  ChessPawn,
  ChessRook,
} from "lucide-react";

/**
 * Returns the appropriate rank icon based on ranking points.
 * Same logic as used in Leaderboard component.
 */
export const getRankIcon = (rankingPoints: number) => {
  if (rankingPoints >= 2500)
    return <ChessKing className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (rankingPoints >= 2000)
    return <ChessQueen className="h-3.5 w-3.5 shrink-0 text-orange-500" />;
  if (rankingPoints >= 1600)
    return <ChessRook className="h-3.5 w-3.5 shrink-0 text-purple-500" />;
  if (rankingPoints >= 1200)
    return <ChessBishop className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
  if (rankingPoints >= 800)
    return <ChessKnight className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  return <ChessPawn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
};
