# Decide Web Frontend

React + TypeScript + Vite frontend for the ADHD Todo API.

This app is a mock-first interface for the core flow:

```text
Brain Dump -> Suggestions -> Feedback -> Action
```

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- axios

## Run

```powershell
cd C:\ytheory\WebFront
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/today
```

## Environment

Copy `.env.example` to `.env` when connecting to the backend:

```text
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1
```

The UI works with mock data before API integration.

## Routes

- `/login`
- `/register`
- `/today`
- `/brain-dumps`
- `/suggestions`
- `/actions/active`
- `/history`
- `/routines`
- `/settings`
