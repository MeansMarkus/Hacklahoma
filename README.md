# Life as a Mountain

**Technology that helps you reach new heights.**

A goal visualizer that turns your objectives into a mountain map: each task is a ledge, the summit is your goal. Gamified growth that keeps you motivated to climb.

## Run it

Open `index.html` in a modern browser (Chrome, Firefox, Edge). No build step or server required.

Or serve the folder locally:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

## How it works

1. **Set your summit** — Your big goal (e.g. “Ship my hackathon project”).
2. **Add ledges** — Each task is a ledge on the mountain. Add the steps that get you to the top.
3. **Climb** — Check off tasks to light up ledges and move your climber up the mountain.
4. **Reach new heights** — Watch your altitude meter rise and hit the summit when every task is done.

Progress is saved in your browser (localStorage) so you can come back and keep climbing.

## Mobile / installable app

- **PWA:** The app includes a web manifest and mobile-friendly styles. Serve over HTTPS and use **Add to Home Screen** on your phone to install it like an app.
- **Native app (same code):** Use **Capacitor** to wrap this folder and build for iOS and Android without rewriting. See **[MOBILE.md](./MOBILE.md)** for stack recommendations and a Capacitor quick start.

## Hackathon theme

Built for **“technology that helps you reach new heights”**: the app uses the metaphor of climbing a mountain to make progress visible and motivating. Goals become a summit; tasks become ledges. Gamification (altitude, climber position, summit celebration) makes growth tangible and rewarding.
