# Dijkstra's Visualizer (Classic vs Improved)

An interactive website to compare:

- **Classic Dijkstra (single-source shortest path)**
- **Improved Dijkstra (bidirectional search variant)**

The UI is **cell/matrix based** so users can draw obstacles, add weighted nodes (traffic), move source/destination, and control animation speed.

## Features

- Side-by-side simulation on the same grid
- Source and destination drag-and-drop
- Wall drawing with mouse
- Weighted cells with `Shift + Click`
- Adjustable rows/columns
- Speed slider (ms per step)
- Random wall generation
- Random traffic/weight generation with presets:
  - Light traffic
  - Balanced traffic
  - Heavy traffic
- Metrics for each algorithm:
  - Nodes expanded
  - Relaxation operations
  - Path cost
  - Path length

## How to run

Open `index.html` in any modern browser.

No build step is required.

## Controls quick guide

- **Click** empty cells: toggle wall
- **Shift + Click** empty cells: toggle weighted node
- **Drag** source or destination to move
- **Run Comparison**: animate both algorithms simultaneously
- **Clear Search**: clear visited/path coloring only
- **Reset All**: remove walls and weights

## Notes

The “improved” variant implemented here is **bidirectional Dijkstra**, a practical speedup strategy that can reduce explored nodes on many maps while preserving shortest-path optimality for non-negative weights.
