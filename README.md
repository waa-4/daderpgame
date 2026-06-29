# DaDerpGame v8.1 — 3D Performance & Memory Fix

This update focuses on reducing lag and memory growth in all 3D versions.

## Major fixes

- The 3D ground and boundary walls are created once instead of repeatedly.
- Static geometry is cached and reused.
- Materials are cached instead of creating hundreds of duplicates.
- Dynamic game objects rebuild only when their state changes or at a controlled interval.
- Drawings are merged into one LineSegments object instead of one Three.js object per stroke.
- 3D drawings are capped to the most recent 1,200 strokes, or 500 in low-performance mode.
- Player meshes are reused.
- Removed players now release their chat textures and unique materials.
- Exiting 3D cancels its animation frame, disposes renderer lists, and releases the WebGL context.
- MEAT hunters refresh at a controlled rate rather than forcing a complete world rebuild every frame.
- Pixel ratio is capped lower to reduce GPU memory usage.
- Low-performance mode disables antialiasing and uses a 1× rendering scale.

## Expected result

This should greatly reduce:
- Increasing RAM usage over time
- GPU memory growth
- Stuttering caused by frequent geometry creation
- Lag in drawing-heavy rooms
- Lag when switching repeatedly between 2D and 3D

The existing Settings → Low-performance mode now also affects the 3D renderer.
