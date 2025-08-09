import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

const clients = [];           // [ws1, ws2]
let round = 1;
let choices = [null, null];   // 'R' | 'P' | 'S' | null
let ready = false;

function broadcast(msg) {
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  });
}

function startRound() {
  // reset choices for the round and announce the round
  choices = [null, null];
  broadcast(`Round ${round}`);
}

function resultOf(a, b) {
  // returns 0 draw, 1 if a wins, 2 if b wins
  if (a === b) return 0;
  if ((a === 'R' && b === 'S') || (a === 'S' && b === 'P') || (a === 'P' && b === 'R')) return 1;
  return 2;
}

function handleIfBothChosen() {
  if (choices[0] && choices[1]) {
    const res = resultOf(choices[0], choices[1]);
    const next = round + 1;

    let msg;
    if (res === 0) {
      msg = `Round ${round}: Draw. Round ${next}`;
    } else if (res === 1) {
      msg = `Round ${round}: Player 1 wins. Round ${next}`;
    } else {
      msg = `Round ${round}: Player 2 wins. Round ${next}`;
    }

    broadcast(msg);

    // prepare for next round (no separate "Round N" message needed;
    // the spec's examples include the next round announcement in the result line)
    round = next;
    choices = [null, null];
  }
}

wss.on('connection', (ws) => {
  if (clients.length >= 2) {
    // We only support two clients per the spec. Extra clients get closed.
    ws.close(1013, 'Game already has two players');
    return;
  }

  clients.push(ws);
  const playerNumber = clients.length; // 1 or 2

  ws.send(`You are Player ${playerNumber}. Waiting for another player...`);

  if (clients.length === 2 && !ready) {
    ready = true;
    startRound(); // announce "Round 1"
  }

  ws.on('message', (data) => {
    if (!ready) return;
    const text = String(data).trim().toUpperCase(); // Expect 'R', 'P' or 'S'

    // Only the first message per round counts
    if (choices[playerNumber - 1]) return;
    choices[playerNumber - 1] = text;

    handleIfBothChosen();
  });

  ws.on('close', () => {
    // Reset game if someone leaves
    const idx = clients.indexOf(ws);
    if (idx !== -1) clients.splice(idx, 1);
    ready = false;
    round = 1;
    choices = [null, null];
  });
});

console.log('RPS WebSocket server running on ws://localhost:8080');
