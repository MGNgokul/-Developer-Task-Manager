import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastStack from "../ui/ToastStack";
import QuickActions from "./QuickActions";
import MobileBottomNav from "./MobileBottomNav";

function DashboardLayout() {
  const { pathname } = useLocation();
  const showMobileBottomNav = true;
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
    <div className={`app-container ${showMobileBottomNav ? "app-container--bottom-nav" : ""}`.trim()}>
      <Header />
      <ToastStack />
      <QuickActions />
      <div className="main-layout">
        {showSidebar && <Sidebar />}
        <div className={`content ${showSidebar ? "" : "content-full"}`.trim()}>
          <Outlet />
        </div>
      </div>
      {showMobileBottomNav && <MobileBottomNav />}
    </div>
  );
}

export default DashboardLayout;
