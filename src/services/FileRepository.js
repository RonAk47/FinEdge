const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const writeQueues = new Map();

class FileRepository {
  constructor(filePath) {
    if (!filePath) {
      throw new TypeError('A file path is required');
    }

    this.filePath = path.resolve(filePath);
  }

  async getAll() {
    return this.readItems();
  }

  async getById(id) {
    const items = await this.readItems();
    return items.find((item) => item.id === id) || null;
  }

  async create(data) {
    return this.enqueueWrite(async () => {
      const items = await this.readItems();
      const item = { ...data, id: crypto.randomUUID() };
      items.push(item);
      await this.writeItems(items);
      return item;
    });
  }

  async update(id, data) {
    return this.enqueueWrite(async () => {
      const items = await this.readItems();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return null;

      const item = { ...items[index], ...data, id };
      items[index] = item;
      await this.writeItems(items);
      return item;
    });
  }

  async remove(id) {
    return this.enqueueWrite(async () => {
      const items = await this.readItems();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return false;

      items.splice(index, 1);
      await this.writeItems(items);
      return true;
    });
  }

  async readItems() {
    try {
      const contents = await fs.readFile(this.filePath, 'utf8');
      if (!contents.trim()) return [];

      const items = JSON.parse(contents);
      if (!Array.isArray(items)) {
        throw new TypeError(`Repository file must contain an array: ${this.filePath}`);
      }
      return items;
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async writeItems(items) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;

    try {
      await fs.writeFile(temporaryPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
      await fs.rename(temporaryPath, this.filePath);
    } finally {
      await fs.rm(temporaryPath, { force: true });
    }
  }

  enqueueWrite(operation) {
    const previousWrite = writeQueues.get(this.filePath) || Promise.resolve();
    const write = previousWrite.then(operation);
    const queuedWrite = write.catch(() => {});
    writeQueues.set(this.filePath, queuedWrite);
    queuedWrite.finally(() => {
      if (writeQueues.get(this.filePath) === queuedWrite) {
        writeQueues.delete(this.filePath);
      }
    });
    return write;
  }
}

module.exports = FileRepository;
