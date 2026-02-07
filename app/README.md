# Life as a Mountain — React + Tailwind

Same app as the vanilla version, built with **Vite**, **React**, and **Tailwind CSS** for easier UI iteration and structure.

## Mobile app (Android / iOS)

This folder is set up for **Capacitor**. To build and run as a native app:

1. `npm install`
2. `npx cap add android` (and optionally `npx cap add ios` on a Mac)
3. `npm run cap:sync` — builds the web app and syncs to the native project
4. `npm run cap:android` (or `cap:ios`) — opens Android Studio / Xcode; run on device or emulator

See **[MOBILE-SETUP.md](./MOBILE-SETUP.md)** for full step-by-step and store submission notes.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output is in `dist/`. Deploy that folder anywhere (Vercel, Netlify, etc.).

## Project structure

- `src/App.jsx` — Root state (goal, tasks), localStorage, progress/altitude
- `src/components/` — Sky, Header, Mountain, GoalCard, TaskList, MotivationCard, SummitCelebration
- `src/utils/mountain.js` — Mountain path, ledges, climber position (same math as vanilla)
- `src/constants.js` — Storage key, motivation copy
- `tailwind.config.js` — Theme colors (sky, gold, accent, success) and fonts (Outfit, Playfair Display)

The vanilla demo (parent folder) and this React app use the same `life-as-a-mountain` localStorage key, so you can switch between them and keep your data.
