export class SeededRNG {
    private seed: number;

    constructor(seedInput: string | number) {
        if (typeof seedInput === 'string') {
            this.seed = this.hashString(seedInput);
        } else {
            this.seed = seedInput;
        }
    }

    private hashString(str: string): number {
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * Returns a float between 0 and 1
     */
    public nextFloat(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Returns an integer between min and max (inclusive)
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }

    public pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length - 1)];
    }
}
