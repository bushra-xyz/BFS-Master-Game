import { useState, useEffect, useCallback, useRef } from "react";
import { generateMaze, bfs, dfs, calculateScore, Position } from "@/lib/maze";
import MazeGrid from "./MazeGrid";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Shuffle, Cpu, GitCompare } from "lucide-react";

const MAZE_SIZE = 21;

type CompareResult = {
  bfsVisited: number;
  dfsVisited: number;
  bfsPath: number;
  dfsPath: number;
};

export default function MazeGame() {
  const [mazeData, setMazeData] = useState(() => generateMaze(MAZE_SIZE, MAZE_SIZE));
  const [player, setPlayer] = useState<Position>(mazeData.start);
  const [steps, setSteps] = useState(0);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [bfsLength, setBfsLength] = useState<number | null>(null);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [dfsVisited, setDfsVisited] = useState<Set<string>>(new Set());
  const [shortestPath, setShortestPath] = useState<Set<string>>(new Set());
  const [bfsRunning, setBfsRunning] = useState(false);
  const [winMessage, setWinMessage] = useState("");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const animTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Timer
  useEffect(() => {
    if (won || steps === 0) return;
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [won, steps > 0]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        move(map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const move = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      if (won || bfsRunning) return;
      const deltas = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
      const [dr, dc] = deltas[dir];
      setPlayer((p) => {
        const nr = p.row + dr;
        const nc = p.col + dc;
        if (nr < 0 || nr >= mazeData.grid.length || nc < 0 || nc >= mazeData.grid[0].length) return p;
        if (mazeData.grid[nr][nc] === 1) return p;
        const newPos = { row: nr, col: nc };
        setSteps((s) => s + 1);
        if (nr === mazeData.exit.row && nc === mazeData.exit.col) {
          handleWin(steps + 1);
        }
        return newPos;
      });
    },
    [won, bfsRunning, mazeData, steps]
  );

  function handleWin(playerSteps: number) {
    setWon(true);
    clearInterval(timerRef.current);
    const result = bfs(mazeData.grid, mazeData.start, mazeData.exit);
    const bfsLen = result ? result.path.length - 1 : playerSteps;
    setBfsLength(bfsLen);
    const s = calculateScore(playerSteps, bfsLen, time);
    setScore(s);
    if (playerSteps === bfsLen) {
      setWinMessage("Perfect 🔥 I see you have conquered the BFS 👀💪");
    } else {
      setWinMessage(`Oops! 💔 BFS found a shorter path (${bfsLen} steps). Try smarter this time ❗`);
    }
  }

  function clearAnims() {
    animTimeouts.current.forEach(clearTimeout);
    animTimeouts.current = [];
    setBfsRunning(false);
  }

  function resetState(mazeOverride?: typeof mazeData) {
    clearAnims();
    const m = mazeOverride ?? mazeData;
    setPlayer(m.start);
    setSteps(0);
    setTime(0);
    setWon(false);
    setScore(null);
    setBfsLength(null);
    setWinMessage("");
    setVisitedCells(new Set());
    setDfsVisited(new Set());
    setShortestPath(new Set());
    setCompareResult(null);
  }

  function resetLevel() {
    resetState();
  }

  function newMaze() {
    const data = generateMaze(MAZE_SIZE, MAZE_SIZE);
    setMazeData(data);
    resetState(data);
  }

  function solveBfs() {
    if (bfsRunning) return;
    clearAnims();
    setVisitedCells(new Set());
    setDfsVisited(new Set());
    setShortestPath(new Set());
    setCompareResult(null);
    setBfsRunning(true);

    const result = bfs(mazeData.grid, mazeData.start, mazeData.exit);
    if (!result) {
      setBfsRunning(false);
      return;
    }
    const { visited, path } = result;
    setBfsLength(path.length - 1);

    visited.forEach((pos, i) => {
      const t = setTimeout(() => {
        setVisitedCells((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
      }, i * 25);
      animTimeouts.current.push(t);
    });

    const pathStart = visited.length * 25 + 200;
    path.forEach((pos, i) => {
      const t = setTimeout(() => {
        setShortestPath((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
        if (i === path.length - 1) setBfsRunning(false);
      }, pathStart + i * 50);
      animTimeouts.current.push(t);
    });
  }

  function compareBfsDfs() {
    clearAnims();
    setVisitedCells(new Set());
    setDfsVisited(new Set());
    setShortestPath(new Set());
    setCompareResult(null);
    setBfsRunning(true);

    const bfsRes = bfs(mazeData.grid, mazeData.start, mazeData.exit);
    const dfsRes = dfs(mazeData.grid, mazeData.start, mazeData.exit);
    if (!bfsRes || !dfsRes) {
      setBfsRunning(false);
      return;
    }
    setBfsLength(bfsRes.path.length - 1);

    const speed = 25;
    bfsRes.visited.forEach((pos, i) => {
      const t = setTimeout(() => {
        setVisitedCells((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
      }, i * speed);
      animTimeouts.current.push(t);
    });
    dfsRes.visited.forEach((pos, i) => {
      const t = setTimeout(() => {
        setDfsVisited((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
      }, i * speed);
      animTimeouts.current.push(t);
    });

    const longest = Math.max(bfsRes.visited.length, dfsRes.visited.length);
    const finishAt = longest * speed + 200;
    const t = setTimeout(() => {
      setCompareResult({
        bfsVisited: bfsRes.visited.length,
        dfsVisited: dfsRes.visited.length,
        bfsPath: bfsRes.path.length - 1,
        dfsPath: dfsRes.path.length - 1,
      });
      setBfsRunning(false);
    }, finishAt);
    animTimeouts.current.push(t);
  }

  const verdict = (() => {
    if (!compareResult) return "";
    const { bfsVisited, dfsVisited, bfsPath, dfsPath } = compareResult;
    if (bfsPath < dfsPath) return "BFS found a shorter path using fewer steps.";
    if (dfsPath < bfsPath) return "DFS surprisingly found a shorter path here.";
    if (dfsVisited < bfsVisited) return "Tie on path length — DFS explored fewer cells but took a longer route exploration.";
    return "Both algorithms tied on path length and exploration.";
  })();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="font-display text-lg sm:text-2xl text-primary tracking-wider">
        Can you match the BFS?
      </h1>

      {winMessage && (
        <div className="font-display text-sm sm:text-base text-maze-player text-center animate-bounce">
          {winMessage}
        </div>
      )}

      <GameStats steps={steps} time={time} bfsLength={bfsLength} score={score} />

      {bfsLength !== null && steps > 0 && !compareResult && (
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="font-display text-xs sm:text-sm tracking-wider text-center text-accent">
            ⚔ You vs BFS ⚔
          </div>
          <div className="grid grid-cols-3 items-center gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">You</div>
              <div className="text-2xl font-bold text-maze-player">{steps}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {steps === bfsLength ? (
                <span className="text-maze-player font-bold">TIE 🔥</span>
              ) : steps < bfsLength ? (
                <span className="text-primary font-bold">-{bfsLength - steps}</span>
              ) : (
                <span className="text-destructive font-bold">+{steps - bfsLength}</span>
              )}
              <div className="text-[10px] mt-1">step diff</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">BFS</div>
              <div className="text-2xl font-bold text-accent">{bfsLength}</div>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-maze-player transition-all duration-500"
              style={{ width: `${(Math.min(steps, bfsLength) / Math.max(steps, bfsLength)) * 50}%` }}
            />
            <div
              className="bg-accent transition-all duration-500"
              style={{ width: `${50 + (1 - Math.min(steps, bfsLength) / Math.max(steps, bfsLength)) * 50}%` }}
            />
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {steps === bfsLength
              ? "You matched the optimal path! 🎯"
              : steps < bfsLength
              ? "Whoa, you beat BFS? Impossible 🤔"
              : `You took ${steps - bfsLength} extra step${steps - bfsLength === 1 ? "" : "s"} (${Math.round(((steps - bfsLength) / bfsLength) * 100)}% longer)`}
          </div>
        </div>
      )}

      <MazeGrid
        grid={mazeData.grid}
        start={mazeData.start}
        exit={mazeData.exit}
        player={player}
        visitedCells={visitedCells}
        dfsVisited={dfsVisited}
        shortestPath={shortestPath}
      />

      {compareResult && (
        <Card className="w-full max-w-md p-4 space-y-3 bg-card border-border">
          <div className="font-display text-xs sm:text-sm tracking-wider text-center text-accent">
            ⟦ BFS vs DFS ⟧
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-maze-visited/40 p-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-maze-visited font-bold">BFS</div>
              <div className="text-xs text-muted-foreground">Visited: <span className="text-foreground font-bold">{compareResult.bfsVisited}</span></div>
              <div className="text-xs text-muted-foreground">Path: <span className="text-foreground font-bold">{compareResult.bfsPath}</span></div>
            </div>
            <div className="rounded-md border border-maze-dfs/40 p-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-maze-dfs font-bold">DFS</div>
              <div className="text-xs text-muted-foreground">Visited: <span className="text-foreground font-bold">{compareResult.dfsVisited}</span></div>
              <div className="text-xs text-muted-foreground">Path: <span className="text-foreground font-bold">{compareResult.dfsPath}</span></div>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground italic">{verdict}</div>
        </Card>
      )}

      <GameControls onMove={move} disabled={won || bfsRunning} />

      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={solveBfs} disabled={bfsRunning} variant="outline" className="border-accent/40 text-accent hover:bg-accent/20">
          <Cpu className="h-4 w-4 mr-2" />
          Solve with BFS
        </Button>
        <Button onClick={compareBfsDfs} disabled={bfsRunning} variant="outline" className="border-maze-dfs/40 text-maze-dfs hover:bg-maze-dfs/20">
          <GitCompare className="h-4 w-4 mr-2" />
          Compare BFS vs DFS
        </Button>
        <Button onClick={resetLevel} variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/20">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Level
        </Button>
        <Button onClick={newMaze} variant="outline" className="border-primary/40 text-primary hover:bg-primary/20">
          <Shuffle className="h-4 w-4 mr-2" />
          Random Maze
        </Button>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-start inline-block" /> Start</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-exit inline-block" /> Exit</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-player inline-block" /> Player</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-visited inline-block" /> BFS</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-dfs inline-block" /> DFS</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-both inline-block" /> Both</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-shortest inline-block" /> Shortest Path</span>
      </div>

      <footer className="mt-12 mb-4 text-xs sm:text-sm font-display tracking-[0.25em] uppercase text-center text-accent">
        ⟡ Developed by{" "}
        <span className="font-extrabold text-primary">
          Bushra Jannat
        </span>
        {" "}&{" "}
        <span className="font-extrabold text-[#ff00ff]">
          Miftahul Jannat
        </span>
        {" "}⟡
      </footer>
    </div>
  );
}
