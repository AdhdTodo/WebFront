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
```

`VITE_USE_MOCKS=false` is the default service mode. Mock data is only shown when
`VITE_USE_MOCKS=true`, so API failures or empty API responses are not hidden by
sample cards.

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
11. The app moves to `/actions/{actionId}` and allows complete or abort.
12. `/history` reads `/me/history` and shows recent flow and reaction signals.

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

The backend currently returns `action_id` from feedback `do`. The frontend is
prepared for a future `FeedbackResponse.action` object and a future
`GET /api/v1/actions/{action_id}` endpoint.

Until that endpoint exists, direct `/actions/:actionId` entry is restored from
`/me/history` when possible. If the action is not in recent history, the page
shows an empty state instead of fake data.

## Manual Verification

1. Register or login.
2. Go to `/today`.
3. Enter a Brain Dump.
4. Confirm navigation to `/sessions/{sessionId}/suggestions`.
5. Confirm 2-5 suggestions are shown.
6. Click `선택`.
7. Confirm feedback `do` creates an Action and moves to `/actions/{actionId}`.
8. Complete or abort the Action.
9. Open `/history`.
10. Confirm the recent flow and reaction signals are shown.
11. Return to suggestions and click `작게`.
12. Confirm smaller suggestions appear without duplicate cards.
