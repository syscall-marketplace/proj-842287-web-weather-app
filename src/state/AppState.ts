import type { WeatherData, LocationSuggestion } from '../types/weather';
import { getStorageItem, setStorageItem } from '../utils/storage';

const STORAGE_KEY_LOCATION = 'lastLocation';
const STORAGE_KEY_UNIT = 'temperatureUnit';

type Subscriber = (state: AppState) => void;

/**
 * Centralized state management for the weather application.
 * Implements the observer pattern for reactive state updates and
 * persists user preferences to localStorage.
 */
export class AppState {
  currentLocation: LocationSuggestion | null = null;
  weatherData: WeatherData | null = null;
  isLoading = false;
  error: string | null = null;
  temperatureUnit: 'C' | 'F' = 'C';

  private subscribers: Set<Subscriber> = new Set();

  /**
   * Updates the current location and notifies subscribers.
   * @param location - The selected location
   */
  setLocation(location: LocationSuggestion): void {
    this.currentLocation = location;
    this.error = null;
    this.notify();
  }

  /**
   * Updates the weather data and notifies subscribers.
   * @param data - The weather data to set
   */
  setWeatherData(data: WeatherData): void {
    this.weatherData = data;
    this.error = null;
    this.notify();
  }

  /**
   * Sets the loading state and notifies subscribers.
   * @param loading - Whether the app is loading
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.error = null;
    }
    this.notify();
  }

  /**
   * Sets the error state and notifies subscribers.
   * @param error - The error message, or null to clear
   */
  setError(error: string | null): void {
    this.error = error;
    this.isLoading = false;
    this.notify();
  }

  /**
   * Updates the temperature unit preference and notifies subscribers.
   * @param unit - 'C' for Celsius or 'F' for Fahrenheit
   */
  setTemperatureUnit(unit: 'C' | 'F'): void {
    this.temperatureUnit = unit;
    this.notify();
  }

  /**
   * Subscribes to state changes.
   * @param callback - Function called whenever state changes
   * @returns An unsubscribe function
   */
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Persists current user preferences (last location, temperature unit) to localStorage.
   */
  saveToStorage(): void {
    if (this.currentLocation) {
      setStorageItem(STORAGE_KEY_LOCATION, this.currentLocation);
    }
    setStorageItem(STORAGE_KEY_UNIT, this.temperatureUnit);
  }

  /**
   * Loads previously saved user preferences from localStorage.
   */
  loadFromStorage(): void {
    const savedLocation = getStorageItem<LocationSuggestion>(STORAGE_KEY_LOCATION);
    if (savedLocation && savedLocation.name && savedLocation.country) {
      this.currentLocation = savedLocation;
    }

    const savedUnit = getStorageItem<'C' | 'F'>(STORAGE_KEY_UNIT);
    if (savedUnit === 'C' || savedUnit === 'F') {
      this.temperatureUnit = savedUnit;
    }

    this.notify();
  }

  private notify(): void {
    for (const callback of this.subscribers) {
      try {
        callback(this);
      } catch {
        // Prevent one broken subscriber from blocking others
      }
    }
  }
}
