const GUEST_COLLECTION_KEY = "orgi_guest_collection"; 

export function getGuestCollection() { 
  if (typeof window === "undefined") return []; 
  try { 
    const stored = localStorage.getItem(GUEST_COLLECTION_KEY); 
    return stored ? JSON.parse(stored) : []; 
  } catch { 
    return []; 
  } 
} 

export function saveGuestCollection(items) { 
  if (typeof window === "undefined") return; 
  try { 
    localStorage.setItem(GUEST_COLLECTION_KEY, JSON.stringify(items)); 
    window.dispatchEvent(new Event("orgi_guest_collection_changed")); 
  } catch {} 
} 

export function isGuestInCollection(provider, externalId) { 
  if (!externalId) return false; 
  const normProvider = provider === "open_library" ? "openlibrary" : (provider || "tmdb"); 
  const items = getGuestCollection(); 
  return items.some( 
    (it) => String(it.externalId) === String(externalId) && (it.provider || "tmdb") === normProvider 
  ); 
} 

export function toggleGuestCollection({ external_id, provider, type, title, cover_url }) { 
  if (!external_id) return false; 
  const normProvider = provider === "open_library" ? "openlibrary" : (provider || "tmdb"); 
  const items = getGuestCollection(); 
  const existingIdx = items.findIndex( 
    (it) => String(it.externalId) === String(external_id) && (it.provider || "tmdb") === normProvider 
  ); 

  if (existingIdx >= 0) { 
    const updated = items.filter((_, idx) => idx !== existingIdx); 
    saveGuestCollection(updated); 
    return false; 
  } 

  const newItem = { 
    id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, 
    itemId: `guest_${String(external_id)}`, 
    externalId: String(external_id), 
    provider: normProvider, 
    type: (type || "MOVIE").toUpperCase(), 
    title: title || "Untitled Media", 
    coverUrl: cover_url || null, 
    status: "plan", 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(), 
  }; 

  saveGuestCollection([newItem, ...items]); 
  return true; 
} 

export function updateGuestCollectionStatus(externalId, provider, status) { 
  if (!externalId) return; 
  const normProvider = provider === "open_library" ? "openlibrary" : (provider || "tmdb"); 
  const items = getGuestCollection(); 
  const updated = items.map((it) => { 
    if (String(it.externalId) === String(externalId) && (it.provider || "tmdb") === normProvider) { 
      return { ...it, status, updatedAt: new Date().toISOString() }; 
    } 
    return it; 
  }); 
  saveGuestCollection(updated); 
} 

export function removeGuestCollectionItem(externalId, provider) { 
  if (!externalId) return; 
  const normProvider = provider === "open_library" ? "openlibrary" : (provider || "tmdb"); 
  const items = getGuestCollection(); 
  const updated = items.filter( 
    (it) => !(String(it.externalId) === String(externalId) && (it.provider || "tmdb") === normProvider) 
  ); 
  saveGuestCollection(updated); 
} 

export function clearGuestCollection() { 
  if (typeof window === "undefined") return; 
  try { 
    localStorage.removeItem(GUEST_COLLECTION_KEY); 
    window.dispatchEvent(new Event("orgi_guest_collection_changed")); 
  } catch {} 
} 
