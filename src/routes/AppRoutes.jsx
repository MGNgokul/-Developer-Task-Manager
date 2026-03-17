import { Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ScrollToTop from "../components/layout/ScrollToTop";
import AuthLayout from "../components/auth/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import Tasks from "../pages/Tasks";
import TasksFormPage from "../pages/TasksFormPage";
import TasksFilterPage from "../pages/TasksFilterPage";
import TasksKanbanPage from "../pages/TasksKanbanPage";
import TasksCardsPage from "../pages/TasksCardsPage";
import Analytics from "../pages/Analytics";
import Profile from "../pages/Profile";
import Notifications from "../pages/Notifications";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import Landing from "../pages/Landing";
import Calendar from "../pages/Calendar";
import Team from "../pages/Team";
import Automation from "../pages/Automation";
import Goals from "../pages/Goals";
import RiskRegister from "../pages/RiskRegister";
import ClientPortal from "../pages/ClientPortal";

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/form" element={<TasksFormPage />} />
            <Route path="/tasks/filter" element={<TasksFilterPage />} />
            <Route path="/tasks/kanban" element={<TasksKanbanPage />} />
            <Route path="/tasks/cards" element={<TasksCardsPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/team" element={<Team />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/risk-register" element={<RiskRegister />} />
            <Route path="/client-portal" element={<ClientPortal />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
