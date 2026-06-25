# DaDerpGame v4.2 — Player Center Fix

This fixes the issue where only the camera moved while the visible cube stayed behind.

## Cause
The local player's network hello message replaced the live player object with a copied object. Movement updated the live object, while the renderer kept drawing the old copy.

## Fixes
- The local player is never replaced by a network copy.
- The renderer always draws the live local player object.
- The local player stays exactly in the center while the map moves.
- Mobile joystick, WASD, arrows, customization, friends, chat, drawing, and online rooms remain included.

Replace all root files with this version.
