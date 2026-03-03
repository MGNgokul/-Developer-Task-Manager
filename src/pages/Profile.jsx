import { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "Team Member",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initials = (form.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const stats = useMemo(() => {
    try {
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const total = tasks.length;
      const completed = tasks.filter((task) => task.status === "done").length;
      return { total, completed };
    } catch {
      return { total: 0, completed: 0 };
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    const registeredUser = JSON.parse(localStorage.getItem("registeredUser")) || {};

    const updatedUser = {
      ...currentUser,
      ...form,
      name,
      email,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    if (registeredUser.email === currentUser.email) {
      localStorage.setItem(
        "registeredUser",
        JSON.stringify({ ...registeredUser, name, email })
      );
    }

    setMessage("Profile updated successfully.");
  };

  return (
    <div className="profile-page">
      <motion.section
        className="profile-header glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-heading">
          <span className="profile-avatar" aria-hidden="true">
            <span className="profile-avatar-initials">{initials || "U"}</span>
            <span className="profile-avatar-status"></span>
          </span>
          <div>
            <h2>User Profile</h2>
            <p>Manage personal details and keep account data up to date.</p>
          </div>
        </div>
      </motion.section>

      {user && (
        <div className="profile-grid">
          <motion.form
            className="profile-card glass-card"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Edit Details</h3>

            <label>
              Full Name
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={60}
              />
            </label>

            <label>
              Email
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>

            <label>
              Role
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="Team Member">Team Member</option>
                <option value="Project Lead">Project Lead</option>
                <option value="Manager">Manager</option>
              </select>
            </label>

            <button className="btn" type="submit">
              Save Changes
            </button>
            {error && <p className="error">{error}</p>}
            {message && <p className="success-msg">{message}</p>}
          </motion.form>

          <motion.aside
            className="profile-card glass-card"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3>Account Snapshot</h3>
            <p><strong>Name:</strong> {form.name || "-"}</p>
            <p><strong>Email:</strong> {form.email || "-"}</p>
            <p><strong>Role:</strong> {form.role}</p>
            <p><strong>Total Tasks:</strong> {stats.total}</p>
            <p><strong>Completed Tasks:</strong> {stats.completed}</p>

            <button type="button" className="btn-outline profile-logout" onClick={logout}>
              Logout
            </button>
          </motion.aside>
        </div>
      )}
    </div>
  );
}

export default Profile;
