import { NavLink, useLocation } from "react-router-dom";

function MobileBottomNav() {
  const { pathname } = useLocation();
  const isTasks = pathname.startsWith("/tasks");
  const isAnalytics =
    pathname === "/analytics" || pathname === "/automation" || pathname === "/risk-register";
  const isSettings =
    pathname === "/settings" || pathname === "/profile" || pathname === "/notifications";
  const isDashboard =
    !isTasks &&
    !isAnalytics &&
    !isSettings &&
    (pathname === "/dashboard" ||
      pathname === "/calendar" ||
      pathname === "/team" ||
      pathname === "/goals" ||
      pathname === "/client-portal");

  const navClass = (isActive) =>
    (isActive ? "mobile-bottom-nav__item mobile-bottom-nav__item--active" : "mobile-bottom-nav__item");

  const activeGroup = isTasks ? "tasks" : isAnalytics ? "analytics" : isSettings ? "settings" : "dashboard";

  const stackLinks = {
    dashboard: [
      { to: "/team", label: "Team", active: pathname === "/team" },
      { to: "/goals", label: "Goals", active: pathname === "/goals" },
      { to: "/client-portal", label: "Client Portal", active: pathname === "/client-portal" },
      { to: "/dashboard", label: "Overview", active: pathname === "/dashboard" },
    ],
    tasks: [
      {
        to: "/tasks",
        label: "Workspace",
        active: pathname === "/tasks",
      },
      {
        to: "/tasks/form",
        label: "Task Form",
        active: pathname === "/tasks/form",
      },
      {
        to: "/tasks/filter",
        label: "Task Filter",
        active: pathname === "/tasks/filter",
      },
      {
        to: "/tasks/kanban",
        label: "Kanban",
        active: pathname === "/tasks/kanban",
      },
      {
        to: "/tasks/cards",
        label: "Task Cards",
        active: pathname === "/tasks/cards",
      },
    ],
    analytics: [
      { to: "/analytics", label: "Analytics", active: pathname === "/analytics" },
      { to: "/automation", label: "Automation", active: pathname === "/automation" },
      { to: "/risk-register", label: "Risk Register", active: pathname === "/risk-register" },
    ],
    settings: [
      { to: "/settings", label: "Settings", active: pathname === "/settings" },
    ],
  };

  const activeStack = stackLinks[activeGroup];

  return (
    <>
      <nav className="mobile-stack-nav" aria-label="Section navigation">
        {activeStack.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={link.active ? "mobile-stack-nav__item mobile-stack-nav__item--active" : "mobile-stack-nav__item"}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        <NavLink to="/dashboard" className={() => navClass(isDashboard)} end>
        <span className="mobile-bottom-nav__icon" aria-hidden="true">
          D
        </span>
        <span className="mobile-bottom-nav__label">Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={() => navClass(isTasks)}>
        <span className="mobile-bottom-nav__icon" aria-hidden="true">
          T
        </span>
        <span className="mobile-bottom-nav__label">Tasks</span>
        </NavLink>
        <NavLink to="/analytics" className={() => navClass(isAnalytics)} end>
        <span className="mobile-bottom-nav__icon" aria-hidden="true">
          A
        </span>
        <span className="mobile-bottom-nav__label">Analytics</span>
        </NavLink>
        <NavLink to="/settings" className={() => navClass(isSettings)} end>
        <span className="mobile-bottom-nav__icon" aria-hidden="true">
          S
        </span>
        <span className="mobile-bottom-nav__label">Settings</span>
        </NavLink>
      </nav>
    </>
  );
}

export default MobileBottomNav;
