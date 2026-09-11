/**
 * Generic in-memory repository implementing the shared five-method contract.
 * It is intended for isolated tests and development without file I/O.
 */
let autoId = 1;

class InMemoryRepository {
    constructor() {
        this._items = [];
    }

    async getAll() {
        return this._items;
    }

    async getById(id) {
        return this._items.find((item) => item.id === id) || null;
    }

    async create(data) {
        const item = { id: String(autoId++), ...data };
        this._items.push(item);
        return item;
    }

    async update(id, data) {
        const index = this._items.findIndex((item) => item.id === id);
        if (index === -1) return null;
        this._items[index] = { ...this._items[index], ...data, id };
        return this._items[index];
    }

    async remove(id) {
        const index = this._items.findIndex((item) => item.id === id);
        if (index === -1) return false;
        this._items.splice(index, 1);
        return true;
    }
}

module.exports = InMemoryRepository;
