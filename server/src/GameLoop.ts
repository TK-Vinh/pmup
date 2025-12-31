export class GameLoop {
    private intervalId: NodeJS.Timeout | null = null;
    private lastTime: number = 0;
    private readonly TICK_RATE = 20;
    private readonly TICK_MS = 1000 / this.TICK_RATE;

    constructor(private onTick: (dt: number) => void) { }

    public start() {
        if (this.intervalId) return;

        this.lastTime = Date.now();
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const dt = (now - this.lastTime) / 1000; // Seconds
            this.lastTime = now;

            this.onTick(dt);
        }, this.TICK_MS);

        console.log(`GameLoop started at ${this.TICK_RATE} TPS`);
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('GameLoop stopped');
        }
    }
}
