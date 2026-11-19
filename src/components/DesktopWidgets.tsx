import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, MapPin } from 'lucide-react';
import { OSSettings } from '../types/os';
import { WEATHER_CITIES } from '../data/initialState';

interface DesktopWidgetsProps {
  settings: OSSettings;
  onUpdateSettings: (patch: Partial<OSSettings>) => void;
  onOpenCalendar: () => void;
}

interface WeatherReading {
  tempC: number;
  condition: string;
  windKmh: number;
  humidity: number;
  code: number;
}

function wmoToCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Mist / Fog';
  if (code <= 67) return 'Light Rain';
  if (code <= 77) return 'Snowfall';
  if (code <= 82) return 'Rain Showers';
  return 'Stormy';
}

export const DesktopWidgets: React.FC<DesktopWidgetsProps> = ({
  settings,
  onUpdateSettings,
  onOpenCalendar,
}) => {
  const [now, setNow] = useState(() => new Date());
  const cityMeta = WEATHER_CITIES.find((c) => c.name === settings.weatherCity) ?? WEATHER_CITIES[0];

  const [weather, setWeather] = useState<WeatherReading>({
    tempC: cityMeta.fallbackTempC,
    condition: cityMeta.fallbackCond,
    windKmh: cityMeta.fallbackWind,
    humidity: cityMeta.fallbackHum,
    code: 2,
  });

  useEffect(() => {
    if (!settings.showDesktopClock) return;
    let rafId = 0;
    const tick = () => {
      setNow(new Date());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [settings.showDesktopClock]);

  useEffect(() => {
    if (!settings.showDesktopWeather) return;
    const city = WEATHER_CITIES.find((c) => c.name === settings.weatherCity) ?? WEATHER_CITIES[0];
    setWeather({
      tempC: city.fallbackTempC,
      condition: city.fallbackCond,
      windKmh: city.fallbackWind,
      humidity: city.fallbackHum,
      code: 2,
    });

    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.current) {
          const code = Number(data.current.weather_code ?? 2);
          setWeather({
            tempC: Math.round(Number(data.current.temperature_2m ?? city.fallbackTempC)),
            condition: wmoToCondition(code),
            windKmh: Math.round(Number(data.current.wind_speed_10m ?? city.fallbackWind)),
            humidity: Math.round(Number(data.current.relative_humidity_2m ?? city.fallbackHum)),
            code,
          });
        }
      })
      .catch(() => {
        // Gracefully retain local fallback weather reading
      });

    return () => controller.abort();
  }, [settings.weatherCity, settings.showDesktopWeather]);

  if (!settings.showDesktopClock && !settings.showDesktopWeather) return null;

  const displayTemp =
    settings.weatherUnit === 'F' ? Math.round((weather.tempC * 9) / 5 + 32) : weather.tempC;

  const secondsProgress = ((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * 100;

  const cycleCity = () => {
    const idx = WEATHER_CITIES.findIndex((c) => c.name === settings.weatherCity);
    const next = WEATHER_CITIES[(idx + 1) % WEATHER_CITIES.length];
    onUpdateSettings({ weatherCity: next.name });
  };

  const WeatherIcon = weather.code === 0 ? Sun : weather.code >= 51 ? CloudRain : Cloud;

  return (
    <aside
      aria-label="Desktop Clock and Weather"
      className="fixed top-[54px] right-5 z-10 w-64 space-y-2.5 pointer-events-auto"
    >
      {settings.showDesktopClock && (
        <button
          type="button"
          onClick={onOpenCalendar}
          className={`w-full p-4 rounded-none border border-white/15 text-left transition-colors hover:border-white/25 ${
            settings.reduceTransparency ? 'bg-[#0A0D13]' : 'sl8-frosted-pane'
          }`}
        >
          <div className="font-display text-4xl font-semibold tracking-tight text-white tabular-nums leading-none">
            {now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: !settings.clock24Hour,
            })}
          </div>

          {/* Seconds-synchronized horizontal sweep line underneath Hour & Minute */}
          <div
            aria-hidden="true"
            className="mt-3 h-[3px] w-full bg-white/10 relative overflow-hidden"
          >
            <div className="absolute inset-y-0 left-1/4 w-px bg-white/15 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/15 z-10" />
            <div className="absolute inset-y-0 left-3/4 w-px bg-white/15 z-10" />
            <div
              className="h-full relative"
              style={{
                width: `${secondsProgress}%`,
                backgroundColor: 'var(--sl8-accent)',
                boxShadow: '0 0 10px var(--sl8-accent)',
              }}
            >
              <span className="absolute right-0 top-0 bottom-0 w-[2px] bg-white" />
            </div>
          </div>

          <p className="text-xs text-[#A5B1C2] mt-2.5">
            {now.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </button>
      )}

      {settings.showDesktopWeather && (
        <div
          className={`p-4 rounded-none border border-white/15 space-y-3 ${
            settings.reduceTransparency ? 'bg-[#0A0D13]' : 'sl8-frosted-pane'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={cycleCity}
              title="Click to switch city"
              className="flex items-center gap-1.5 text-xs font-medium text-white hover:underline min-w-0"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--sl8-accent)' }} />
              <span className="truncate">{settings.weatherCity}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ weatherUnit: settings.weatherUnit === 'F' ? 'C' : 'F' })
              }
              className="px-1.5 py-0.5 border border-white/15 text-[10px] font-mono text-[#B9C2CF] hover:text-white"
            >
              °{settings.weatherUnit}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-3xl font-semibold text-white tabular-nums">
                {displayTemp}°{settings.weatherUnit}
              </p>
              <p className="text-xs text-[#9AA5B6] mt-0.5">{weather.condition}</p>
            </div>
            <WeatherIcon className="w-8 h-8" style={{ color: 'var(--sl8-accent)' }} />
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#94A0B2] tabular-nums">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" /> {weather.windKmh} km/h
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" /> {weather.humidity}%
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
