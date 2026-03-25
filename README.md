# Personal Tracker Deployment

## Recommended split deployment

Deploy:
- frontend on Vercel
- backend on Render

This repo is now prepared for that setup.

## Backend on Render

1. Push this project to GitHub.
2. Create a new Web Service on Render from the repo.
3. Render will detect [`render.yaml`](./render.yaml).
4. Add these environment variables in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
5. Deploy.

Your backend URL will look like:

```text
https://your-backend-name.onrender.com
```

## Frontend on Vercel

This repo includes [`vercel.json`](./vercel.json) and a frontend-only build output.

1. Create a new project on Vercel from the same GitHub repo.
2. Vercel will use:
   - `buildCommand`: `npm run build:frontend`
   - `outputDirectory`: `frontend-dist`
3. Add this environment variable in Vercel:
   - `BACKEND_URL=https://your-backend-name.onrender.com`

Important:
- Set `BACKEND_URL` to the Render origin only.
- Do not add `/api` at the end.

Vercel will proxy `/api/*` to Render automatically, so the frontend keeps using same-origin `/api`.

## Local setup

1. Copy [`server/.env.example`](./server/.env.example) to `server/.env`
2. Fill in:
   - `MONGODB_URI`
   - `JWT_SECRET`
3. Install backend dependencies:

```bash
npm run build
```

4. Start the backend:

```bash
npm start
```

Then open:

```text
http://localhost:5000
```

If you want to test the frontend-only build locally:

```bash
npm run build:frontend
cd frontend-dist && python3 -m http.server 8888
```

## Security

- Do not commit `server/.env`
- Rotate any MongoDB password or JWT secret that has already been shared publicly
