import type { MsgBuildingDetails, MsgHireHero } from '@pmu/shared/src/schema';
import { ClientMessageType } from '@pmu/shared/src/schema';
import { NetworkManager } from './NetworkManager';

export class UIManager {
    private container: HTMLDivElement;
    private modal: HTMLDivElement | null = null;
    private network: NetworkManager;

    constructor(network: NetworkManager) {
        this.network = network;
        this.container = document.createElement('div');
        this.container.id = 'ui-layer';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Let clicks pass through to canvas
        document.body.appendChild(this.container);

        // Listen for building details
        window.addEventListener('server-message', (e: any) => {
            const msg = e.detail;
            if (msg.type === 'BUILDING_DETAILS') {
                this.showBuildingModal(msg.payload);
            }
        });
    }

    public showBuildingModal(details: MsgBuildingDetails['payload']) {
        if (this.modal) this.modal.remove();

        this.modal = document.createElement('div');
        this.modal.style.position = 'absolute';
        this.modal.style.top = '50%';
        this.modal.style.left = '50%';
        this.modal.style.transform = 'translate(-50%, -50%)';
        this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.modal.style.color = 'white';
        this.modal.style.padding = '20px';
        this.modal.style.borderRadius = '8px';
        this.modal.style.pointerEvents = 'auto';
        this.modal.style.minWidth = '300px';

        // Stop propagation of events to prevent them from reaching Phaser
        // We ONLY stop start events (down/click) so interactions don't pass through.
        // We MUST allow 'up' events to pass through so if a drag starts outside and ends here, Phaser knows it ended.
        const stopProp = (e: Event) => e.stopPropagation();
        this.modal.addEventListener('pointerdown', stopProp);
        this.modal.addEventListener('mousedown', stopProp);
        this.modal.addEventListener('click', stopProp);
        this.modal.addEventListener('touchstart', stopProp);

        const title = document.createElement('h2');
        title.innerText = `${details.name} (Lvl ${details.level})`;
        this.modal.appendChild(title);

        const type = document.createElement('div');
        type.innerText = `Type: ${details.type}`;
        this.modal.appendChild(type);

        const slots = document.createElement('div');
        slots.innerText = `Slots: ${details.workers.length} / ${details.slots}`;
        this.modal.appendChild(slots);

        // Workers List
        const workerHeader = document.createElement('h3');
        workerHeader.innerText = 'Workers';
        this.modal.appendChild(workerHeader);

        const workerList = document.createElement('ul');
        details.workers.forEach(w => {
            const li = document.createElement('li');
            li.innerText = `${w.name} (IQ: ${w.stats.iq}, STR: ${w.stats.strength})`;
            workerList.appendChild(li);
        });
        if (details.workers.length === 0) {
            const li = document.createElement('li');
            li.innerText = 'No workers assigned.';
            workerList.appendChild(li);
        }
        this.modal.appendChild(workerList);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginTop = '20px';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '10px';

        // ENTER Button
        const enterBtn = document.createElement('button');
        enterBtn.innerText = 'Close';
        enterBtn.onclick = () => this.closeModal();
        actionsDiv.appendChild(enterBtn);

        // HIRE Button (if slots available)
        if (details.workers.length < details.slots) {
            const hireBtn = document.createElement('button');
            hireBtn.innerText = 'Hire Hero';
            hireBtn.onclick = () => {
                this.network.send({
                    type: ClientMessageType.HIRE_HERO,
                    payload: { buildingId: details.buildingId }
                } as MsgHireHero);
            };
            actionsDiv.appendChild(hireBtn);
        }

        // MOVE Button
        const moveBtn = document.createElement('button');
        moveBtn.innerText = 'Move';
        moveBtn.onclick = () => {
            this.closeModal();
            // Dispatch event for GameScene to handle
            window.dispatchEvent(new CustomEvent('enter-placement-mode', {
                detail: { buildingId: details.buildingId }
            }));
        };
        actionsDiv.appendChild(moveBtn);

        this.modal.appendChild(actionsDiv);
        this.container.appendChild(this.modal);
    }

    public closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}
