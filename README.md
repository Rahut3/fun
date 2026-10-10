# Lecture Lab

Turn pasted lecture notes or text-based PDFs into flashcards and multiple-choice study sets. Flip cards, mark concepts understood, try 2–3 question variations, read answer explanations, and export your set as JSON.

## Run

Requires Node.js 20.19+ or 22.13+ (Node 24 is supported).

```sh
npm ci
npm run dev
```

Vite serves the frontend on port 5173 and proxies API requests to the server on port 3001. For a production build, run `npm run build` then `npm start` (port 3001). Run `npm test` for generator validation tests.

## Generation modes

**Local practice** works immediately without credentials. It extracts at least four distinct explanatory definitions from your notes, generates flashcards, and varies recall questions. It does not generate deep application questions. Use the example notes to try it.

**AI understanding** generates recall and application questions, plus misconception questions when three variations are selected. Configure `STUDY_API_KEY` on the server with an OpenAI API key; optionally set `STUDY_MODEL` (default `gpt-4.1-mini`). Never place the key in frontend code. AI usage may incur provider charges. To load a local `.env`, copy `.env.example` to `.env`, fill in the key, then run `node --env-file=.env server/index.js` alongside `npx vite --host 0.0.0.0`, or alongside a production build. `.env` is ignored by Git.

Notes are sent to OpenAI only in AI mode. Uploaded PDFs are processed in server memory, not stored as files. Study progress exists in browser memory until a refresh; export a set to keep the generated content. PDF extraction supports selectable text, up to 10 MB and the first 100 pages. Scanned PDFs need external OCR. Input is limited to 60,000 characters.

This is a single-user development app without authentication or persistent storage. Use behind access controls before exposing an AI-enabled server publicly. Check generated content against your lecture notes; schema and quote validation cannot guarantee that an AI answer is accurate.
