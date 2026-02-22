const STORAGE_PREFIX = 'weather-app:';

/**
 * Reads a value from localStorage, returning null if unavailable or unparseable.
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Writes a value to localStorage as JSON.
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Removes a value from localStorage.
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore
  }
}
