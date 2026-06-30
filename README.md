# DaDerpGame v9.1.2 — Input Startup Fix

## Fixed

- Movement works again.
- The remaining references to removed drawing buttons no longer crash `app.js`.
- The main update loop now starts normally.
- WASD, arrow keys, and mobile joystick movement are restored.
- The 3D canvas now uses a normal arrow cursor instead of a grab/hand cursor.
- Added a safe camera-mode getter for the camera button.

The problem was a second startup error: v9 removed the drawing controls from the page, but the old click-handler setup still tried to assign events to those missing elements.
