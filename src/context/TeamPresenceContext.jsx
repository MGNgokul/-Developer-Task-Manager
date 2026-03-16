import { createContext, useEffect, useMemo, useState } from "react";
import { loadWorkspaceMembers } from "../utils/workspace";
import useAuth from "../hooks/useAuth";

export const TeamPresenceContext = createContext(null);

const PRESENCE_KEY = "teamPresenceRecords";
const AVAILABILITY_KEY = "teamAvailabilityByEmail";

function loadPresenceRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRESENCE_KEY)) || {};
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function loadAvailabilityMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(AVAILABILITY_KEY)) || {};
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function resolveStatus(lastSeenAt, availability) {
  const ageMs = Date.now() - Number(lastSeenAt || 0);
  if (!Number.isFinite(ageMs) || ageMs > 3 * 60 * 1000) return "offline";
  if (availability === "away") return "away";
  if (availability === "dnd") return "dnd";
  if (ageMs > 45 * 1000) return "away";
  return "online";
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return "never";
  const ageMs = Date.now() - Number(lastSeenAt);
  if (ageMs < 60 * 1000) return "just now";
  if (ageMs < 60 * 60 * 1000) return `${Math.floor(ageMs / (60 * 1000))}m ago`;
  return `${Math.floor(ageMs / (60 * 60 * 1000))}h ago`;
}

export function TeamPresenceProvider({ children }) {
  const { user } = useAuth();
  const [records, setRecords] = useState(loadPresenceRecords);
  const [availabilityMap, setAvailabilityMap] = useState(loadAvailabilityMap);

  useEffect(() => {
    const sync = () => {
      setRecords(loadPresenceRecords());
      setAvailabilityMap(loadAvailabilityMap());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("workspace-members-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("workspace-members-updated", sync);
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return undefined;

    const email = String(user.email).trim().toLowerCase();
    const name = String(user.name || email).trim() || email;

    const writeHeartbeat = () => {
      const nextRecords = loadPresenceRecords();
      nextRecords[email] = {
        email,
        name,
        route: window.location.pathname,
        lastSeenAt: Date.now(),
      };
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(nextRecords));
      setRecords(nextRecords);
    };

    writeHeartbeat();
    const interval = setInterval(writeHeartbeat, 15_000);
    const onFocus = () => writeHeartbeat();
    const onVisibility = () => writeHeartbeat();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  const setMyAvailability = (value) => {
    if (!user?.email) return;
    const email = String(user.email).trim().toLowerCase();
    const safe = value === "away" || value === "dnd" ? value : "online";
    const next = { ...availabilityMap, [email]: safe };
    setAvailabilityMap(next);
    localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(next));
  };

  const presenceList = useMemo(() => {
    const members = loadWorkspaceMembers();
    return members.map((member) => {
      const email = String(member.email || "").trim().toLowerCase();
      const record = records[email] || null;
      const availability = availabilityMap[email] || "online";
      const status = resolveStatus(record?.lastSeenAt, availability);
      return {
        memberId: member.id,
        name: member.name,
        email,
        role: member.role,
        route: record?.route || "-",
        availability,
        status,
        lastSeenAt: record?.lastSeenAt || null,
        lastSeenLabel: formatLastSeen(record?.lastSeenAt),
      };
    });
  }, [records, availabilityMap]);

  const summary = useMemo(
    () => ({
      online: presenceList.filter((item) => item.status === "online").length,
      away: presenceList.filter((item) => item.status === "away").length,
      dnd: presenceList.filter((item) => item.status === "dnd").length,
      offline: presenceList.filter((item) => item.status === "offline").length,
    }),
    [presenceList]
  );

  const myAvailability = user?.email
    ? availabilityMap[String(user.email).trim().toLowerCase()] || "online"
    : "online";

  return (
    <TeamPresenceContext.Provider
      value={{
        presenceList,
        summary,
        myAvailability,
        setMyAvailability,
      }}
    >
      {children}
    </TeamPresenceContext.Provider>
  );
}
