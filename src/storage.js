const COLLECTION_KEY = 'qr-studio-collection';

export function loadCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCollection(collection) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  } catch {}
}

export function addSavedQR(collection, entry) {
  const updated = [{ ...entry, id: Date.now().toString() }, ...collection];
  saveCollection(updated);
  return updated;
}

export function removeSavedQR(collection, id) {
  const updated = collection.filter(e => e.id !== id);
  saveCollection(updated);
  return updated;
}
