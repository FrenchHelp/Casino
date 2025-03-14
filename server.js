const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
let players = {};
let currentTurn = null;

server.on('connection', (socket) => {
    socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            players[data.playerId] = `Player ${Object.keys(players).length + 1}`;
            if (!currentTurn) currentTurn = data.playerId; // Set initial turn

            broadcast({ type: 'playerList', players });
            broadcast({ type: 'turn', playerId: currentTurn });
        }

        if (data.type === 'roll') {
            broadcast({
                type: 'rollResult',
                playerId: data.playerId,
                dice1: data.dice1,
                dice2: data.dice2
            });

            // Switch turn to next player
            const playerIds = Object.keys(players);
            const currentIndex = playerIds.indexOf(data.playerId);
            currentTurn = playerIds[(currentIndex + 1) % playerIds.length];
            broadcast({ type: 'turn', playerId: currentTurn });
        }
    });

    socket.on('close', () => {
        // Remove player on disconnect
        for (let id in players) {
            if (players[id] === socket) delete players[id];
        }
        broadcast({ type: 'playerList', players });
    });
});

function broadcast(data) {
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

console.log('WebSocket server running on ws://localhost:8080');
