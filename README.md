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

`VITE_AI_SUGGESTION_ENABLED` is a display fallback only. Settings first calls the
backend AI status and usage APIs, then falls back to this value if the backend is
unavailable.

The frontend never receives or stores `OPENAI_API_KEY`. React calls only the
FastAPI backend, and the backend decides whether to use AI or rule-based
fallback.

## Run

```powershell
cd C:\ytheory\WebFront
npm install
npm run dev
```

Tests:

```powershell
npm run test:run
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

Recommended production structure:

```text
https://yangtheory.site      -> frontend static build
https://yangtheory.site/api  -> backend reverse proxy
```

Port-based `:5173` and `:8001` URLs are development/demo only. Build the frontend
and serve `dist` through nginx with React Router fallback. An example config is
available at `deploy/nginx.yangtheory.site.conf`.

Production deploy outline:

```powershell
npm ci
npm run test:run
npm run build
```

Copy `dist` to the nginx root, for example `/var/www/adhd-todo-web`, and proxy
`/api/` to the FastAPI process on `127.0.0.1:8000`. The nginx config must keep
React Router fallback:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

After nginx is serving the site, apply HTTPS:

```bash
sudo certbot --nginx -d yangtheory.site -d www.yangtheory.site
```

## API Flow

1. Register or login.
   New registration asks for a nickname, email, and password. The nickname is
   shown in the top-right profile area.
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

Protected pages are wrapped by `ProtectedRoute`. Logged-out direct access to
`/today`, `/settings`, `/routines`, `/actions/:actionId`, and session suggestion
URLs redirects to `/login`. After login, the app can return to the originally
requested path.

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

## Routines

`/routines` uses authenticated backend data:

```http
GET /api/v1/routines
POST /api/v1/routines
PATCH /api/v1/routines/{routineId}
DELETE /api/v1/routines/{routineId}
POST /api/v1/routines/{routineId}/start-action
```

Routines are user-owned safety net actions. They are small candidates to return
to when suggestions stall, not checklist pressure. Production mode shows only
real API data; mock routines are visible only with `VITE_USE_MOCKS=true`.

Active routines can start an Action directly with `이 루틴으로 시작`. The backend
returns the created Action, the app stores it as `activeAction`, and the UI moves
to `/actions/{actionId}`. Inactive routines keep their start button disabled.

## State Handling

Core flow state lives in `src/store/appStore.ts`:

- `currentSession`
- `currentSuggestions`
- `activeAction`
- `smallerSuggestions`

The store persists to `localStorage` so page refreshes keep the current flow when
possible. Session suggestions can also be restored from the URL.

## Account Profile

The top-right profile reads the authenticated user from `users/me`.

Display name priority:

1. `user.nickname`
2. email prefix before `@`
3. `사용자`

Existing backend users may have `nickname: null`; in that case the UI safely
falls back to the email prefix. Settings shows nickname/email from the same
authenticated user object. Settings can update nickname and refreshes the topbar
immediately.

Settings also supports password change:

- current password
- new password
- confirm new password

The backend validates the current password and applies the same password policy
used at registration. Account deletion remains a planned follow-up item.

## Error States

Shared API messages are handled in `src/api/errors.ts`.

- 401: login expired
- 403: no permission
- 429: too many requests
- 422: check input
- 500: server error

Core pages include loading, empty, and error states so the UI does not pretend
mock data is real API data.

Production mock policy:

- `VITE_USE_MOCKS=false` is the default.
- Production builds do not use mock fallback to hide API failures.
- If the API is unavailable, pages show loading, empty, or error states.
- Development samples are only visible when `VITE_USE_MOCKS=true`.

## AI Status

The frontend does not call OpenAI. It reads backend-only AI operation state:

```http
GET /api/v1/ai/status
GET /api/v1/ai/usage/me
```

Settings displays:

- AI Suggestion: off / enabled
- Model
- JSON schema readiness
- Rule-based fallback
- Recent 24h actual OpenAI calls and estimated usage cost
- Recent 30d estimated usage cost
- Cache hits and fallback count
- Fallback signals by safe error code

`OPENAI_API_KEY` must never be added to the frontend `.env`. The backend owns AI
calls, rate limits, cache, budget guardrails, and fallback behavior.
If the backend AI status API fails, Settings shows only frontend config hints and
hides usage metrics so the screen is not mistaken for real backend state.

## Backend TODO

The backend now supports `GET /api/v1/actions/{action_id}` and includes
`action` in feedback `do` responses.

Current next items:

- AI prompt quality tuning after repeated real use.
- Mobile polish beyond the first responsive pass.
- Calendar import as a one-time candidate ingestion flow.
- refresh token httpOnly cookie migration.

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

CI runs from `.github/workflows/frontend-ci.yml`:

- Node 20
- `npm ci`
- `npm run test:run`
- `npm run build`

## Manual Verification

Verified flow:

1. Register or login.
   For a new account, enter a nickname and confirm it appears in the top-right
   profile.
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
15. Open `/routines`, create a routine, pause/activate it, start an Action from it, delete it, and refresh.
16. Open `/settings`, edit nickname, and confirm the top-right profile updates.
17. Change password in Settings, log out, and log back in with the new password.

Latest manual/API verification result:

- Frontend `/today`: 200
- Backend `/api/v1/health`: ok
- Brain Dump -> session suggestions -> feedback do -> action detail: passed
- make_smaller nested data path: passed

## Repeated Flow Verification

Use this checklist before a production-facing deploy:

1. Register or login.
2. Create three Brain Dumps in a row and confirm sessions do not mix.
3. Refresh `/sessions/{sessionId}/suggestions` and confirm suggestions restore.
4. Click `작게` more than once and confirm nested smaller suggestions do not duplicate.
5. Select a suggestion and confirm navigation to `/actions/{actionId}`.
6. Refresh `/actions/{actionId}` and confirm the Action restores.
7. Complete or record an abort and confirm buttons no longer allow another state change.
8. Open `/history` and confirm recent flow appears without pressure language.
9. Check Settings and confirm backend AI status/usage loads without exposing any API key.
10. Stop the API server and confirm the app shows ErrorState or EmptyState, not mock data.
11. Check a 390px mobile viewport for `/today`, suggestions, active action, and settings.
12. Stop the API server and confirm production mode shows no mock routine cards.
