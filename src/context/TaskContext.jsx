import { createContext, useMemo } from "react";
import useTasks from "../hooks/useTasks";

export const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const taskState = useTasks();
  const value = useMemo(() => taskState, [taskState]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
