# DaDerpGame v9.5 Alpha 2

## New-player experience

- First-visit welcome screen explains the game in three steps.
- Persistent How to Play buttons are available in the hub and in-game.
- Every game card now says what the player actually does.
- Every card shows its most important controls.
- The room screen explains how room codes work.
- The crowded in-game top bar now uses a compact Menu.
- A mode-specific control hint appears at the bottom.

## Turning synchronization

- Player facing direction is sent with movement updates.
- Remote player cubes smoothly rotate instead of always facing the local camera.
- Rotation interpolation handles the -π/π wrap without spinning the long way around.

## Face and cosmetic synchronization

- The five-slot avatar menu is now the single source of truth.
- Saving a face or hat updates the active avatar slot.
- Changes synchronize immediately to the room.
- Face and hat data also travels in normal movement updates as a backup.
- All existing avatar-menu face IDs now have 3D equivalents.
- All existing avatar-menu hat IDs now have 3D equivalents.
- Remote colors also update through avatar sync.

## Existing Alpha 1 systems remain

- MEAT movement/collision repair
- Physics Things
- Create/Playtest
- You Can Stop Now prototype
- Surface painting
