// super light IndexedDB via localForage-like pattern, but with plain IDB
const DB = 'gbb_images_v1', STORE = 'fabric';
function withDB(fn){ return new Promise((res, rej) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => fn(req.result).then(res, rej);
  req.onerror = () => rej(req.error);
});}

export async function saveFabricImage(id, file){
  return withDB(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
  }));
}
export async function getFabricImageURL(id){
  return withDB(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const get = tx.objectStore(STORE).get(id);
    get.onsuccess = () => {
      const blob = get.result; res(blob ? URL.createObjectURL(blob) : null);
    };
    get.onerror = () => rej(get.error);
  }));
}
export async function deleteFabricImage(id){
  return withDB(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
  }));
}
