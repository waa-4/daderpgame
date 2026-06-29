# DaDerpGame v7.0 — 3D Test Zone

This version is based on the uploaded current repository.

## 3D Test Zone

The new test mode includes:

- A real 3D ground plane
- 3D walls and colored blocks
- Collision against walls and blocks
- Simple 3D cube players
- Online player position synchronization through the existing room system
- Angled follow camera
- Drag-to-rotate camera
- Mouse-wheel and two-finger zoom
- Existing desktop movement and mobile joystick support
- Normal HTML menus and UI layered over the 3D scene

The 3D mode is intentionally isolated. Existing 2D modes are not converted or rewritten.

## Chat redesign

Chat is now opened through a top-left button while playing.

- Compact Roblox-like chat window
- Unread badge while closed
- Close button
- Tap outside to close
- Enter opens chat on desktop
- Escape closes chat
- The same button works over both 2D and 3D games
- Existing censoring, quick chat, muting, and chat bubbles remain

## New files

- `renderer-3d.js`
- `chat-v7.js`

Three.js is loaded from jsDelivr. The 3D test therefore needs internet access, just like Supabase multiplayer.

## Installation

Replace the repository root files with this version.
