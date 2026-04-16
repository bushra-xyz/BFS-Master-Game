import { MazeGrid as MazeGridType, Position } from "@/lib/maze";

type CellState = "wall" | "path" | "start" | "exit" | "player" | "visited" | "shortest";

interface MazeGridProps {
  grid: MazeGridType;
  start: Position;
  exit: Position;
  player: Position;
  visitedCells: Set<string>;
  shortestPath: Set<string>;
}

function key(p: Position) {
  return `${p.row},${p.col}`;
}

function getCellState(
  row: number, col: number,
  props: MazeGridProps
): CellState {
  const k = `${row},${col}`;
  if (row === props.player.row && col === props.player.col) return "player";
  if (props.shortestPath.has(k)) return "shortest";
  if (row === props.start.row && col === props.start.col) return "start";
  if (row === props.exit.row && col === props.exit.col) return "exit";
  if (props.visitedCells.has(k)) return "visited";
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
  shortest: "bg-maze-shortest",
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
                state === "visited" || state === "shortest" ? "path-reveal" : ""
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
