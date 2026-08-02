# DaDerpGame v0.6

## Modes

Move
- WASD movement
- Right-drag camera
- Left-drag physics blocks you own
- Physics blocks stay snapped horizontally to the selected grid

Place
- Default Block or Physics Block
- Color
- Size
- Y rotation
- Grid size
- Physics shape: Box, Sphere, Cylinder
- Bounciness
- Weight
- Sliding
- Collision for owner / other players

Scale
- Click one of your blocks
- Scale uniformly or on X, Y, or Z
- Choose 0.25, 0.5, or 1.0 scale step
- Scale range is limited to keep blocks usable

## Notes

Physics is intentionally lightweight in this version. Bounciness affects player/block contact now. Weight and sliding are stored and synchronized so they can be used for fuller physics behavior in the next update.
