import { useState, useEffect, useCallback, useRef } from "react";
import { generateMaze, bfs, calculateScore, Position } from "@/lib/maze";
import MazeGrid from "./MazeGrid";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import { Button } from "@/components/ui/button";
import { RotateCcw, Shuffle, Cpu } from "lucide-react";

const MAZE_SIZE = 21; // Must be odd for maze gen

export default function MazeGame() {
  const [mazeData, setMazeData] = useState(() => generateMaze(MAZE_SIZE, MAZE_SIZE));
  const [player, setPlayer] = useState<Position>(mazeData.start);
  const [steps, setSteps] = useState(0);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [bfsLength, setBfsLength] = useState<number | null>(null);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [shortestPath, setShortestPath] = useState<Set<string>>(new Set());
  const [bfsRunning, setBfsRunning] = useState(false);
  const [winMessage, setWinMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const bfsTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

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
        // Check win
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
      setWinMessage("🏆 Perfect Path!");
    } else {
      setWinMessage(`🎉 Good Job! But BFS found a shorter path (${bfsLen} steps). Try harder next time!`);
    }
  }

  function resetLevel() {
    clearBfs();
    setPlayer(mazeData.start);
    setSteps(0);
    setTime(0);
    setWon(false);
    setScore(null);
    setBfsLength(null);
    setWinMessage("");
    setVisitedCells(new Set());
    setShortestPath(new Set());
  }

  function newMaze() {
    clearBfs();
    const data = generateMaze(MAZE_SIZE, MAZE_SIZE);
    setMazeData(data);
    setPlayer(data.start);
    setSteps(0);
    setTime(0);
    setWon(false);
    setScore(null);
    setBfsLength(null);
    setWinMessage("");
    setVisitedCells(new Set());
    setShortestPath(new Set());
  }

  function clearBfs() {
    bfsTimeouts.current.forEach(clearTimeout);
    bfsTimeouts.current = [];
    setBfsRunning(false);
  }

  function solveBfs() {
    if (bfsRunning) return;
    clearBfs();
    setVisitedCells(new Set());
    setShortestPath(new Set());
    setBfsRunning(true);

    const result = bfs(mazeData.grid, mazeData.start, mazeData.exit);
    if (!result) {
      setBfsRunning(false);
      return;
    }

    const { visited, path } = result;
    setBfsLength(path.length - 1);

    // Animate visited
    visited.forEach((pos, i) => {
      const t = setTimeout(() => {
        setVisitedCells((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
      }, i * 25);
      bfsTimeouts.current.push(t);
    });

    // Animate path after visited
    const pathStart = visited.length * 25 + 200;
    path.forEach((pos, i) => {
      const t = setTimeout(() => {
        setShortestPath((prev) => new Set(prev).add(`${pos.row},${pos.col}`));
        if (i === path.length - 1) setBfsRunning(false);
      }, pathStart + i * 50);
      bfsTimeouts.current.push(t);
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="font-display text-lg sm:text-2xl text-primary tracking-wider">
        Maze Escape BFS
      </h1>

      {winMessage && (
        <div className="font-display text-sm sm:text-base text-maze-player text-center animate-bounce">
          {winMessage}
        </div>
      )}

      <GameStats steps={steps} time={time} bfsLength={bfsLength} score={score} />

      <MazeGrid
        grid={mazeData.grid}
        start={mazeData.start}
        exit={mazeData.exit}
        player={player}
        visitedCells={visitedCells}
        shortestPath={shortestPath}
      />

      <GameControls onMove={move} disabled={won || bfsRunning} />

      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={solveBfs} disabled={bfsRunning} variant="outline" className="border-accent/40 text-accent hover:bg-accent/20">
          <Cpu className="h-4 w-4 mr-2" />
          Solve with BFS
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
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-visited inline-block" /> BFS Visited</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-maze-shortest inline-block" /> Shortest Path</span>
      </div>
    </div>
  );
}
