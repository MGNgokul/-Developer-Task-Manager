import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TaskProvider } from "./context/TaskContext";
import { NotificationProvider } from "./context/NotificationContext";
import { FocusProvider } from "./context/FocusContext";
import { TeamPresenceProvider } from "./context/TeamPresenceContext";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

registerServiceWorker();

const resolveBasename = () => {
  const base = import.meta.env.BASE_URL || "/";
  if (base !== "/") return base;
  if (window.location.pathname.startsWith("/-Developer-Task-Manager/")) {
    return "/-Developer-Task-Manager";
  }
  return "/";
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <TeamPresenceProvider>
            <FocusProvider>
              <NotificationProvider>
                <BrowserRouter
                  basename={resolveBasename()}
                  future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
                >
                  <App />
                </BrowserRouter>
              </NotificationProvider>
            </FocusProvider>
          </TeamPresenceProvider>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

