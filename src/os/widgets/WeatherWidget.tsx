import React, { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  location: string;
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather from Open-Meteo
  async function fetchWeather(lat: number, lon: number) {
    setLoading(true);
    setError(null);
    try {
      // Open-Meteo API: https://open-meteo.com/en/docs
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`
      );
      const data = await resp.json();
      const temp = data.current_weather.temperature;
      const code = data.current_weather.weathercode;
      const icon = getWeatherIcon(code);
      const desc = getWeatherDesc(code);
      setWeather({
        temperature: temp,
        description: desc,
        icon,
        location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`
      });
    } catch (e) {
      setError('Could not fetch weather');
    }
    setLoading(false);
  }

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    // Try Permissions API for better UX
    if ((navigator as any).permissions) {
      (navigator as any).permissions.query({ name: 'geolocation' }).then((result: any) => {
        if (result.state === 'denied') {
          setError('Location permission denied in browser settings. Please allow location and reload.');
          setLoading(false);
        } else if (result.state === 'prompt') {
          setError('Please allow location access in your browser.');
          setLoading(false);
        } else {
          // granted or fallback
          navigator.geolocation.getCurrentPosition(
            pos => {
              fetchWeather(pos.coords.latitude, pos.coords.longitude);
              // Auto-refresh every 10 min
              const interval = setInterval(() => {
                fetchWeather(pos.coords.latitude, pos.coords.longitude);
              }, 600000);
              return () => clearInterval(interval);
            },
            () => {
              setError('Location permission denied. Check browser settings and reload.');
              setLoading(false);
            }
          );
        }
      }).catch(() => {
        // Fallback if Permissions API not available
        navigator.geolocation.getCurrentPosition(
          pos => {
            fetchWeather(pos.coords.latitude, pos.coords.longitude);
            const interval = setInterval(() => {
              fetchWeather(pos.coords.latitude, pos.coords.longitude);
            }, 600000);
            return () => clearInterval(interval);
          },
          () => {
            setError('Location permission denied. Check browser settings and reload.');
            setLoading(false);
          }
        );
      });
    } else {
      // Fallback if Permissions API not available
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
          const interval = setInterval(() => {
            fetchWeather(pos.coords.latitude, pos.coords.longitude);
          }, 600000);
          return () => clearInterval(interval);
        },
        () => {
          setError('Location permission denied. Check browser settings and reload.');
          setLoading(false);
        }
      );
    }
  }, []);

  function getWeatherIcon(code: number): string {
    // Open-Meteo WMO code icons (simple)
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code === 51 || code === 53 || code === 55) return '🌦️';
    if (code === 61 || code === 63 || code === 65) return '🌧️';
    if (code === 71 || code === 73 || code === 75) return '❄️';
    if (code === 80 || code === 81 || code === 82) return '🌧️';
    if (code === 95) return '⛈️';
    if (code === 96 || code === 99) return '⛈️';
    return '❓';
  }
  function getWeatherDesc(code: number): string {
    // Open-Meteo WMO code descriptions (simple)
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Fog';
    if (code === 51 || code === 53 || code === 55) return 'Drizzle';
    if (code === 61 || code === 63 || code === 65) return 'Rain';
    if (code === 71 || code === 73 || code === 75) return 'Snow';
    if (code === 80 || code === 81 || code === 82) return 'Rain showers';
    if (code === 95) return 'Thunderstorm';
    if (code === 96 || code === 99) return 'Thunderstorm w/ hail';
    return 'Unknown';
  }

  return (
    <div style={{ padding: 10, minWidth: 140, maxWidth: 200 }}>
      <div style={{ fontSize: 28, color: '#ffe6ff', fontWeight: 700, textShadow: '0 2px 8px #a26aff77' }}>
        {weather ? weather.icon : '☀️'}
      </div>
      <div style={{ fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 4 }}>
        Weather
      </div>
      <div style={{ fontSize: 15, color: '#ffd6fa', marginBottom: 2, fontWeight: 500 }}>
        {loading && 'Loading...'}
        {error && error}
        {weather && !loading && !error && `${weather.temperature}°C, ${weather.description}`}
      </div>
      <div style={{ fontSize: 13, color: '#bfa', marginTop: 6 }}>
        {weather && !loading && !error && `Location: ${weather.location}`}
        {!weather && !loading && !error && 'No data'}
      </div>
    </div>
  );
};
