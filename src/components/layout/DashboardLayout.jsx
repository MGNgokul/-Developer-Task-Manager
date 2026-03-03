import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastStack from "../ui/ToastStack";

function DashboardLayout() {
  const { pathname } = useLocation();
  const showSidebar =
    pathname === "/dashboard" ||
    pathname === "/analytics" ||
    pathname === "/notifications" ||
    pathname === "/settings" ||
    pathname === "/profile" ||
    pathname.startsWith("/tasks");

  return (
    <div className="app-container">
      <Header />
      <ToastStack />
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
