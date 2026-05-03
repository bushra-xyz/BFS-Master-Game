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
  // Start with all walls
  const grid: MazeGrid = Array.from({ length: rows }, () => Array(cols).fill(1) as CellType[]);

  // Randomize start and exit on opposite corners/edges to vary BFS path length each maze
  const corners: Position[] = [
    { row: 1, col: 1 },
    { row: 1, col: cols - 2 },
    { row: rows - 2, col: 1 },
    { row: rows - 2, col: cols - 2 },
  ];
  const startIdx = Math.floor(Math.random() * 4);
  const start: Position = corners[startIdx];
  // Pick the diagonally opposite corner, then jitter along its edges so the
  // optimal BFS distance differs between mazes.
  const opposite = corners[3 - startIdx];
  const jitterRow = 1 + Math.floor(Math.random() * (rows - 2));
  const jitterCol = 1 + Math.floor(Math.random() * (cols - 2));
  const exit: Position =
    Math.random() < 0.5
      ? { row: opposite.row, col: jitterCol }
      : { row: jitterRow, col: opposite.col };

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

  // Add many extra passages to create loops, branches and misleading routes.
  // Higher density + lower adjacency requirement => more decision points where
  // multiple plausible routes diverge, so the BFS shortest path isn't obvious.
  const extraPassages = Math.floor(rows * cols * 0.22);
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
      // Allow opening with just 1 neighbor sometimes (creates dead-end branches
      // that look promising), and always open with 2+ (creates loops).
      if (adjacentPaths >= 2 || (adjacentPaths === 1 && Math.random() < 0.5)) {
        grid[r][c] = 0;
      }
    }
  }

  // Second pass: punch a few random "shortcut walls" near the diagonal
  // between start and exit to create tempting alternate routes of similar length.
  const shortcuts = Math.floor((rows + cols) * 0.6);
  for (let i = 0; i < shortcuts; i++) {
    const r = 2 + Math.floor(Math.random() * (rows - 4));
    const c = 2 + Math.floor(Math.random() * (cols - 4));
    if (grid[r][c] === 1) {
      let adjacentPaths = 0;
      for (const d of DIRECTIONS) {
        if (grid[r + d.row][c + d.col] === 0) adjacentPaths++;
      }
      if (adjacentPaths >= 2) grid[r][c] = 0;
    }
  }

  // Ensure exit is open
  grid[exit.row][exit.col] = 0;

  // Ensure path to exit exists by checking BFS, if not open a corridor
  if (!bfs(grid, start, exit)) {
    let r = exit.row, c = exit.col;
    while (r > start.row) { grid[r][c] = 0; r--; }
    while (c > start.col) { grid[r][c] = 0; c--; }
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
