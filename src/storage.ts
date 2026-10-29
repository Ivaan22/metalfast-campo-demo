import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { initialDocuments, type DemoDocument } from './domain';

export interface StoredAttachment {
  id: string;
  name: string;
  type: string;
  blob: Blob;
}

interface DemoDB extends DBSchema {
  documents: { key: string; value: DemoDocument };
  attachments: { key: string; value: StoredAttachment };
  meta: { key: string; value: { key: string; value: boolean } };
}

let connection: Promise<IDBPDatabase<DemoDB>> | undefined;

function database() {
  if (!connection) {
    connection = openDB<DemoDB>('metalfast-campo-demo', 1, {
      upgrade(db) {
        db.createObjectStore('documents', { keyPath: 'id' });
        db.createObjectStore('attachments', { keyPath: 'id' });
        db.createObjectStore('meta', { keyPath: 'key' });
      },
      terminated() { connection = undefined; },
      blocking(_current, _blocked, event) {
        (event.target as IDBDatabase | null)?.close();
        connection = undefined;
      },
    }).catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

function freshDocuments(): DemoDocument[] {
  return initialDocuments.map((document) => ({ ...document }));
}

export async function loadDocuments(): Promise<DemoDocument[]> {
  const db = await database();
  const tx = db.transaction(['documents', 'meta'], 'readwrite');
  const seeded = await tx.objectStore('meta').get('seeded');
  if (!seeded?.value) {
    for (const document of freshDocuments()) await tx.objectStore('documents').put(document);
    await tx.objectStore('meta').put({ key: 'seeded', value: true });
  }
  const documents = await tx.objectStore('documents').getAll();
  await tx.done;
  return documents;
}

export async function saveDocuments(documents: DemoDocument[]): Promise<void> {
  const db = await database();
  const tx = db.transaction(['documents', 'meta'], 'readwrite');
  await tx.objectStore('documents').clear();
  for (const document of documents) await tx.objectStore('documents').put(document);
  await tx.objectStore('meta').put({ key: 'seeded', value: true });
  await tx.done;
}

export async function resetDemo(): Promise<DemoDocument[]> {
  const db = await database();
  const documents = freshDocuments();
  const tx = db.transaction(['documents', 'attachments', 'meta'], 'readwrite');
  await tx.objectStore('documents').clear();
  await tx.objectStore('attachments').clear();
  for (const document of documents) await tx.objectStore('documents').put(document);
  await tx.objectStore('meta').put({ key: 'seeded', value: true });
  await tx.done;
  return documents;
}

export async function saveAttachment(file: File): Promise<string> {
  const db = await database();
  const id = crypto.randomUUID();
  // Store a Blob plus its metadata so the original content survives a refresh.
  const attachment: StoredAttachment = {
    id, name: file.name, type: file.type || 'application/octet-stream',
    blob: file.slice(0, file.size, file.type || 'application/octet-stream'),
  };
  await db.put('attachments', attachment);
  return id;
}

export async function getAttachment(id: string): Promise<StoredAttachment | undefined> {
  const db = await database();
  return db.get('attachments', id);
}
