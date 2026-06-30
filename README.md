# DaDerpGame v9.1.1 — 3D Loading Fix

The black game screen was caused by a startup error before the 3D renderer ran.

v9 removed the old drawing buttons from the HTML, but `setupModeUI()` still tried to access them directly. That threw an error and stopped the renderer from starting.

## Fixed

- Optional removed controls are now null-safe.
- The 3D renderer can finish starting.
- Added a visible loading screen.
- The loading screen disappears after the first successful rendered frame.
- A readable failure message appears if Three.js cannot start.
- Existing v9.1 OG Derp and Cube Warfare features remain.

Replace the repository root files with this version.
