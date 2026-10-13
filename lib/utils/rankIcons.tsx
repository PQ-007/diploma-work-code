import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessQueen, ChessRook } from "lucide-react";

/**
 * Rank icon from ranking points (King 10000+, Queen 8000+, Rook 6000+,
 * Knight 3500+, Bishop 1500+, Pawn below). `size` is in Tailwind units
 * (4 = 16px); applied inline because Tailwind can't see dynamic class names.
 */
export const getRankIcon = (rankingPoints: number, size: number = 4) => {
  const style = { width: size * 4, height: size * 4 };
  const props = { style, className: "shrink-0", "aria-hidden": true } as const;
  if (rankingPoints >= 10000) return <ChessKing {...props} className="shrink-0 text-brand-red" />;
  if (rankingPoints >= 8000) return <ChessQueen {...props} className="shrink-0 text-warning" />;
  if (rankingPoints >= 6000) return <ChessRook {...props} className="shrink-0 text-primary" />;
  if (rankingPoints >= 3500) return <ChessKnight {...props} className="shrink-0 text-success" />;
  if (rankingPoints >= 1500) return <ChessBishop {...props} className="shrink-0 text-brand-sky" />;
  return <ChessPawn {...props} className="shrink-0 text-muted-foreground" />;
};
