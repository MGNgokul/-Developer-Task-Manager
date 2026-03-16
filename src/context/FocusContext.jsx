import { createContext, useMemo } from "react";
import useFocusMode from "../hooks/useFocusMode";

export const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const focusState = useFocusMode();
  const value = useMemo(() => focusState, [focusState]);
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}
