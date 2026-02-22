import type { WeatherData } from '../types/weather.ts';

export class CurrentWeather {
  private container: HTMLElement;
  private unit: 'C' | 'F' = 'C';
  private currentData: WeatherData | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(data: WeatherData): void {
    this.currentData = data;
    const { location, current } = data;
    const temp = this.formatTemp(current.temperature);

    this.container.innerHTML = `
      <div class="current-weather">
        <div class="current-weather__header">
          <h2 class="current-weather__location">${this.escape(location.name)}, ${this.escape(location.country)}</h2>
        </div>
        <div class="current-weather__main">
          <div class="current-weather__primary">
            <img class="current-weather__icon" src="${this.escape(current.icon)}" alt="${this.escape(current.condition)}" />
            <span class="current-weather__temp">${temp}</span>
            <button class="current-weather__unit-toggle" aria-label="Toggle temperature unit">&deg;${this.unit}</button>
          </div>
          <p class="current-weather__condition">${this.escape(current.condition)}</p>
          <p class="current-weather__description">${this.escape(current.description)}</p>
        </div>
        <div class="current-weather__metrics">
          <div class="current-weather__metric">
            <span class="current-weather__metric-label">Humidity</span>
            <span class="current-weather__metric-value">${current.humidity}%</span>
          </div>
          <div class="current-weather__metric">
            <span class="current-weather__metric-label">Wind</span>
            <span class="current-weather__metric-value">${current.windSpeed} km/h</span>
          </div>
          <div class="current-weather__metric">
            <span class="current-weather__metric-label">Pressure</span>
            <span class="current-weather__metric-value">${current.pressure} hPa</span>
          </div>
          <div class="current-weather__metric">
            <span class="current-weather__metric-label">Visibility</span>
            <span class="current-weather__metric-value">${current.visibility} km</span>
          </div>
          <div class="current-weather__metric">
            <span class="current-weather__metric-label">UV Index</span>
            <span class="current-weather__metric-value">${current.uvIndex}</span>
          </div>
        </div>
      </div>
    `;

    this.container
      .querySelector('.current-weather__unit-toggle')
      ?.addEventListener('click', () => {
        this.toggleTemperatureUnit();
      });
  }

  showLoading(): void {
    this.container.innerHTML = `
      <div class="current-weather current-weather--loading">
        <div class="current-weather__header">
          <div class="skeleton skeleton--text skeleton--w60"></div>
        </div>
        <div class="current-weather__main">
          <div class="current-weather__primary">
            <div class="skeleton skeleton--icon"></div>
            <div class="skeleton skeleton--temp"></div>
          </div>
          <div class="skeleton skeleton--text skeleton--w40"></div>
          <div class="skeleton skeleton--text skeleton--w50"></div>
        </div>
        <div class="current-weather__metrics">
          ${Array(5).fill('<div class="current-weather__metric"><div class="skeleton skeleton--text skeleton--w80"></div><div class="skeleton skeleton--text skeleton--w60"></div></div>').join('')}
        </div>
      </div>
    `;
  }

  showError(message: string): void {
    this.container.innerHTML = `
      <div class="current-weather current-weather--error">
        <div class="current-weather__error">
          <span class="current-weather__error-icon">&#9888;</span>
          <p class="current-weather__error-message">${this.escape(message)}</p>
        </div>
      </div>
    `;
  }

  toggleTemperatureUnit(): void {
    this.unit = this.unit === 'C' ? 'F' : 'C';
    if (this.currentData) {
      this.render(this.currentData);
    }
  }

  getCurrentUnit(): 'C' | 'F' {
    return this.unit;
  }

  private formatTemp(celsius: number): string {
    if (this.unit === 'F') {
      return `${Math.round(celsius * 9 / 5 + 32)}`;
    }
    return `${Math.round(celsius)}`;
  }

  private escape(str: string): string {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }
}
