# Remix Evo V2 — Chromebook Linux Installation

This package installs Remix Evo V2 as a standalone desktop application in ChromeOS Linux (Crostini) on x86_64 / amd64 Chromebooks.

## Quick Start

1. **Install the package:**
   ```bash
   sudo dpkg -i remix-evo_0.2.0_amd64.deb
   ```

2. **Set your Gemini API key:**
   ```bash
   remix-evo setkey
   ```
   Paste your `GEMINI_API_KEY` (input is hidden).

3. **Launch the application:**
   ```bash
   remix-evo
   ```
   Or launch "Remix Evo" directly from your ChromeOS Launcher / App Drawer.

## Command Reference

| Command | Description |
| --- | --- |
| `remix-evo` or `remix-evo open` | Starts the server if needed and opens the dashboard in your browser with operator authentication |
| `remix-evo start` | Starts the server in the background without launching a browser |
| `remix-evo stop` | Gracefully shuts down the background server, persisting state |
| `remix-evo status` | Reports whether the server is running, PID, port, and key status |
| `remix-evo setkey` | Prompts for a new Gemini API key and restarts the server if active |
| `remix-evo preflight` | Executes the offline/online preflight verification against the Gemini API |
| `remix-evo logs` | Follows the server log file (`~/.local/share/remix-evo/server.log`) |
| `remix-evo config` | Prints current configuration with secrets masked |

## Paths and Storage

- **Settings:** `${XDG_CONFIG_HOME:-~/.config}/remix-evo/env` (mode 0600)
- **Data & Logs:** `${XDG_DATA_HOME:-~/.local/share}/remix-evo/`
- **Application Files:** `/opt/remix-evo/`
- **Binary Symlink:** `/usr/bin/remix-evo` -> `/opt/remix-evo/bin/remix-evo`

## Uninstall

```bash
sudo dpkg -r remix-evo
```
To purge settings and evolution history as well:
```bash
sudo dpkg -P remix-evo
rm -rf ~/.config/remix-evo ~/.local/share/remix-evo
```
