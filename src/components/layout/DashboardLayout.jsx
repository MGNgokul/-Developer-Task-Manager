import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastStack from "../ui/ToastStack";
import QuickActions from "./QuickActions";

function DashboardLayout() {
  const { pathname } = useLocation();
  const showSidebar =
    pathname === "/dashboard" ||
    pathname === "/analytics" ||
    pathname === "/notifications" ||
    pathname === "/settings" ||
    pathname === "/profile" ||
    pathname === "/calendar" ||
    pathname === "/team" ||
    pathname === "/goals" ||
    pathname === "/automation" ||
    pathname === "/knowledge-base" ||
    pathname === "/risk-register" ||
    pathname === "/client-portal" ||
    pathname.startsWith("/tasks");

  return (
    <div className="app-container">
      <Header />
      <ToastStack />
      <QuickActions />
      <div className="main-layout">
        {showSidebar && <Sidebar />}
        <div className={`content ${showSidebar ? "" : "content-full"}`.trim()}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
