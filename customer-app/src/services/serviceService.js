import api from '../api/axios';

const CACHE_KEY = 'localgo_services_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let memoryCache = null;
let inFlightPromise = null;

function readCache() {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeCache(data) {
  if (!Array.isArray(data) || data.length === 0) return;
  const entry = { data, updatedAt: Date.now() };
  memoryCache = entry;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage quota errors
  }
}

async function fetchServices(skipWakeRetry = false) {
  if (inFlightPromise) return inFlightPromise;
  inFlightPromise = api
    .get('/services', skipWakeRetry ? { skipWakeRetry: true } : undefined)
    .then((res) => {
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeCache(data);
      }
      return Array.isArray(data) ? data : [];
    })
    .finally(() => {
      inFlightPromise = null;
    });
  return inFlightPromise;
}

export const serviceService = {
  getAllServices: async () => {
    const cached = readCache();
    if (cached) {
      const isStale = Date.now() - (cached.updatedAt || 0) > CACHE_TTL_MS;
      if (isStale) {
        // Stale-while-revalidate silently in background without showing wake banner
        fetchServices(true).catch(() => {});
      }
      return cached.data;
    }
    return fetchServices(false);
  },
  getServiceById: async (id) => {
    const cached = readCache();
    const hit = cached?.data?.find((s) => s.id === id);
    if (hit) {
      return hit;
    }
    const res = await api.get(`/services/${id}`);
    return res.data.data;
  },
};
