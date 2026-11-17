# Civic Sahayak 🏛️

AI-assisted civic help for Indian citizens, built for a hackathon. Works in English, हिन्दी and Hinglish.

## What it does

1. **Report an issue**: type a problem in plain words. It detects the category (roads, water, electricity, sanitation, safety, health, education), rates urgency, picks the right department, and drafts a ready-to-send complaint letter with links to CPGRAMS and UP IGRS Jansunwai.
2. **Scheme finder**: enter age, income, occupation and a few details to see which central government schemes you may qualify for, with official links.
3. **Ask Sahayak (AI)**: a chat assistant powered by Claude. If the API is not set up, it falls back to a built-in FAQ (ration card, Aadhaar, certificates, complaints, emergency numbers).

The classifier and scheme matcher run fully in the browser, so the demo works offline with no API key.

## Run locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
cd civic-sahayak
npx serve .
```

## Enable the AI chat

The chat tab calls `/api/chat` (`api/chat.js`), a Vercel serverless function that talks to the Anthropic API.

1. Get an API key from the Anthropic Console.
2. In Vercel, add an environment variable `ANTHROPIC_API_KEY`.
3. Redeploy. The key stays on the server and is never exposed to the browser.

## Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Set **Root Directory** to `civic-sahayak`.
3. Framework preset: **Other**. No build command needed.
4. Add `ANTHROPIC_API_KEY` as above.

## Files

| File | Purpose |
|---|---|
| `index.html` | UI with three tabs |
| `app.js` | Complaint classifier, scheme matcher, chat client |
| `api/chat.js` | Serverless endpoint that calls Claude |

## Limitations

- Classification is keyword-based and can be wrong, so the user is asked to review it.
- Scheme rules are indicative only. Always confirm eligibility on the official website.
- Letters are drafts; nothing is submitted to any government system.
