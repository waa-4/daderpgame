# DaDerpGame v6.1 — Online Stability Fix

This update targets the issue where online rooms stopped updating after roughly 10 seconds.

## Changes

- Runs Supabase Realtime heartbeats through a Web Worker.
- Uses a 15-second heartbeat interval.
- Watches heartbeat timeout/disconnection states.
- Adds a lightweight network ping every four seconds.
- Automatically removes and recreates a frozen channel.
- Rejoins Presence after reconnecting.
- Re-announces the player after reconnecting.
- Reconnects when a mobile tab/app becomes active again.
- Reconnects when the browser regains internet access.
- Reduces movement broadcasts from about 17 to about 11 per second.
- Shows `reconnecting` and returns to `online` when recovery succeeds.

## Install

Replace the repository root files with this version and commit them.
