import { getRankIcon } from "@/lib/utils/rankIcons";

/**
 * Test component to verify rank icons are working correctly.
 * Shows icons for different ranking point values.
 */
export function RankIconTest() {
  const testRanks = [0, 1200, 1600, 3600, 6200, 8200, 10500];

  return (
    <div className="p-4 space-y-2 border rounded-lg">
      <h3 className="font-semibold">Rank Icon Test</h3>
      {testRanks.map((points) => (
        <div key={points} className="flex items-center gap-2">
          <span className="w-16 text-sm">{points} pts:</span>
          {getRankIcon(points)}
          <span className="text-xs text-muted-foreground">
            {points >= 10000
              ? "King"
              : points >= 8000
                ? "Queen"
                : points >= 6000
                  ? "Rook"
                  : points >= 3500
                    ? "Knight"
                    : points >= 1500
                      ? "Bishop"
                      : "Pawn"}
          </span>
        </div>
      ))}
    </div>
  );
}
