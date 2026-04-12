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
 * Rule:
 * - King:    10000+
 * - Queen:   8000-9999
 * - Rook:    6000-7999
 * - Knight:  3500-5999
 * - Bishop:  1500-3499
 * - Pawn:    0-1499
 */
export const getRankIcon = (rankingPoints: number) => {
  if (rankingPoints >= 10000)
    return <ChessKing className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (rankingPoints >= 8000)
    return <ChessQueen className="h-3.5 w-3.5 shrink-0 text-orange-500" />;
  if (rankingPoints >= 6000)
    return <ChessRook className="h-3.5 w-3.5 shrink-0 text-purple-500" />;
  if (rankingPoints >= 3500)
    return <ChessKnight className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  if (rankingPoints >= 1500)
    return <ChessBishop className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
  return <ChessPawn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
};
