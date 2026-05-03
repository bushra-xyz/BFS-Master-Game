import { MazeGrid as MazeGridType, Position } from "@/lib/maze";

type CellState = "wall" | "path" | "start" | "exit" | "player" | "visited" | "dfs" | "both" | "shortest" | "highlight";

interface MazeGridProps {
  grid: MazeGridType;
  start: Position;
  exit: Position;
  player: Position;
  visitedCells: Set<string>;
  shortestPath: Set<string>;
  dfsVisited?: Set<string>;
  highlightCell?: Position | null;
}

function getCellState(
  row: number, col: number,
  props: MazeGridProps
): CellState {
  const k = `${row},${col}`;
  if (row === props.player.row && col === props.player.col) return "player";
  if (props.shortestPath.has(k)) return "shortest";
  if (props.highlightCell && props.highlightCell.row === row && props.highlightCell.col === col) return "highlight";
  if (row === props.start.row && col === props.start.col) return "start";
  if (row === props.exit.row && col === props.exit.col) return "exit";
  const inBfs = props.visitedCells.has(k);
  const inDfs = props.dfsVisited?.has(k);
  if (inBfs && inDfs) return "both";
  if (inBfs) return "visited";
  if (inDfs) return "dfs";
  if (props.grid[row][col] === 1) return "wall";
  return "path";
}

const cellColors: Record<CellState, string> = {
  wall: "bg-maze-wall",
  path: "bg-maze-path",
  start: "bg-maze-start",
  exit: "bg-maze-exit",
  player: "bg-maze-player player-glow",
  visited: "bg-maze-visited",
  dfs: "bg-maze-dfs",
  both: "bg-maze-both",
  shortest: "bg-maze-shortest",
  highlight: "bg-maze-shortest cell-glow",
};

export default function MazeGrid(props: MazeGridProps) {
  const rows = props.grid.length;
  const cols = props.grid[0].length;

  return (
    <div
      className="inline-grid gap-[1px] rounded-lg border-2 border-muted p-1"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {props.grid.map((row, r) =>
        row.map((_, c) => {
          const state = getCellState(r, c, props);
          return (
            <div
              key={`${r}-${c}`}
              className={`maze-cell-transition rounded-sm aspect-square ${cellColors[state]} ${
                state === "visited" || state === "shortest" || state === "dfs" || state === "both" ? "path-reveal" : ""
              }`}
              style={{
                width: `clamp(16px, min(70vw / ${cols}, 60vh / ${rows}), 36px)`,
              }}
            />
          );
        })
      )}
    </div>
  );
}
