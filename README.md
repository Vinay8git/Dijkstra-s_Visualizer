# Dijkstra's Visualizer (Classic vs Bidirectional vs Clustered Frontier)

An interactive website to compare:

- **Classic Dijkstra (single-source shortest path)**
- **Bidirectional Dijkstra**
- **Clustered Frontier Dijkstra (paper-inspired variant)**

The UI is **cell/matrix based** so users can draw obstacles, add weighted nodes (traffic), move source/destination, and control animation speed.

## Features

- Side-by-side simulation on the same grid for 3 algorithms
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
- **Run Comparison**: animate all algorithms simultaneously
- **Clear Search**: clear visited/path coloring only
- **Reset All**: remove walls and weights

## Notes

The clustered-frontier variant is an educational implementation inspired by the high-level ideas from the 2025 “Breaking the Sorting Barrier” work (batch frontier processing + partial ordering). It is **not** a full reproduction of the paper’s full theoretical construction/proof.
