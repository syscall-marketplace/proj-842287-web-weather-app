import type { DayForecast } from '../types/weather';

/**
 * Component to display a multi-day weather forecast with responsive layout,
 * temperature unit switching, and interactive day selection.
 */
export class WeatherForecast extends EventTarget {
  private container: HTMLElement;
  private currentUnit: 'C' | 'F' = 'C';
  private currentForecast: DayForecast[] = [];

  constructor(container: HTMLElement) {
    super();
    this.container = container;
  }

  /**
   * Renders the forecast data into the container.
   * @param forecast - Array of daily forecast data
   * @param unit - Temperature unit ('C' for Celsius, 'F' for Fahrenheit)
   */
  render(forecast: DayForecast[], unit: 'C' | 'F' = 'C'): void {
    this.currentForecast = forecast;
    this.currentUnit = unit;

    if (forecast.length === 0) {
      this.container.innerHTML = `
        <div class="weather-forecast">
          <p class="weather-forecast__empty">No forecast data available</p>
        </div>
      `;
      return;
    }

    const cards = forecast
      .map((day, index) => this.renderCard(day, index))
      .join('');

    this.container.innerHTML = `
      <div class="weather-forecast">
        <h3 class="weather-forecast__title">Forecast</h3>
        <div class="weather-forecast__grid">
          ${cards}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Displays a loading skeleton in the container.
   */
  showLoading(): void {
    const skeletons = Array.from({ length: 5 })
      .map(
        () => `
        <div class="weather-forecast__card weather-forecast__card--skeleton">
          <div class="skeleton skeleton--date"></div>
          <div class="skeleton skeleton--icon"></div>
          <div class="skeleton skeleton--temp"></div>
          <div class="skeleton skeleton--condition"></div>
        </div>
      `
      )
      .join('');

    this.container.innerHTML = `
      <div class="weather-forecast">
        <h3 class="weather-forecast__title">Forecast</h3>
        <div class="weather-forecast__grid">
          ${skeletons}
        </div>
      </div>
    `;
  }

  private renderCard(day: DayForecast, index: number): string {
    const date = new Date(day.date + 'T00:00:00');
    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const maxTemp = this.convertTemp(day.maxTemp);
    const minTemp = this.convertTemp(day.minTemp);
    const unitLabel = this.currentUnit === 'C' ? '°C' : '°F';

    return `
      <button class="weather-forecast__card" data-index="${index}" type="button">
        <span class="weather-forecast__day">${dayName}</span>
        <span class="weather-forecast__date">${dateStr}</span>
        <img
          class="weather-forecast__icon"
          src="${day.icon}"
          alt="${day.condition}"
          loading="lazy"
        />
        <div class="weather-forecast__temps">
          <span class="weather-forecast__temp-high">${Math.round(maxTemp)}${unitLabel}</span>
          <span class="weather-forecast__temp-low">${Math.round(minTemp)}${unitLabel}</span>
        </div>
        <span class="weather-forecast__condition">${day.condition}</span>
        <div class="weather-forecast__details">
          <span class="weather-forecast__detail">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            ${day.humidity}%
          </span>
          <span class="weather-forecast__detail">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
            </svg>
            ${Math.round(day.windSpeed)} km/h
          </span>
        </div>
      </button>
    `;
  }

  private convertTemp(tempC: number): number {
    if (this.currentUnit === 'F') {
      return (tempC * 9) / 5 + 32;
    }
    return tempC;
  }

  private attachEventListeners(): void {
    this.container.querySelectorAll('.weather-forecast__card:not(.weather-forecast__card--skeleton)').forEach((card) => {
      card.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).dataset.index!, 10);
        const day = this.currentForecast[index];
        this.dispatchEvent(
          new CustomEvent('daySelected', { detail: { day, index } })
        );
      });
    });
  }
}
