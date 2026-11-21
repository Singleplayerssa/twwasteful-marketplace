// Local development runner. Vercel imports the shared Express app from client/index.js.
await import('dotenv/config');

const [{ default: app }, { checkDatabase, pool }] = await Promise.all([
  import('../../client/backend/app.js'),
  import('../../client/backend/db.js')
]);

const port = Number(process.env.PORT || 4000);

try {
  await checkDatabase();
  const server = app.listen(port, () => {
    console.log(`T’wwasteful API running at http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error('Backend gagal terhubung ke PostgreSQL:', error.message);
  process.exit(1);
}
