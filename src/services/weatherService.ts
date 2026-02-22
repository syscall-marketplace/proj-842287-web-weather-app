import axios, { AxiosError } from 'axios';
import type { WeatherData, DayForecast, LocationSuggestion, WeatherApiResponse } from '../types/weather';

const API_BASE_URL = 'https://api.weatherapi.com/v1';
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

/**
 * Service layer for fetching weather data from WeatherAPI.com.
 * Handles API communication, response transformation, and error handling.
 */
export class WeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = API_KEY, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches current weather data for a given city.
   * @param city - The city name or location query (e.g. "London", "48.8566,2.3522")
   * @returns A promise resolving to the transformed WeatherData object with current conditions
   * @throws Error if the API request fails or returns an invalid response
   */
  async getCurrentWeather(city: string): Promise<WeatherData> {
    try {
      const response = await axios.get<WeatherApiResponse>(
        `${this.baseUrl}/forecast.json`,
        {
          params: {
            key: this.apiKey,
            q: city,
            days: 1,
            aqi: 'no',
          },
        }
      );

      return this.transformWeatherResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch current weather for "${city}"`);
    }
  }

  /**
   * Fetches weather forecast data for a given city.
   * @param city - The city name or location query
   * @param days - Number of forecast days to retrieve (1-10, default 5)
   * @returns A promise resolving to the transformed WeatherData object with forecast data
   * @throws Error if the API request fails or returns an invalid response
   */
  async getForecast(city: string, days: number = 5): Promise<WeatherData> {
    try {
      const response = await axios.get<WeatherApiResponse>(
        `${this.baseUrl}/forecast.json`,
        {
          params: {
            key: this.apiKey,
            q: city,
            days,
            aqi: 'no',
          },
        }
      );

      return this.transformWeatherResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch forecast for "${city}"`);
    }
  }

  /**
   * Searches for location suggestions matching the given query.
   * @param query - The search query string (city name, zip code, coordinates, etc.)
   * @returns A promise resolving to an array of location suggestions
   * @throws Error if the API request fails or returns an invalid response
   */
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    try {
      const response = await axios.get<Array<{
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
      }>>(
        `${this.baseUrl}/search.json`,
        {
          params: {
            key: this.apiKey,
            q: query,
          },
        }
      );

      return response.data.map((item) => ({
        name: item.name,
        country: item.country,
        region: item.region,
        lat: item.lat,
        lon: item.lon,
      }));
    } catch (error) {
      throw this.handleApiError(error, `Failed to search locations for "${query}"`);
    }
  }

  /**
   * Transforms the raw WeatherAPI response into the app's WeatherData interface.
   */
  private transformWeatherResponse(data: WeatherApiResponse): WeatherData {
    const forecast: DayForecast[] = (data.forecast?.forecastday ?? []).map((day) => ({
      date: day.date,
      maxTemp: day.day.maxtemp_c,
      minTemp: day.day.mintemp_c,
      condition: day.day.condition.text,
      description: day.day.condition.text,
      icon: day.day.condition.icon,
      humidity: day.day.avghumidity,
      windSpeed: day.day.maxwind_kph,
    }));

    return {
      location: {
        name: data.location.name,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
      },
      current: {
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        description: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        uvIndex: data.current.uv,
        icon: data.current.condition.icon,
      },
      forecast,
    };
  }

  /**
   * Handles API errors and returns a descriptive error message.
   */
  private handleApiError(error: unknown, context: string): Error {
    if (error instanceof AxiosError) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.message;

        if (status === 400) {
          return new Error(`${context}: Invalid request — ${message}`);
        }
        if (status === 401 || status === 403) {
          return new Error(`${context}: Authentication failed — check your API key`);
        }
        if (status === 404) {
          return new Error(`${context}: Location not found`);
        }
        return new Error(`${context}: API error (${status}) — ${message}`);
      }

      if (error.code === 'ECONNABORTED') {
        return new Error(`${context}: Request timed out`);
      }

      return new Error(`${context}: Network error — ${error.message}`);
    }

    return new Error(`${context}: Unexpected error — ${String(error)}`);
  }
}
