const TtlCache = require('../src/services/TtlCache');

describe('TtlCache', () => {
    let now;
    let cache;

    beforeEach(() => {
        now = 1000;
        cache = new TtlCache(100, () => now);
    });

    it('returns a cached value before it expires', () => {
        cache.set('summary', { balance: 10 });
        now = 1099;

        expect(cache.get('summary')).toEqual({ balance: 10 });
    });

    it('removes and misses an expired value', () => {
        cache.set('summary', { balance: 10 });
        now = 1100;

        expect(cache.get('summary')).toBeUndefined();
        expect(cache.entries.has('summary')).toBe(false);
    });

    it('supports a per-entry TTL', () => {
        cache.set('summary', 'short-lived', 10);
        now = 1010;

        expect(cache.get('summary')).toBeUndefined();
    });

    it('overwrites an existing value', () => {
        cache.set('summary', 'old');
        cache.set('summary', 'new');

        expect(cache.get('summary')).toBe('new');
    });

    it('supports delete and clear', () => {
        cache.set('one', 1);
        cache.set('two', 2);

        expect(cache.delete('one')).toBe(true);
        expect(cache.get('one')).toBeUndefined();

        cache.clear();
        expect(cache.get('two')).toBeUndefined();
    });

    it('rejects invalid TTL values', () => {
        expect(() => new TtlCache(0)).toThrow(TypeError);
        expect(() => cache.set('summary', 'value', 0)).toThrow(TypeError);
    });
});
