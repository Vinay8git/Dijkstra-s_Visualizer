const ui = {
  rows: document.getElementById('rows'),
  cols: document.getElementById('cols'),
  speed: document.getElementById('speed'),
  speedValue: document.getElementById('speed-value'),
  weightMode: document.getElementById('weightMode'),
  buildGridBtn: document.getElementById('buildGridBtn'),
  clearBtn: document.getElementById('clearBtn'),
  resetBtn: document.getElementById('resetBtn'),
  mazeBtn: document.getElementById('mazeBtn'),
  weightsBtn: document.getElementById('weightsBtn'),
  runBtn: document.getElementById('runBtn'),
  classicGrid: document.getElementById('grid-classic'),
  improvedGrid: document.getElementById('grid-improved'),
  classicMetrics: document.getElementById('metrics-classic'),
  improvedMetrics: document.getElementById('metrics-improved')
};

let state = {
  rows: 20,
  cols: 35,
  source: { r: 10, c: 7 },
  target: { r: 10, c: 27 },
  board: [],
  painting: false,
  paintMode: null,
  lastPaintedKey: null,
  dragging: null,
  running: false
};

function makeNode(r, c) {
  return {
    r,
    c,
    wall: false,
    weight: 1
  };
}

function cloneBoard() {
  return state.board.map((row) => row.map((n) => ({ ...n })));
}

function buildBoard() {
  state.rows = Number(ui.rows.value);
  state.cols = Number(ui.cols.value);
  state.source = { r: Math.floor(state.rows / 2), c: Math.floor(state.cols * 0.2) };
  state.target = { r: Math.floor(state.rows / 2), c: Math.floor(state.cols * 0.8) };
  state.board = Array.from({ length: state.rows }, (_, r) =>
    Array.from({ length: state.cols }, (_, c) => makeNode(r, c))
  );
  renderBoth();
  resetMetrics();
}

function resetMetrics() {
  ui.classicMetrics.innerHTML = 'No run yet.';
  ui.improvedMetrics.innerHTML = 'No run yet.';
}

function nodeKey(r, c) {
  return `${r},${c}`;
}

function isSource(r, c) {
  return state.source.r === r && state.source.c === c;
}

function isTarget(r, c) {
  return state.target.r === r && state.target.c === c;
}

function makeGridElement(gridEl, variant) {
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateRows = `repeat(${state.rows}, 1fr)`;
  gridEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const el = document.createElement('div');
      el.className = 'node';
      el.dataset.r = r;
      el.dataset.c = c;
      el.dataset.variant = variant;
      paintNodeClass(el, state.board[r][c], r, c, new Set(), new Set());
      gridEl.appendChild(el);
    }
  }
}

function paintNodeClass(el, node, r, c, visitedSet, pathSet) {
  el.className = 'node';
  if (node.wall) el.classList.add('wall');
  if (node.weight > 1) el.classList.add('weight');
  if (visitedSet.has(nodeKey(r, c))) el.classList.add('visited');
  if (pathSet.has(nodeKey(r, c))) el.classList.add('path');
  if (isSource(r, c)) el.className = 'node source';
  if (isTarget(r, c)) el.className = 'node target';
}

function renderBoard(gridEl, visitedSet = new Set(), pathSet = new Set()) {
  const nodes = gridEl.querySelectorAll('.node');
  for (const el of nodes) {
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    paintNodeClass(el, state.board[r][c], r, c, visitedSet, pathSet);
  }
}

function renderBoth() {
  makeGridElement(ui.classicGrid, 'classic');
  makeGridElement(ui.improvedGrid, 'improved');
}

function toggleWallOrWeight(r, c, useWeight) {
  if (isSource(r, c) || isTarget(r, c)) return;
  const n = state.board[r][c];
  if (useWeight) {
    n.weight = n.weight > 1 ? 1 : randomWeight();
  } else {
    n.wall = !n.wall;
    if (n.wall) n.weight = 1;
  }
}

function randomWeight() {
  const mode = ui.weightMode.value;
  if (mode === 'light') return 3 + Math.floor(Math.random() * 3);
  if (mode === 'heavy') return 6 + Math.floor(Math.random() * 8);
  return 3 + Math.floor(Math.random() * 8);
}

function clearSearchVisuals() {
  renderBoard(ui.classicGrid);
  renderBoard(ui.improvedGrid);
}

function resetAll() {
  for (const row of state.board) {
    for (const node of row) {
      node.wall = false;
      node.weight = 1;
    }
  }
  clearSearchVisuals();
  resetMetrics();
}

function randomizeWalls() {
  for (const row of state.board) {
    for (const node of row) {
      if (isSource(node.r, node.c) || isTarget(node.r, node.c)) continue;
      node.wall = Math.random() < 0.22;
      if (node.wall) node.weight = 1;
    }
  }
  clearSearchVisuals();
}

function randomizeWeights() {
  for (const row of state.board) {
    for (const node of row) {
      if (isSource(node.r, node.c) || isTarget(node.r, node.c) || node.wall) continue;
      node.weight = Math.random() < 0.35 ? randomWeight() : 1;
    }
  }
  clearSearchVisuals();
}

function neighbors(r, c) {
  const ds = [[1,0],[-1,0],[0,1],[0,-1]];
  const out = [];
  for (const [dr, dc] of ds) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= state.rows || nc >= state.cols) continue;
    const node = state.board[nr][nc];
    if (node.wall) continue;
    out.push(node);
  }
  return out;
}

function popMin(open, dist) {
  let bestIdx = 0;
  for (let i = 1; i < open.length; i++) {
    if (dist.get(open[i]) < dist.get(open[bestIdx])) bestIdx = i;
  }
  return open.splice(bestIdx, 1)[0];
}

function peekMinDistance(open, dist) {
  if (!open.length) return Infinity;
  let best = Infinity;
  for (const key of open) {
    const d = dist.get(key) ?? Infinity;
    if (d < best) best = d;
  }
  return best;
}

function runClassicDijkstra() {
  const start = nodeKey(state.source.r, state.source.c);
  const goal = nodeKey(state.target.r, state.target.c);
  const dist = new Map([[start, 0]]);
  const prev = new Map();
  const open = [start];
  const closed = new Set();
  const visitOrder = [];
  let relaxOps = 0;

  while (open.length) {
    const cur = popMin(open, dist);
    if (closed.has(cur)) continue;
    closed.add(cur);
    visitOrder.push(cur);
    if (cur === goal) break;
    const [r, c] = cur.split(',').map(Number);

    for (const n of neighbors(r, c)) {
      const nk = nodeKey(n.r, n.c);
      const nd = dist.get(cur) + n.weight;
      relaxOps++;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, cur);
        open.push(nk);
      }
    }
  }

  const path = [];
  let walk = goal;
  if (prev.has(goal) || goal === start) {
    while (walk) {
      path.push(walk);
      walk = prev.get(walk);
    }
    path.reverse();
  }

  return {
    visited: visitOrder,
    path,
    visitedCount: closed.size,
    pathCost: dist.get(goal) ?? Infinity,
    relaxOps
  };
}

function runBidirectionalDijkstra() {
  const start = nodeKey(state.source.r, state.source.c);
  const goal = nodeKey(state.target.r, state.target.c);
  if (start === goal) {
    return {
      visited: [start],
      path: [start],
      visitedCount: 1,
      pathCost: 0,
      relaxOps: 0
    };
  }

  const distF = new Map([[start, 0]]);
  const distB = new Map([[goal, 0]]);
  const prevF = new Map();
  const prevB = new Map();
  const openF = [start];
  const openB = [goal];
  const closedF = new Set();
  const closedB = new Set();
  const visitOrder = [];
  let best = Infinity;
  let meet = null;
  let relaxOps = 0;

  while (openF.length && openB.length) {
    const cf = popMin(openF, distF);
    if (!closedF.has(cf)) {
      closedF.add(cf);
      visitOrder.push(cf);
      const [r, c] = cf.split(',').map(Number);
      for (const n of neighbors(r, c)) {
        const nk = nodeKey(n.r, n.c);
        const nd = distF.get(cf) + n.weight;
        relaxOps++;
        if (nd < (distF.get(nk) ?? Infinity)) {
          distF.set(nk, nd);
          prevF.set(nk, cf);
          openF.push(nk);
        }
        if (closedB.has(nk)) {
          const total = nd + (distB.get(nk) ?? Infinity);
          if (total < best) {
            best = total;
            meet = nk;
          }
        }
      }
    }

    const cb = popMin(openB, distB);
    if (!closedB.has(cb)) {
      closedB.add(cb);
      visitOrder.push(cb);
      const [r, c] = cb.split(',').map(Number);
      for (const n of neighbors(r, c)) {
        const nk = nodeKey(n.r, n.c);
        const nd = distB.get(cb) + n.weight;
        relaxOps++;
        if (nd < (distB.get(nk) ?? Infinity)) {
          distB.set(nk, nd);
          prevB.set(nk, cb);
          openB.push(nk);
        }
        if (closedF.has(nk)) {
          const total = nd + (distF.get(nk) ?? Infinity);
          if (total < best) {
            best = total;
            meet = nk;
          }
        }
      }
    }

    const frontierF = peekMinDistance(openF, distF);
    const frontierB = peekMinDistance(openB, distB);
    if (frontierF + frontierB >= best) break;
  }

  const path = [];
  if (meet) {
    let cur = meet;
    const left = [];
    while (cur) {
      left.push(cur);
      cur = prevF.get(cur);
    }
    left.reverse();

    cur = prevB.get(meet);
    const right = [];
    while (cur) {
      right.push(cur);
      cur = prevB.get(cur);
    }

    path.push(...left, ...right);
  }

  return {
    visited: visitOrder,
    path,
    visitedCount: closedF.size + closedB.size,
    pathCost: best,
    relaxOps
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateResult(gridEl, result, metricsEl) {
  const visitedSet = new Set();
  const pathSet = new Set();
  const speed = Number(ui.speed.value);

  for (const key of result.visited) {
    visitedSet.add(key);
    renderBoard(gridEl, visitedSet, pathSet);
    await delay(speed);
  }

  for (const key of result.path) {
    pathSet.add(key);
    renderBoard(gridEl, visitedSet, pathSet);
    await delay(Math.max(5, Math.floor(speed * 0.8)));
  }

  const pathText = Number.isFinite(result.pathCost)
    ? `Path cost: <strong>${result.pathCost}</strong>`
    : 'Path cost: <strong>No route</strong>';

  metricsEl.innerHTML = `
    Nodes expanded: <strong>${result.visitedCount}</strong><br />
    Relaxation operations: <strong>${result.relaxOps}</strong><br />
    ${pathText}<br />
    Path length: <strong>${result.path.length || 0}</strong>
  `;
}

async function runComparison() {
  if (state.running) return;
  state.running = true;
  ui.runBtn.disabled = true;

  clearSearchVisuals();
  const classic = runClassicDijkstra(cloneBoard());
  const improved = runBidirectionalDijkstra(cloneBoard());

  await Promise.all([
    animateResult(ui.classicGrid, classic, ui.classicMetrics),
    animateResult(ui.improvedGrid, improved, ui.improvedMetrics)
  ]);

  state.running = false;
  ui.runBtn.disabled = false;
}

function onPointerDown(event) {
  if (state.running) return;
  const target = event.target.closest('.node');
  if (!target) return;

  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);

  if (isSource(r, c)) {
    state.dragging = 'source';
  } else if (isTarget(r, c)) {
    state.dragging = 'target';
  } else {
    state.painting = true;
    const useWeight = event.shiftKey;
    const node = state.board[r][c];
    state.paintMode = {
      useWeight,
      value: useWeight ? !(node.weight > 1) : !node.wall
    };
    applyPaint(r, c);
    clearSearchVisuals();
  }
}

function onPointerMove(event) {
  const target = event.target.closest('.node');
  if (!target || state.running) return;
  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);

  if (state.dragging) {
    if (state.board[r][c].wall) return;
    if (state.dragging === 'source' && !isTarget(r, c)) {
      state.source = { r, c };
      clearSearchVisuals();
    }
    if (state.dragging === 'target' && !isSource(r, c)) {
      state.target = { r, c };
      clearSearchVisuals();
    }
  } else if (state.painting) {
    applyPaint(r, c);
    clearSearchVisuals();
  }
}

function onPointerUp() {
  state.painting = false;
  state.paintMode = null;
  state.lastPaintedKey = null;
  state.dragging = null;
}

function applyPaint(r, c) {
  if (isSource(r, c) || isTarget(r, c)) return;
  const key = nodeKey(r, c);
  if (state.lastPaintedKey === key) return;
  state.lastPaintedKey = key;

  if (!state.paintMode) {
    toggleWallOrWeight(r, c, false);
    return;
  }

  const n = state.board[r][c];
  if (state.paintMode.useWeight) {
    n.weight = state.paintMode.value ? randomWeight() : 1;
  } else {
    n.wall = state.paintMode.value;
    if (n.wall) n.weight = 1;
  }
}

ui.speed.addEventListener('input', () => {
  ui.speedValue.textContent = ui.speed.value;
});

ui.buildGridBtn.addEventListener('click', buildBoard);
ui.clearBtn.addEventListener('click', () => {
  clearSearchVisuals();
  resetMetrics();
});
ui.resetBtn.addEventListener('click', resetAll);
ui.mazeBtn.addEventListener('click', randomizeWalls);
ui.weightsBtn.addEventListener('click', randomizeWeights);
ui.runBtn.addEventListener('click', runComparison);

document.addEventListener('pointerdown', onPointerDown);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerup', onPointerUp);

document.addEventListener('pointerleave', onPointerUp);

buildBoard();
