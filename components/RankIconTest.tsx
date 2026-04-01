import { getRankIcon } from "@/lib/utils/rankIcons";

/**
 * Test component to verify rank icons are working correctly.
 * Shows icons for different ranking point values.
 */
export function RankIconTest() {
  const testRanks = [0, 500, 900, 1300, 1700, 2100, 2600];

  return (
    <div className="p-4 space-y-2 border rounded-lg">
      <h3 className="font-semibold">Rank Icon Test</h3>
      {testRanks.map((points) => (
        <div key={points} className="flex items-center gap-2">
          <span className="w-16 text-sm">{points} pts:</span>
          {getRankIcon(points)}
          <span className="text-xs text-muted-foreground">
            {points >= 2500
              ? "King"
              : points >= 2000
                ? "Queen"
                : points >= 1600
                  ? "Rook"
                  : points >= 1200
                    ? "Bishop"
                    : points >= 800
                      ? "Knight"
                      : "Pawn"}
          </span>
        </div>
      ))}
    </div>
  );
}
