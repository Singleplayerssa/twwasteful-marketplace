// Vercel detects this default-exported Express app and deploys it as a Node.js Function.
// Vite's static frontend is built into /public and served by Vercel's CDN.
import app from './backend/app.js';

export default app;
