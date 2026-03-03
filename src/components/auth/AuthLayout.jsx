import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

function AuthLayout({ children }) {
  return (
    <div className="center-page auth-page">
      <motion.div
        className="auth-bg-shape auth-bg-shape-1"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="auth-bg-shape auth-bg-shape-2"
        animate={{ y: [0, 24, 0], x: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {children || <Outlet />}
    </div>
  );
}

export default AuthLayout;
