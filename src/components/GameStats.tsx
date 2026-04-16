import { Timer, Footprints, Trophy } from "lucide-react";

interface GameStatsProps {
  steps: number;
  time: number;
  score: number | null;
  bfsLength: number | null;
}

export default function GameStats({ steps, time, bfsLength, score }: GameStatsProps) {
  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <div className="flex flex-wrap gap-4 justify-center text-sm">
      <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border">
        <Timer className="h-4 w-4 text-accent" />
        <span className="text-muted-foreground">Time</span>
        <span className="font-bold text-foreground">{mins}:{secs.toString().padStart(2, "0")}</span>
      </div>
      <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border">
        <Footprints className="h-4 w-4 text-secondary" />
        <span className="text-muted-foreground">Steps</span>
        <span className="font-bold text-foreground">{steps}</span>
      </div>
      {bfsLength !== null && (
        <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border">
          <span className="text-muted-foreground">BFS</span>
          <span className="font-bold text-accent">{bfsLength}</span>
        </div>
      )}
      {score !== null && (
        <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border">
          <Trophy className="h-4 w-4 text-maze-player" />
          <span className="text-muted-foreground">Score</span>
          <span className="font-bold text-maze-player">{score}</span>
        </div>
      )}
    </div>
  );
}
