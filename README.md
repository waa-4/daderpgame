# DaDerpGame v9.1.3 — Game Restoration

v9.1 switched the renderer to a new 3D core, but only OG Derp and Cube Warfare had new 3D rendering code. The old game logic was still running invisibly behind the hidden 2D canvas.

## Restored in 3D

- Survive the Evil Boi maps and walls
- Cube Warfare arena, bases, projectiles, and visible weapon effects
- MEAT maze, triangles, crates, and metal barricades
- Platformer platforms and placed platforms
- Create Mode objects
- Machine Game parts and wires
- OG Derp speed zone, fling pads, and toys

## Interactions restored

- Create Mode can place objects by clicking the 3D ground.
- Machine Game can place, wire, delete, and interact through 3D ground clicks.
- Platformer build mode can place platforms through the 3D world.
- OG Derp speed zones now actually increase movement speed.
- Existing MEAT, Evil Boi, Warfare, and round logic remains active.

## Free Drawing

3D drawing remains intentionally deferred to v9.5. The mode now shows a visible drawing area and notice instead of appearing completely empty.
