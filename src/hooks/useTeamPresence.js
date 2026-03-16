import { useContext } from "react";
import { TeamPresenceContext } from "../context/TeamPresenceContext";

export default function useTeamPresence() {
  const context = useContext(TeamPresenceContext);
  if (!context) {
    return {
      presenceList: [],
      summary: { online: 0, away: 0, dnd: 0, offline: 0 },
      myAvailability: "online",
      setMyAvailability: () => {},
    };
  }
  return context;
}
