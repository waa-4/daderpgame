# DaDerpGame v6.5 — MEAT & Platformer

## Hotbar removed

The always-visible tool hotbar has been removed. Harmless tools remain available through the in-game Menu under Tools.

## MEAT

- Huge maze map with plenty of room
- Ten yellow triangle hunters
- Three hunter behaviors:
  - direct path hunters
  - route-blocking hunters
  - large step hunters with cooldowns
- Survival timer and Derpiness rewards
- Carry and place wooden crates
- Stronger rusted-metal barricades
- Barricade durability and triangle damage
- Teleport-to-player button
- Online host synchronization

## Platformer Chaos

- Side-view movement
- Gravity and jumping
- Large scrolling level
- Permanent starter platforms
- Toggleable platform-building mode
- Shared user-created platforms
- Drawing remains available and synchronized

## Drawing recovery

When joining a room, the client requests a drawing snapshot from the host. Recent room drawings are also cached locally as a fallback.

## Stronger censor

Expanded blocked terms and tighter fuzzy matching catch additional evasions, including spellings such as `dicc`, number swaps, repeated letters, and punctuation tricks.

## Modular game file

MEAT and Platformer logic live in:

- `games-v65.js`

This keeps the main app smaller and gives future games a dedicated extension point.

Replace all repository root files with this version.
