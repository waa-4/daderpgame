# DaDerpGame v6 — Modular Tools & Settings

This focused update is built from the uploaded current GitHub repository.

## New modular scripts

- `systems.js` — stronger censoring and saved personal settings
- `tools.js` — harmless tools, tool hotbar, player controls, and host controls
- `app.js` — keeps the shared game and mode systems

Future tools can be added to `tools.js` without rewriting the core game. If it becomes large, it can be split into a `tools/` folder later.

## Harmless Tools

- Confetti Cannon
- Bubble Wand
- Dice
- Coin Flipper

Tools can be enabled or disabled for your personal hotbar.

## Settings menu

- Particles on/off
- Confetti on/off
- Bubbles on/off
- Player names
- Chat bubbles
- Low-performance mode
- Adjustable mobile joystick size

## Player and host controls

Players can locally mute another player.

Room hosts can:
- Kick players from the current room
- Ban players for the current room session
- Clear drawings
- Toggle room tools

These are friendly-room browser controls. They are not server-authoritative account bans.

## Stronger censoring

The new censor checks:
- Standard blocked words
- Number substitutions and leetspeak
- Punctuation inserted between letters
- Repeated letters
- Similar spellings
- Consonant patterns

Examples such as `f.u.c.k`, `f4ck`, and `f44ck` are masked as complete words.

## Install

Replace the root project files with everything in this folder. The required scripts are:

- `index.html`
- `style.css`
- `config.js`
- `systems.js`
- `app.js`
- `tools.js`
- `README.md`
