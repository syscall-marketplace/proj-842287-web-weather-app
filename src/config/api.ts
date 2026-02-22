export const API_CONFIG = {
  BASE_URL: 'https://api.weatherapi.com/v1',
  API_KEY: 'your-api-key-here', // Replace with actual API key
  ENDPOINTS: {
    CURRENT: '/current.json',
    FORECAST: '/forecast.json',
    SEARCH: '/search.json'
  },
  DEFAULT_PARAMS: {
    days: 5,
    aqi: 'no',
    alerts: 'no'
  }
} as const;