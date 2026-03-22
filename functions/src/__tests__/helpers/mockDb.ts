/**
 * Typed mock Firestore builder.
 * Usage: const db = buildMockDb({ questions: { "q1": { title: "...", createdBy: "u1" } } });
 */

type CollectionData = Record<string, Record<string, unknown>>;
type DbData = Record<string, CollectionData>;

function makeDocRef(
  data: Record<string, unknown> | undefined,
  id: string,
  db: any,
  collectionName: string,
) {
  let stored = data ? { ...data } : undefined;

  const docRef: any = {
    id,
    get: jest.fn().mockResolvedValue({
      exists: stored !== undefined,
      id,
      data: () => (stored ? { ...stored } : undefined),
    }),
    set: jest.fn().mockImplementation((newData: Record<string, unknown>) => {
      stored = { ...newData };
      // update the parent snapshot
      if (!db._data[collectionName]) db._data[collectionName] = {};
      db._data[collectionName][id] = stored;
      // refresh get mock
      docRef.get.mockResolvedValue({
        exists: true,
        id,
        data: () => ({ ...stored }),
      });
      return Promise.resolve();
    }),
    update: jest.fn().mockImplementation((updates: Record<string, unknown>) => {
      stored = { ...stored, ...updates };
      if (!db._data[collectionName]) db._data[collectionName] = {};
      db._data[collectionName][id] = stored;
      docRef.get.mockResolvedValue({
        exists: true,
        id,
        data: () => ({ ...stored }),
      });
      return Promise.resolve();
    }),
    delete: jest.fn().mockImplementation(() => {
      stored = undefined;
      if (db._data[collectionName]) delete db._data[collectionName][id];
      docRef.get.mockResolvedValue({
        exists: false,
        id,
        data: () => undefined,
      });
      return Promise.resolve();
    }),
    collection: jest.fn().mockImplementation((subName: string) => {
      if (!db._data[`${collectionName}/${id}/${subName}`]) {
        db._data[`${collectionName}/${id}/${subName}`] = {};
      }
      return makeCollectionRef(db, `${collectionName}/${id}/${subName}`);
    }),
  };
  return docRef;
}

function makeCollectionRef(db: any, collectionName: string) {
  const collData: CollectionData = db._data[collectionName] || {};

  const collRef: any = {
    doc: jest.fn().mockImplementation((id?: string) => {
      const docId = id || `mock-id-${Date.now()}-${Math.random()}`;
      const docData = collData[docId];
      return makeDocRef(docData, docId, db, collectionName);
    }),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockImplementation(() => {
      const docs = Object.entries(db._data[collectionName] || {}).map(
        ([docId, docData]) => {
          const d = docData as Record<string, unknown>;
          return {
            id: docId,
            data: () => ({ ...d }),
            ref: makeDocRef(d, docId, db, collectionName),
          };
        },
      );
      return Promise.resolve({ docs, empty: docs.length === 0 });
    }),
    add: jest.fn().mockImplementation((data: Record<string, unknown>) => {
      const newId = `mock-id-${Date.now()}-${Math.random()}`;
      db._data[collectionName][newId] = data;
      return Promise.resolve({ id: newId });
    }),
  };
  return collRef;
}

export function buildMockDb(initialData: DbData = {}) {
  const db: any = {
    _data: JSON.parse(JSON.stringify(initialData)),
  };

  db.collection = jest.fn().mockImplementation((name: string) => {
    if (!db._data[name]) db._data[name] = {};
    return makeCollectionRef(db, name);
  });

  db.batch = jest.fn().mockReturnValue({
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  });

  return db;
}
