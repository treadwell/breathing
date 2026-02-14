# Breathing Timer

A lightweight browser app for paced breathing practice with optional voice, tone, and visual guidance.

## Features

- Configurable inhale/exhale length (seconds)
- Configurable total session length (minutes)
- On-screen `inhale` / `exhale` prompts
- Optional tone cues
- Optional spoken voice cues (Web Speech API)
- Optional animated breathing circle
- Volume control for tones

## Run Locally

No build step is required.

Option 1 (direct file open):
1. Open `index.html` in a modern browser.
2. Set your session values.
3. Click **Start Timer**.
4. Click **Stop Timer** to end early.

Option 2 (local static server):
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.

## Project Structure

- `index.html` - App shell and script/style includes
- `index.js` - UI, timer scheduling, voice/tone/circle behavior
- `index.css` - Circle animation and basic styling

## Browser Notes

- jQuery is loaded from the CDN in `index.html`.
- Voice output depends on browser support for `window.speechSynthesis`.
- Audio playback may require user interaction depending on browser autoplay policy.

## GitHub Backup Setup

If you have not created a remote repo yet, create one on GitHub first (for example `breathing-timer`), then run:

```bash
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:<your-username>/breathing-timer.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/<your-username>/breathing-timer.git
```

## License

MIT. See `LICENSE`.
