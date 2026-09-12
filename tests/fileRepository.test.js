const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const FileRepository = require('../src/services/FileRepository');

describe('FileRepository', () => {
  let directory;
  let filePath;
  let repository;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'finedge-repository-'));
    filePath = path.join(directory, 'items.json');
    repository = new FileRepository(filePath);
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('returns an empty array when the repository file is missing', async () => {
    await expect(repository.getAll()).resolves.toEqual([]);
  });

  it('returns an empty array for an empty repository file', async () => {
    await fs.writeFile(filePath, '', 'utf8');

    await expect(repository.getAll()).resolves.toEqual([]);
  });

  it('creates records with unique string IDs and persists them', async () => {
    const first = await repository.create({ name: 'First' });
    const second = await repository.create({ name: 'Second' });
    const reloadedRepository = new FileRepository(filePath);

    expect(typeof first.id).toBe('string');
    expect(first.id).not.toBe(second.id);
    await expect(reloadedRepository.getAll()).resolves.toEqual([first, second]);
  });

  it('gets records by ID and returns null when missing', async () => {
    const created = await repository.create({ name: 'First' });

    await expect(repository.getById(created.id)).resolves.toEqual(created);
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('updates records while preserving their ID', async () => {
    const created = await repository.create({ name: 'First', active: true });

    const updated = await repository.update(created.id, {
      id: 'different-id',
      name: 'Updated',
    });

    expect(updated).toEqual({
      id: created.id,
      name: 'Updated',
      active: true,
    });
    await expect(repository.update('missing', { name: 'No-op' })).resolves.toBeNull();
  });

  it('removes records and returns false when missing', async () => {
    const created = await repository.create({ name: 'First' });

    await expect(repository.remove(created.id)).resolves.toBe(true);
    await expect(repository.getAll()).resolves.toEqual([]);
    await expect(repository.remove(created.id)).resolves.toBe(false);
  });

  it('serializes concurrent writes without losing records', async () => {
    const created = await Promise.all(
      Array.from({ length: 10 }, (_, index) => repository.create({ index }))
    );
    const items = await repository.getAll();

    expect(items).toHaveLength(10);
    expect(new Set(created.map((item) => item.id)).size).toBe(10);
    expect(items.map((item) => item.index)).toEqual(
      expect.arrayContaining(Array.from({ length: 10 }, (_, index) => index))
    );
  });

  it('rejects repository files that do not contain an array', async () => {
    await fs.writeFile(filePath, JSON.stringify({ invalid: true }), 'utf8');

    await expect(repository.getAll()).rejects.toThrow(
      `Repository file must contain an array: ${filePath}`
    );
  });
});
