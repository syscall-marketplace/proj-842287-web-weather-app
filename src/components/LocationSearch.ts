import type { WeatherService } from '../services/weatherService';
import type { LocationSuggestion } from '../types/weather';

/**
 * Interactive location search component with autocomplete dropdown
 * and geolocation support.
 */
export class LocationSearch extends EventTarget {
  private container: HTMLElement;
  private weatherService: WeatherService;
  private inputEl!: HTMLInputElement;
  private dropdownEl!: HTMLElement;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private suggestions: LocationSuggestion[] = [];
  private isLoading = false;
  private boundHandleClickOutside: (e: MouseEvent) => void;

  constructor(container: HTMLElement, weatherService: WeatherService) {
    super();
    this.container = container;
    this.weatherService = weatherService;
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);
  }

  /**
   * Renders the location search component into the container.
   */
  render(): void {
    this.container.innerHTML = `
      <div class="location-search">
        <div class="location-search__input-wrapper">
          <svg class="location-search__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            class="location-search__input"
            placeholder="Search for a city..."
            autocomplete="off"
          />
          <button class="location-search__geo-btn" title="Use current location" type="button">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          </button>
        </div>
        <div class="location-search__dropdown location-search__dropdown--hidden"></div>
      </div>
    `;

    this.inputEl = this.container.querySelector('.location-search__input') as HTMLInputElement;
    this.dropdownEl = this.container.querySelector('.location-search__dropdown') as HTMLElement;

    this.inputEl.addEventListener('input', this.handleInput.bind(this));
    this.inputEl.addEventListener('focus', this.handleFocus.bind(this));

    const geoBtn = this.container.querySelector('.location-search__geo-btn') as HTMLButtonElement;
    geoBtn.addEventListener('click', this.handleGeolocation.bind(this));

    document.addEventListener('click', this.boundHandleClickOutside);
  }

  /**
   * Cleans up event listeners and DOM.
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    document.removeEventListener('click', this.boundHandleClickOutside);
    this.container.innerHTML = '';
  }

  private handleInput(): void {
    const query = this.inputEl.value.trim();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (query.length < 2) {
      this.hideDropdown();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.searchLocations(query);
    }, 300);
  }

  private handleFocus(): void {
    if (this.suggestions.length > 0) {
      this.showDropdown();
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    if (!this.container.contains(target)) {
      this.hideDropdown();
    }
  }

  private async searchLocations(query: string): Promise<void> {
    this.isLoading = true;
    this.renderDropdown();

    try {
      this.suggestions = await this.weatherService.searchLocations(query);
      this.isLoading = false;
      this.renderDropdown();
    } catch {
      this.isLoading = false;
      this.suggestions = [];
      this.renderDropdownError('Failed to search locations. Please try again.');
    }
  }

  private async handleGeolocation(): Promise<void> {
    if (!navigator.geolocation) {
      this.renderDropdownError('Geolocation is not supported by your browser.');
      return;
    }

    this.isLoading = true;
    this.inputEl.value = 'Detecting location...';
    this.inputEl.disabled = true;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = position.coords;
      const results = await this.weatherService.searchLocations(`${latitude},${longitude}`);

      this.inputEl.disabled = false;

      if (results.length > 0) {
        const location = results[0];
        this.inputEl.value = `${location.name}, ${location.country}`;
        this.emitLocationSelected(location);
      } else {
        this.renderDropdownError('Could not determine your location.');
      }
    } catch {
      this.inputEl.disabled = false;
      this.inputEl.value = '';
      this.renderDropdownError('Unable to get your location. Please check permissions.');
    } finally {
      this.isLoading = false;
    }
  }

  private renderDropdown(): void {
    if (this.isLoading) {
      this.dropdownEl.innerHTML = `
        <div class="location-search__loading">Searching...</div>
      `;
      this.showDropdown();
      return;
    }

    if (this.suggestions.length === 0) {
      this.dropdownEl.innerHTML = `
        <div class="location-search__empty">No locations found</div>
      `;
      this.showDropdown();
      return;
    }

    this.dropdownEl.innerHTML = this.suggestions
      .map(
        (suggestion, index) => `
        <button class="location-search__suggestion" data-index="${index}" type="button">
          <span class="location-search__suggestion-name">${suggestion.name}</span>
          <span class="location-search__suggestion-detail">${suggestion.region}, ${suggestion.country}</span>
        </button>
      `
      )
      .join('');

    this.dropdownEl.querySelectorAll('.location-search__suggestion').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).dataset.index!, 10);
        const location = this.suggestions[index];
        this.inputEl.value = `${location.name}, ${location.country}`;
        this.hideDropdown();
        this.emitLocationSelected(location);
      });
    });

    this.showDropdown();
  }

  private renderDropdownError(message: string): void {
    this.dropdownEl.innerHTML = `
      <div class="location-search__error">${message}</div>
    `;
    this.showDropdown();
  }

  private showDropdown(): void {
    this.dropdownEl.classList.remove('location-search__dropdown--hidden');
  }

  private hideDropdown(): void {
    this.dropdownEl.classList.add('location-search__dropdown--hidden');
  }

  private emitLocationSelected(location: LocationSuggestion): void {
    this.dispatchEvent(
      new CustomEvent('locationSelected', { detail: { location } })
    );
  }
}
