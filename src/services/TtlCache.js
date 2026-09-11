class TtlCache {
    constructor(defaultTtlMs, clock = () => Date.now()) {
        if (!Number.isFinite(defaultTtlMs) || defaultTtlMs <= 0) {
            throw new TypeError('defaultTtlMs must be a positive number');
        }

        this.defaultTtlMs = defaultTtlMs;
        this.clock = clock;
        this.entries = new Map();
    }

    get(key) {
        const entry = this.entries.get(key);
        if (!entry) return undefined;

        if (entry.expiresAt <= this.clock()) {
            this.entries.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key, value, ttlMs = this.defaultTtlMs) {
        if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
            throw new TypeError('ttlMs must be a positive number');
        }

        this.entries.set(key, {
            value,
            expiresAt: this.clock() + ttlMs
        });

        return value;
    }

    delete(key) {
        return this.entries.delete(key);
    }

    clear() {
        this.entries.clear();
    }
}

module.exports = TtlCache;
