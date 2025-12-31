import { ServerMessageType, ClientMessageType } from '@pmu/shared/src/schema';
import type { ServerMessage, WorldStateSnapshot, MsgPlayerIntent } from '@pmu/shared/src/schema';
import { ActionType } from '@pmu/shared/src/enums';
import type { Vec3 } from '@pmu/shared/src/types';

export class NetworkManager {
    private ws: WebSocket | null = null;
    public latestSnapshot: WorldStateSnapshot | null = null;
    public isConnected = false;

    constructor() { }

    public connect(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('Connected to server');
            this.isConnected = true;
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data as string) as ServerMessage;
                this.handleMessage(msg);
            } catch (e) {
                console.error('Failed to parse message', e);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected');
            this.isConnected = false;
        };
    }

    private handleMessage(msg: ServerMessage) {
        if (msg.type === ServerMessageType.STATE_SNAPSHOT) {
            this.latestSnapshot = msg.payload as WorldStateSnapshot;
        }

        // Dispatch generic event for other systems
        window.dispatchEvent(new CustomEvent('server-message', { detail: msg }));

        switch (msg.type) {
            case ServerMessageType.DEBUG_LOG:
                console.log('[SERVER]', msg.payload);
                break;
        }
    }

    public send(msg: any) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    public sendIntent(heroId: string, action: ActionType, targetPos?: Vec3) {
        if (!this.ws || !this.isConnected) return;

        const msg: MsgPlayerIntent = {
            type: ClientMessageType.PLAYER_INTENT,
            payload: {
                heroId,
                action,
                targetPos
            }
        };

        this.ws.send(JSON.stringify(msg));
    }
}
