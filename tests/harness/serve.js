// `npm start`: serve the game at http://localhost:8080 for playing by hand.
const { startServer } = require('./server');
startServer({ port: Number(process.env.PORT) || 8080, quiet: false }).then((s) => {
  console.log(`The Royal Dragon Rescue is at ${s.url.replace('127.0.0.1', 'localhost')}`);
});
