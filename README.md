# DaDerpGame v7.1 — Input & 3D Camera Fix

## Fixed in every game

Right-clicking while moving could cause a movement key to remain held because the browser context menu interrupted the normal key-release event.

The game now:

- Prevents the browser context menu during gameplay
- Clears held keyboard and joystick input on right-click
- Clears input when the window loses focus
- Clears input when the tab becomes hidden
- Clears input after pointer cancellation

## 3D improvements

- The cube now rotates with the camera so its front remains aligned with the camera view.
- Movement is properly camera-relative.
- W/forward moves in the direction the camera is facing.
- A/D move left and right relative to the camera.
- Camera rotation immediately changes the movement direction.
- Right-click no longer begins camera dragging or opens a context menu.

Replace the repository root files with this version.
