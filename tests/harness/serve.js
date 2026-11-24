// `npm start`: serve the game at http://localhost:8080 for playing by hand.
//
// To play on an iPad on the same Wi-Fi, start it with HOST=0.0.0.0 and open
// the second address it prints.
const os = require('os');
const { startServer } = require('./server');

const host = process.env.HOST || '127.0.0.1';
startServer({ port: Number(process.env.PORT) || 8080, quiet: false, host }).then((s) => {
  console.log(`The Royal Dragon Rescue is at http://localhost:${s.port}`);
  if (host !== '127.0.0.1') {
    const name = os.hostname().replace(/\.local$/, '');
    console.log(`On an iPad on the same Wi-Fi: http://${name}.local:${s.port}`);
  }
});
