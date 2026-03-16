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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <TeamPresenceProvider>
            <FocusProvider>
              <NotificationProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
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

