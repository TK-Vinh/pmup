import Fastify from 'fastify';
import { WebSocketServer } from 'ws';
import { WorldState } from './WorldState';
import { GameLoop } from './GameLoop';
import { Faction } from '@pmu/shared/src/enums';
import { prisma } from "./db";

const fastify = Fastify({ logger: true });

// Core Systems
const world = new WorldState();
let wss: WebSocketServer;

const loop = new GameLoop((dt) => {
  world.update(dt);

  if (wss) {
    const snapshot = world.getSnapshot();
    const msg = JSON.stringify({
      type: 'STATE_SNAPSHOT',
      payload: snapshot
    });

    // Broadcast snapshot
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(msg);
      }
    });
  }
});

// Setup
fastify.get("/players", async () => {
  return prisma.player.findMany({
    include: { heroes: true },
  });
});

const start = async () => {
  try {
    // Spawn a dummy hero
    world.createHero('Test Hero', Faction.PLAYER, { x: 10, y: 10, z: 0 });

    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://0.0.0.0:3000');

    // Attach WebSocket to the existing HTTP server
    wss = new WebSocketServer({ server: fastify.server });

    wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.type === 'PLAYER_INTENT') {
            console.log("Intent received:", msg);
          }

          if (msg.type === 'BUILDING_INSPECT') {
            const details = world.getBuildingDetails(msg.payload.buildingId);
            if (details) {
              ws.send(JSON.stringify({
                type: 'BUILDING_DETAILS',
                payload: details
              }));
            }
          }

          if (msg.type === 'HIRE_HERO') {
            const hero = world.hireHeroAtBuilding(msg.payload.buildingId);
            if (hero) {
              console.log(`Hero hired: ${hero.name}`);
            }
          }

          if (msg.type === 'BUILDING_MOVE') {
            const success = world.moveBuilding(msg.payload.buildingId, msg.payload.position);
            if (success) {
              console.log(`Building ${msg.payload.buildingId} moved to`, msg.payload.position);
            }
          }

        } catch (e) {
          console.error('Failed to parse message', e);
        }
      });
    });

    loop.start();

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
