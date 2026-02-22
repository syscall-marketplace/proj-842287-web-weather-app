export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    icon: string;
  };
  forecast: DayForecast[];
}

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface LocationSuggestion {
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
}

export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_kph: number;
    pressure_mb: number;
    vis_km: number;
    uv: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        avghumidity: number;
        maxwind_kph: number;
      };
    }>;
  };
}