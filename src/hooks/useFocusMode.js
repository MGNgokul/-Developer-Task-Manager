import { useEffect, useMemo, useState } from "react";

const APP_SETTINGS_KEY = "appSettings";
const FOCUS_STATE_KEY = "focusSessionState";
const FOCUS_DAILY_KEY = "focusDailyStats";

const DEFAULT_FOCUS_CONFIG = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartFocus: false,
};

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeFocusConfig(config) {
  return {
    workMinutes: clamp(config?.workMinutes, 10, 120, DEFAULT_FOCUS_CONFIG.workMinutes),
    shortBreakMinutes: clamp(
      config?.shortBreakMinutes,
      1,
      30,
      DEFAULT_FOCUS_CONFIG.shortBreakMinutes
    ),
    longBreakMinutes: clamp(
      config?.longBreakMinutes,
      5,
      60,
      DEFAULT_FOCUS_CONFIG.longBreakMinutes
    ),
    cyclesBeforeLongBreak: clamp(
      config?.cyclesBeforeLongBreak,
      2,
      8,
      DEFAULT_FOCUS_CONFIG.cyclesBeforeLongBreak
    ),
    autoStartBreak: Boolean(config?.autoStartBreak),
    autoStartFocus: Boolean(config?.autoStartFocus),
  };
}

function getPhaseDurationSeconds(phase, config) {
  if (phase === "focus") return config.workMinutes * 60;
  if (phase === "short_break") return config.shortBreakMinutes * 60;
  return config.longBreakMinutes * 60;
}

function loadFocusConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)) || {};
    return normalizeFocusConfig(saved?.focus);
  } catch {
    return normalizeFocusConfig();
  }
}

function loadSessionState(config) {
  try {
    const saved = JSON.parse(localStorage.getItem(FOCUS_STATE_KEY)) || {};
    const phase = saved?.phase === "short_break" || saved?.phase === "long_break" ? saved.phase : "focus";
    const phaseDuration = getPhaseDurationSeconds(phase, config);
    const secondsLeft = clamp(saved?.secondsLeft, 1, phaseDuration, phaseDuration);
    return {
      phase,
      isRunning: Boolean(saved?.isRunning),
      secondsLeft,
      cycleCount: clamp(saved?.cycleCount, 0, 999, 0),
    };
  } catch {
    return {
      phase: "focus",
      isRunning: false,
      secondsLeft: config.workMinutes * 60,
      cycleCount: 0,
    };
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function loadDailyStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(FOCUS_DAILY_KEY)) || {};
    const today = todayIso();
    if (saved?.date !== today) {
      return { date: today, completed: 0 };
    }
    return {
      date: today,
      completed: clamp(saved?.completed, 0, 999, 0),
    };
  } catch {
    return { date: todayIso(), completed: 0 };
  }
}

function useFocusMode() {
  const [focusConfig, setFocusConfig] = useState(loadFocusConfig);
  const [session, setSession] = useState(() => loadSessionState(loadFocusConfig()));
  const [dailyStats, setDailyStats] = useState(loadDailyStats);

  useEffect(() => {
    localStorage.setItem(FOCUS_STATE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(FOCUS_DAILY_KEY, JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    const syncConfig = () => {
      const nextConfig = loadFocusConfig();
      setFocusConfig(nextConfig);
      setSession((prev) => {
        const phaseDuration = getPhaseDurationSeconds(prev.phase, nextConfig);
        const nextSeconds = prev.isRunning
          ? Math.max(1, Math.min(prev.secondsLeft, phaseDuration))
          : phaseDuration;
        return { ...prev, secondsLeft: nextSeconds };
      });
    };

    window.addEventListener("storage", syncConfig);
    window.addEventListener("app-settings-updated", syncConfig);
    return () => {
      window.removeEventListener("storage", syncConfig);
      window.removeEventListener("app-settings-updated", syncConfig);
    };
  }, []);

  useEffect(() => {
    const dailyResetTimer = setInterval(() => {
      const now = todayIso();
      setDailyStats((prev) => (prev.date === now ? prev : { date: now, completed: 0 }));
    }, 60_000);
    return () => clearInterval(dailyResetTimer);
  }, []);

  useEffect(() => {
    if (!session.isRunning) return undefined;

    const timer = setInterval(() => {
      setSession((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }

        if (prev.phase === "focus") {
          const nextCycle = prev.cycleCount + 1;
          const longBreak =
            nextCycle % Math.max(1, focusConfig.cyclesBeforeLongBreak) === 0;
          const nextPhase = longBreak ? "long_break" : "short_break";
          if (dailyStats.date === todayIso()) {
            setDailyStats((current) => ({ ...current, completed: current.completed + 1 }));
          }
          return {
            phase: nextPhase,
            cycleCount: nextCycle,
            secondsLeft: getPhaseDurationSeconds(nextPhase, focusConfig),
            isRunning: focusConfig.autoStartBreak,
          };
        }

        return {
          ...prev,
          phase: "focus",
          secondsLeft: getPhaseDurationSeconds("focus", focusConfig),
          isRunning: focusConfig.autoStartFocus,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    session.isRunning,
    focusConfig,
    dailyStats.date,
  ]);

  const actions = useMemo(
    () => ({
      start: () => setSession((prev) => ({ ...prev, isRunning: true })),
      pause: () => setSession((prev) => ({ ...prev, isRunning: false })),
      reset: () =>
        setSession((prev) => ({
          ...prev,
          phase: "focus",
          secondsLeft: getPhaseDurationSeconds("focus", focusConfig),
          isRunning: false,
        })),
      skip: () =>
        setSession((prev) => {
          if (prev.phase === "focus") {
            const nextCycle = prev.cycleCount + 1;
            const longBreak =
              nextCycle % Math.max(1, focusConfig.cyclesBeforeLongBreak) === 0;
            const nextPhase = longBreak ? "long_break" : "short_break";
            return {
              phase: nextPhase,
              cycleCount: nextCycle,
              secondsLeft: getPhaseDurationSeconds(nextPhase, focusConfig),
              isRunning: false,
            };
          }

          return {
            ...prev,
            phase: "focus",
            secondsLeft: getPhaseDurationSeconds("focus", focusConfig),
            isRunning: false,
          };
        }),
    }),
    [focusConfig]
  );

  const label = session.phase === "focus"
    ? "Focus Session"
    : session.phase === "short_break"
      ? "Short Break"
      : "Long Break";

  return {
    focusConfig,
    phase: session.phase,
    phaseLabel: label,
    secondsLeft: session.secondsLeft,
    isRunning: session.isRunning,
    cycleCount: session.cycleCount,
    completedToday: dailyStats.completed,
    ...actions,
  };
}

export default useFocusMode;
