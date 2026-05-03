export type CellType = 0 | 1; // 0 = path, 1 = wall
export type Position = { row: number; col: number };
export type MazeGrid = CellType[][];

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function generateMaze(rows: number, cols: number): { grid: MazeGrid; start: Position; exit: Position } {
  const minimumInterestingPath = rows + cols;
  for (let attempt = 0; attempt < 8; attempt++) {
    const maze = buildMaze(rows, cols);
    const solution = bfs(maze.grid, maze.start, maze.exit);
    if (!solution || solution.path.length - 1 > minimumInterestingPath || attempt === 7) {
      return maze;
    }
  }

  return buildMaze(rows, cols);
}

function buildMaze(rows: number, cols: number): { grid: MazeGrid; start: Position; exit: Position } {
  // Start with all walls
  const grid: MazeGrid = Array.from({ length: rows }, () => Array(cols).fill(1) as CellType[]);

  // Keep start and exit fixed at opposite corners; only the carved maze layout
  // changes between generations.
  const start: Position = { row: 1, col: 1 };
  const exit: Position = { row: rows - 2, col: cols - 2 };

  // Recursive backtracker to carve maze
  function carve(r: number, c: number) {
    grid[r][c] = 0;
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
    for (const d of dirs) {
      const nr = r + d.row * 2;
      const nc = c + d.col * 2;
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && grid[nr][nc] === 1) {
        grid[r + d.row][c + d.col] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(start.row, start.col);

  // Add only a few extra passages. Too many open walls create a near-straight
  // Manhattan route, which makes the BFS shortest path always 36 on a 21x21 grid.
  const extraPassages = Math.floor(rows * cols * 0.025);
  for (let i = 0; i < extraPassages; i++) {
    const r = 1 + Math.floor(Math.random() * (rows - 2));
    const c = 1 + Math.floor(Math.random() * (cols - 2));
    if (grid[r][c] === 1) {
      let adjacentPaths = 0;
      for (const d of DIRECTIONS) {
        const nr = r + d.row;
        const nc = c + d.col;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && grid[nr][nc] === 0) {
          adjacentPaths++;
        }
      }
      if (adjacentPaths >= 2) {
        grid[r][c] = 0;
      }
    }
  }

  // Ensure exit is open
  grid[exit.row][exit.col] = 0;

  // Ensure path to exit exists by checking BFS, if not carve a corridor between them
  if (!bfs(grid, start, exit)) {
    let r = start.row, c = start.col;
    while (r !== exit.row) { grid[r][c] = 0; r += r < exit.row ? 1 : -1; }
    while (c !== exit.col) { grid[r][c] = 0; c += c < exit.col ? 1 : -1; }
    grid[exit.row][exit.col] = 0;
  }

  return { grid, start, exit };
}

export function bfs(
  grid: MazeGrid,
  start: Position,
  end: Position
): { visited: Position[]; path: Position[] } | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (Position | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue: Position[] = [start];
  visited[start.row][start.col] = true;
  const visitOrder: Position[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitOrder.push(current);

    if (current.row === end.row && current.col === end.col) {
      // Reconstruct path
      const path: Position[] = [];
      let cur: Position | null = current;
      while (cur) {
        path.unshift(cur);
        cur = parent[cur.row][cur.col];
      }
      return { visited: visitOrder, path };
    }

    for (const d of DIRECTIONS) {
      const nr = current.row + d.row;
      const nc = current.col + d.col;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return null;
}

export function dfs(
  grid: MazeGrid,
  start: Position,
  end: Position
): { visited: Position[]; path: Position[] } | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (Position | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const stack: Position[] = [start];
  visited[start.row][start.col] = true;
  const visitOrder: Position[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    visitOrder.push(current);

    if (current.row === end.row && current.col === end.col) {
      const path: Position[] = [];
      let cur: Position | null = current;
      while (cur) {
        path.unshift(cur);
        cur = parent[cur.row][cur.col];
      }
      return { visited: visitOrder, path };
    }

    for (const d of DIRECTIONS) {
      const nr = current.row + d.row;
      const nc = current.col + d.col;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        stack.push({ row: nr, col: nc });
      }
    }
  }

  return null;
}

export type BfsStep = {
  dequeued: Position;
  added: Position[];
  skipped: Position[];
  queueAfter: Position[];
  found: boolean;
};

export function bfsSteps(
  grid: MazeGrid,
  start: Position,
  end: Position
): { steps: BfsStep[]; path: Position[] } | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (Position | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue: Position[] = [start];
  visited[start.row][start.col] = true;
  const steps: BfsStep[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const added: Position[] = [];
    const skipped: Position[] = [];
    let found = current.row === end.row && current.col === end.col;

    if (!found) {
      for (const d of DIRECTIONS) {
        const nr = current.row + d.row;
        const nc = current.col + d.col;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] === 1 || visited[nr][nc]) {
          if (grid[nr][nc] === 0) skipped.push({ row: nr, col: nc });
          continue;
        }
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        const np = { row: nr, col: nc };
        queue.push(np);
        added.push(np);
        if (nr === end.row && nc === end.col) found = true;
      }
    }

    steps.push({
      dequeued: current,
      added,
      skipped,
      queueAfter: [...queue],
      found,
    });

    if (found) {
      // Reconstruct path from end
      const path: Position[] = [];
      let cur: Position | null = end;
      // If end was just added in this step, parent is set; if it was the dequeued, parent chain handles it
      if (!visited[end.row][end.col]) return null;
      while (cur) {
        path.unshift(cur);
        cur = parent[cur.row][cur.col];
      }
      return { steps, path };
    }
  }

  return null;
}

export function calculateScore(playerSteps: number, bfsSteps: number, timeSeconds: number): number {
  const efficiency = Math.max(0, (bfsSteps / Math.max(playerSteps, 1)) * 100);
  const timeBonus = Math.max(0, 100 - timeSeconds * 2);
  return Math.round(efficiency * 0.7 + timeBonus * 0.3);
}
