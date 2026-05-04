# Decide Web Frontend

React + TypeScript + Vite frontend for the ADHD Todo API.

Decide is not a checklist-first todo app. The core flow is:

```text
Brain Dump -> 2-5 Suggestions -> Feedback do -> Action -> Complete or Abort
```

The UI keeps the "no pressure" principle: aborted actions are shown as adjustment
signals, not as failure labels.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- axios

## Environment

Create `.env` from `.env.example`.

```text
VITE_API_BASE_URL=http://yangtheory.site:8001/api/v1
VITE_USE_MOCKS=false
VITE_AI_SUGGESTION_ENABLED=false
VITE_AI_MODEL=gpt-4.1-mini
```

`VITE_USE_MOCKS=false` is the default service mode. Mock data is only shown when
`VITE_USE_MOCKS=true`, so API failures or empty API responses are not hidden by
sample cards.

`VITE_AI_SUGGESTION_ENABLED` is display-only for the web UI. The backend decides
whether AI generation is enabled; the frontend shows the current expectation in
Settings.

The frontend never receives or stores `OPENAI_API_KEY`. React calls only the
FastAPI backend, and the backend decides whether to use AI or rule-based
fallback.

## Run

```powershell
cd C:\ytheory\WebFront
npm install
npm run dev
```

Production-style preview:

```powershell
$env:VITE_API_BASE_URL='http://yangtheory.site:8001/api/v1'
$env:VITE_USE_MOCKS='false'
npm run build
npm run preview -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://yangtheory.site:5173/today
```

## API Flow

1. Register or login.
2. The app stores JWT access and refresh tokens in `localStorage`.
3. On refresh, `users/me` restores the current user.
4. If an API call returns 401, axios attempts `/auth/refresh`.
5. If refresh fails, the app logs out.
6. Enter a Brain Dump on `/today` or `/brain-dumps`.
7. On success, the app stores the session and navigates to
   `/sessions/{sessionId}/suggestions`.
8. Suggestions are loaded by session URL, so refresh works.
9. Clicking `선택` sends feedback `reaction=do`.
10. The backend creates the Action and returns `action_id`.
11. The backend also returns the `action` object, which the app stores directly.
12. The app moves to `/actions/{actionId}` and allows complete or abort.
13. Direct `/actions/{actionId}` entry restores the Action with
    `GET /actions/{actionId}`.
14. `/history` reads `/me/history` and shows recent flow and reaction signals.

## Routes

- `/login`
- `/register`
- `/today`
- `/brain-dumps`
- `/suggestions`
- `/sessions/:sessionId/suggestions`
- `/actions/active`
- `/actions/:actionId`
- `/history`
- `/routines`
- `/settings`

## State Handling

Core flow state lives in `src/store/appStore.ts`:

- `currentSession`
- `currentSuggestions`
- `activeAction`
- `smallerSuggestions`

The store persists to `localStorage` so page refreshes keep the current flow when
possible. Session suggestions can also be restored from the URL.

## Error States

Shared API messages are handled in `src/api/errors.ts`.

- 401: login expired
- 403: no permission
- 429: too many requests
- 422: check input
- 500: server error

Core pages include loading, empty, and error states so the UI does not pretend
mock data is real API data.

## Backend TODO

The backend now supports `GET /api/v1/actions/{action_id}` and includes
`action` in feedback `do` responses.

Current next items:

- AI prompt quality tuning after real OpenAI usage is enabled.
- Mobile polish beyond the first responsive pass.
- Calendar import as a one-time candidate ingestion flow.

## Deployment Check

Current local/domain preview:

```text
Frontend: http://yangtheory.site:5173
Backend:  http://yangtheory.site:8001
```

Check backend health:

```powershell
curl http://yangtheory.site:8001/api/v1/health
```

Check frontend:

```text
http://yangtheory.site:5173/today
```

Make sure the frontend is built with:

```powershell
$env:VITE_API_BASE_URL='http://yangtheory.site:8001/api/v1'
$env:VITE_USE_MOCKS='false'
npm run build
```

## Manual Verification

Verified flow:

1. Register or login.
2. Go to `/today`.
3. Enter a Brain Dump.
4. Confirm navigation to `/sessions/{sessionId}/suggestions`.
5. Confirm the Original Brain Dump is loaded from
   `GET /sessions/{sessionId}/brain-dumps`.
6. Confirm 2-5 suggestions are loaded from
   `GET /sessions/{sessionId}/suggestions`.
7. Click `선택`.
8. Confirm feedback `reaction=do` creates an Action and returns the `action`
   object.
9. Confirm navigation to `/actions/{actionId}`.
10. Refresh `/actions/{actionId}` and confirm it restores through
    `GET /actions/{actionId}`.
11. Complete or abort the Action and confirm the status changes to `완료됨` or
    `중단 기록됨`.
12. Open `/history` and confirm the recent flow appears.
13. Return to the session suggestions and click `작게`.
14. Confirm smaller suggestions are nested under the parent suggestion and do
    not duplicate.

Latest manual/API verification result:

- Frontend `/today`: 200
- Backend `/api/v1/health`: ok
- Brain Dump -> session suggestions -> feedback do -> action detail: passed
- make_smaller nested data path: passed
