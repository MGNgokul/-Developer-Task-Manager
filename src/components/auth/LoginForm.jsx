import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const formContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const formItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const featureItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  const validate = () => {
    const errors = {};
    const email = form.email.trim();
    const password = form.password.trim();

    if (!email) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "Enter a valid email address";
    } else if (email.length > 120) {
      errors.email = "Email is too long";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.includes(" ")) {
      errors.password = "Password must not contain spaces";
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password = "Use 8+ chars with upper, lower, number and symbol";
    }

    return errors;
  };

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;
  const isLocked = Date.now() < lockUntil;
  const lockSeconds = Math.max(0, Math.ceil((lockUntil - tick) / 1000));

  useEffect(() => {
    if (!lockUntil) return undefined;
    const delay = lockUntil - Date.now();
    if (delay <= 0) {
      setLockUntil(0);
      setFailedAttempts(0);
      return undefined;
    }
    const timer = setTimeout(() => {
      setLockUntil(0);
      setFailedAttempts(0);
      setServerError("");
    }, delay);
    return () => clearTimeout(timer);
  }, [lockUntil]);

  useEffect(() => {
    if (!isLocked) return undefined;
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setServerError("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");

    if (hasErrors || isLocked) return;

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      login(form.email.trim(), form.password.trim());
      setFailedAttempts(0);
      setLockUntil(0);
      navigate("/dashboard");
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        const lockMs = Date.now() + 30_000;
        setLockUntil(lockMs);
        setTick(Date.now());
        setServerError("Too many failed attempts. Try again in 30 seconds.");
      } else {
        setServerError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="auth-card auth-card--login-premium"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.span
        className="auth-card-glow auth-card-glow-1"
        aria-hidden="true"
        animate={{ x: [0, 18, 0], y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="auth-card-glow auth-card-glow-2"
        aria-hidden="true"
        animate={{ x: [0, -16, 0], y: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="auth-form-flow" variants={formContainer} initial="hidden" animate="show">
        <motion.p className="login-kicker" variants={featureItem}>
          WORKSPACE LOGIN
        </motion.p>
        <motion.h2 variants={formItem}>Welcome back</motion.h2>
        <motion.p className="auth-subtitle" variants={formItem}>
          Sign in to continue to your dashboard.
        </motion.p>

        {serverError && (
          <motion.p
            className="error"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: [0, -6, 6, -4, 0] }}
            transition={{ duration: 0.35 }}
          >
            {serverError}
          </motion.p>
        )}

        <motion.div className="field-group" variants={formItem}>
          <label htmlFor="login-email" className="field-label">
            Email
          </label>
          <div className="input-shell">
            <span className="input-tag" aria-hidden="true">
              @
            </span>
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={touched.email && errors.email ? "input-error" : ""}
              maxLength={120}
              autoComplete="email"
            />
          </div>
          {touched.email && errors.email && <p className="error">{errors.email}</p>}
        </motion.div>

        <motion.div className="field-group" variants={formItem}>
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <div className="password-wrap input-shell">
            <span className="input-tag" aria-hidden="true">
              #
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              className={touched.password && errors.password ? "input-error" : ""}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={`toggle-password ${showPassword ? "toggle-password--showing" : "toggle-password--hidden"}`}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {touched.password && errors.password && <p className="error">{errors.password}</p>}
        </motion.div>

        <motion.div className="login-meta" variants={formItem}>
          <span>Attempt {Math.min(failedAttempts + 1, 5)} of 5</span>
          {isLocked ? <span className="lock-pill">Retry in {lockSeconds}s</span> : <span>Secure session</span>}
        </motion.div>

        <motion.button
          className="btn auth-submit-btn"
          type="submit"
          disabled={isSubmitting || hasErrors || isLocked}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          variants={formItem}
        >
          {isLocked ? `Locked (${lockSeconds}s)` : isSubmitting ? "Signing in..." : "Login"}
        </motion.button>

        <motion.div className="auth-bottom-link" variants={formItem}>
          <Link to="/" className="auth-back-btn">
            Back to Landing
          </Link>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}

export default LoginForm;
