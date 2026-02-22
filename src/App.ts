import { WeatherService } from './services/weatherService';
import { LocationSearch } from './components/LocationSearch';
import { CurrentWeather } from './components/CurrentWeather';
import { WeatherForecast } from './components/WeatherForecast';
import { AppState } from './state/AppState';
import type { LocationSuggestion } from './types/weather';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_CITY = 'London';

/**
 * Main application controller that coordinates all components,
 * manages the application lifecycle, and handles data flow.
 */
export class App {
  private weatherService: WeatherService;
  private state: AppState;
  private locationSearch!: LocationSearch;
  private currentWeather!: CurrentWeather;
  private weatherForecast!: WeatherForecast;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribeState: (() => void) | null = null;
  private boundOnlineHandler: () => void;
  private boundOfflineHandler: () => void;

  constructor() {
    this.weatherService = new WeatherService();
    this.state = new AppState();
    this.boundOnlineHandler = this.handleOnline.bind(this);
    this.boundOfflineHandler = this.handleOffline.bind(this);
  }

  /**
   * Initializes the application: renders the layout, sets up components,
   * loads saved preferences, and fetches initial weather data.
   */
  async init(): Promise<void> {
    this.renderLayout();
    this.initComponents();
    this.setupStateSubscription();
    this.setupBrowserEvents();
    this.startAutoRefresh();

    this.state.loadFromStorage();

    if (this.state.currentLocation) {
      await this.loadWeatherForLocation(this.state.currentLocation);
    } else {
      await this.loadWeatherForCity(DEFAULT_CITY);
    }
  }

  /**
   * Fetches and displays weather data for the given location.
   * @param location - The location to load weather for
   */
  async loadWeatherForLocation(location: LocationSuggestion): Promise<void> {
    this.state.setLocation(location);
    this.state.setLoading(true);

    this.currentWeather.showLoading();
    this.weatherForecast.showLoading();

    try {
      const data = await this.weatherService.getForecast(location.name, 5);
      this.state.setWeatherData(data);
      this.state.setLoading(false);
      this.state.saveToStorage();

      this.currentWeather.render(data);
      this.weatherForecast.render(data.forecast, this.state.temperatureUnit);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Toggles the temperature unit between Celsius and Fahrenheit
   * and re-renders affected components.
   */
  toggleTemperatureUnit(): void {
    const newUnit = this.state.temperatureUnit === 'C' ? 'F' : 'C';
    this.state.setTemperatureUnit(newUnit);
    this.state.saveToStorage();

    this.currentWeather.toggleTemperatureUnit();

    if (this.state.weatherData) {
      this.weatherForecast.render(this.state.weatherData.forecast, newUnit);
    }
  }

  /**
   * Handles application errors by updating state and displaying error messages.
   * @param error - The error to handle
   */
  handleError(error: Error): void {
    console.error('[WeatherApp]', error.message);
    this.state.setError(error.message);
    this.currentWeather.showError(error.message);
  }

  /**
   * Cleans up all event listeners, timers, and component resources.
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }

    window.removeEventListener('online', this.boundOnlineHandler);
    window.removeEventListener('offline', this.boundOfflineHandler);

    this.locationSearch.destroy();
  }

  private renderLayout(): void {
    const appEl = document.getElementById('app');
    if (!appEl) {
      throw new Error('Could not find #app element');
    }

    appEl.innerHTML = `
      <div class="app">
        <header class="app__header">
          <h1 class="app__title">Weather</h1>
          <div id="location-search"></div>
        </header>
        <main class="app__main">
          <div id="current-weather"></div>
          <div id="weather-forecast"></div>
        </main>
        <div id="app-status" class="app__status app__status--hidden"></div>
      </div>
    `;
  }

  private initComponents(): void {
    const searchContainer = document.getElementById('location-search')!;
    const currentContainer = document.getElementById('current-weather')!;
    const forecastContainer = document.getElementById('weather-forecast')!;

    this.locationSearch = new LocationSearch(searchContainer, this.weatherService);
    this.locationSearch.render();
    this.locationSearch.addEventListener('locationSelected', ((e: Event) => {
      const detail = (e as CustomEvent).detail as { location: LocationSuggestion };
      this.loadWeatherForLocation(detail.location);
    }) as EventListener);

    this.currentWeather = new CurrentWeather(currentContainer);
    this.weatherForecast = new WeatherForecast(forecastContainer);
  }

  private setupStateSubscription(): void {
    this.unsubscribeState = this.state.subscribe((_state) => {
      this.state.saveToStorage();
    });
  }

  private setupBrowserEvents(): void {
    window.addEventListener('online', this.boundOnlineHandler);
    window.addEventListener('offline', this.boundOfflineHandler);
  }

  private handleOnline(): void {
    this.hideStatus();
    if (this.state.currentLocation) {
      this.loadWeatherForLocation(this.state.currentLocation);
    }
  }

  private handleOffline(): void {
    this.showStatus('You are offline. Weather data may be outdated.');
  }

  private showStatus(message: string): void {
    const statusEl = document.getElementById('app-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.classList.remove('app__status--hidden');
    }
  }

  private hideStatus(): void {
    const statusEl = document.getElementById('app-status');
    if (statusEl) {
      statusEl.classList.add('app__status--hidden');
    }
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (this.state.currentLocation && !this.state.isLoading) {
        this.loadWeatherForLocation(this.state.currentLocation);
      }
    }, REFRESH_INTERVAL_MS);
  }

  private async loadWeatherForCity(city: string): Promise<void> {
    this.state.setLoading(true);
    this.currentWeather.showLoading();
    this.weatherForecast.showLoading();

    try {
      const data = await this.weatherService.getForecast(city, 5);

      const location: LocationSuggestion = {
        name: data.location.name,
        country: data.location.country,
        region: '',
        lat: data.location.lat,
        lon: data.location.lon,
      };

      this.state.setLocation(location);
      this.state.setWeatherData(data);
      this.state.setLoading(false);
      this.state.saveToStorage();

      this.currentWeather.render(data);
      this.weatherForecast.render(data.forecast, this.state.temperatureUnit);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
