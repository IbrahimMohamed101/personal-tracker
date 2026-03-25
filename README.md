# Personal Tracker Deployment

## Recommended deployment

Deploy the whole project to Render as a single Node web service.

Why:
- The frontend is static, but the project also needs the Express API.
- Netlify alone only hosts the frontend, so `/api/*` returns `404` unless you deploy the backend separately.
- Render can run the Express app and serve `index.html` plus `assets/` from the same origin.

## Render setup

1. Push this project to GitHub.
2. Create a new Web Service on Render from the repo.
3. Render will detect [`render.yaml`](./render.yaml).
4. Add these environment variables in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
5. Deploy.

The app will be available from the Render service URL, and the frontend will use the same origin for `/api`.

## Local setup

1. Copy [`server/.env.example`](./server/.env.example) to `server/.env`
2. Fill in:
   - `MONGODB_URI`
   - `JWT_SECRET`
3. Install backend dependencies:

```bash
npm run build
```

4. Start the app:

```bash
npm start
```

Then open `http://localhost:5000`.

## Security

- Do not commit `server/.env`
- Rotate any MongoDB password or JWT secret that has already been shared publicly
