# Farmer Portrait Builder

A browser-based companion tool for building portrait packs compatible with the [Farmer Portraits](https://www.nexusmods.com/stardewvalley/mods/11398) and [Farmer 2.0 ESWF](https://www.nexusmods.com/stardewvalley/mods/21226) Stardew Valley mods.

Upload your emotion portraits, drag them into scenario slots, and export a ready-to-install zip. Everything runs locally in your browser — portraits are stored on your device and are never uploaded to a server.

## Features

- **Drag-and-drop assignment** — upload default emotion portraits, then drag them onto scenario slots
- **Per-slot uploads** — override individual slots with custom PNGs
- **Multi-file drop** — drag several correctly named PNGs onto a scenario card (e.g. all Spring/Sun portraits at once); files are matched to slots by filename
- **Copy custom portraits** — duplicate a custom upload to one or more scenario slots without re-uploading; seasonal weather slots include quick-select presets for similar weathers (same season or all seasons) and matching indoor slots
- **Scenario groups** — base portraits, seasons & weather, festivals, and optional advanced groups (mining, pajamas, Weather Wonders, Danger Weather, and more)
- **Configurable options** — extended emotions, indoor seasonal variants, and optional 64×64 resize on export
- **Bulk actions** — fill all visible slots from defaults, clear all assignments
- **Local persistence** — your work is saved in the browser between sessions
- **Save / load project** — download or restore a `.fpb.zip` backup to move in-progress work between browsers or devices
- **One-click export** — downloads a zip with portraits, updated ESWF `assets/setup/*.json` files, and an `INSTALL.txt` guide

## Using the app

1. Open the hosted app or run it locally (see [Development](#development)).
2. Enter your **Character Name** (must match your in-game farmer folder name, e.g. `Player 1`).
3. Upload portraits in the **Default Portraits** palette (neutral, happy, sad, angry, blush, and optionally extended emotions).
4. Drag palette portraits into scenario slots, or use **Upload** on individual slots for custom images. Use **Copy** on a custom slot to duplicate it to one or more other slots.
5. Use **Fill visible** to apply your default emotions to every slot in the currently enabled scenario groups.
6. Click **Export for game** to download `{CharacterName}-portraits.zip` for Stardew Valley.

Use **Save project** to back up your in-progress layout (palette, settings, assignments) as a `{CharacterName}-project.fpb.zip` file. **Load project** restores that backup and replaces current browser data. **Export for game** is separate — it builds the installable mod portrait pack.

Portrait files should be **64×64 PNG** for best results. Enable **Resize to 64×64 on export** in Settings if your source images are a different size.

### Settings

| Option                    | Description                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| More Player Emotions      | Enables scared, surprised, disgust, and awkward portrait slots                      |
| Indoor seasonal variants  | Shows `_indoors` filename variants for seasonal scenarios                           |
| Resize to 64×64 on export | Scales images to 64×64 when building the zip                                        |
| Advanced scenario groups  | Toggle optional groups such as Mining, Pajamas, Weather Wonders, and Danger Weather |

## Installing an exported pack

1. Extract the zip into your **(CP) Farmer 2.0 ESWF** mod folder. The `assets` folder in the zip should merge with the mod's existing `assets` folder. This also updates portrait setup JSON under `assets/setup/`.
2. Confirm your farmer folder name matches your in-game save (e.g. `assets/Player 1/`).
3. Restart SMAPI (fully close and relaunch the game).
4. Open **Generic Mod Config Menu** for **(CP) Farmer 2.0 ESWF** and enable the portrait options that match the scenarios you configured.

Missing portrait files do not cause errors — the mod falls back to the next highest-priority portrait. Only the files you assigned are included in the export.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- npm

### Setup

```bash
git clone <repository-url>
cd farmer-portrait-builder
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. `predev` automatically generates the scenario manifest, syncs ESWF setup JSON, and fetches the NF Pixels font.

### Scripts

| Command                       | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `npm run dev`                 | Start the Vite dev server                               |
| `npm run build`               | Type-check and build for production                     |
| `npm run preview`             | Preview the production build locally                    |
| `npm run lint`                | Run ESLint                                              |
| `npm run lint:fix`            | Run ESLint with auto-fix                                |
| `npm run format`              | Format with Prettier                                    |
| `npm run format:check`        | Check Prettier formatting                               |
| `npm run generate-manifest`   | Regenerate `src/data/scenarioManifest.json`             |
| `npm run sync-eswf-setup`     | Copy ESWF portrait setup JSON into `public/eswf-setup/` |
| `npm run fetch:fonts`         | Download the NF Pixels font into `public/fonts/`        |
| `npm run verify-export-paths` | Validate export path resolution against the manifest    |
| `npm run verify-project-roundtrip` | Validate `.fpb.zip` project file parse/export format |

### Regenerating the scenario manifest

`npm run generate-manifest` rebuilds `src/data/scenarioManifest.json` from canonical scenario definitions in `scripts/canonical-manifest.mjs`. Those definitions are aligned with the bundled ESWF setup JSON and the season eligibility maps in `src/data/weatherWondersSeasons.json` and `src/data/dangerWeatherSeasons.json`.

The generator does not scan mod portrait folders on disk, so manifest output is stable in CI and does not depend on a local `Player 1` example pack.

### ESWF setup JSON

Exports bundle eight updated portrait setup files (`portrait_setup.json`, `portrait_cw.json`, and related files) so the mod's Content Patcher rules match the folder layout used by this tool.

`npm run sync-eswf-setup` copies them from a local ESWF mod folder into `public/eswf-setup/`:

```cmd
../Farmer 2.0 ESWF NPC Reaction Overhaul/assets/setup/
```

If that folder is missing, the committed copies in `public/eswf-setup/` are kept.

## Credits

- **[Farmer 2.0 ESWF](https://www.nexusmods.com/stardewvalley/mods/21226)** by Salty — the portrait and outfit system this tool targets.
- **[Fern](https://www.nexusmods.com/stardewvalley/mods/39037)** by Dexnis — the corrected portrait folder structure and ESWF setup JSON fixes that this tool's layout is based on (including Weather Wonders path fixes).
- **[Farmer Portraits](https://www.nexusmods.com/stardewvalley/mods/11398)** — portrait framework used by Farmer 2.0 ESWF.

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Zustand](https://zustand.docs.pmnd.rs/) for state
- [dnd-kit](https://dndkit.com/) for drag and drop
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) for local storage
- [JSZip](https://stuzilla.github.io/jszip/) + [file-saver](https://github.com/eligrey/FileSaver.js) for export

## Making portraits

Want to create your own farmer portraits? Check out the [Stardew Valley Character Creator](https://jazzybee.itch.io/sdvcharactercreator) by Jazzy Bee.

## License

Farmer Portrait Builder is released under the [MIT License](LICENSE).

The **NF Pixels** typeface (used in the UI) is © Steve Gigou and licensed under the [SIL Open Font License 1.1](public/fonts/nf-pixels/LICENSE.txt). Source: [NF-Pixels on GitHub](https://github.com/sgigou/NF-Pixels).

## Disclaimers

- **Stardew Valley** is © 2016–2026 ConcernedApe LLC. This project is not affiliated with, endorsed by, or sponsored by ConcernedApe or any rights holder of Stardew Valley. No game assets are included or redistributed.
- This software is provided **"as is"**, without warranty of any kind. You are responsible for verifying exported portrait packs work correctly in your game setup.
- This project was developed using AI coding assistance.
