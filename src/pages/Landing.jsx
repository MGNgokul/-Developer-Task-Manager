import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const featureItems = [
  {
    title: "Smart Task Tracking",
    description: "Create, manage and update tasks effortlessly.",
  },
  {
    title: "Real-time Analytics",
    description: "Track your productivity with visual insights.",
  },
  {
    title: "Dark & Light Mode",
    description: "Switch themes seamlessly anytime.",
  },
];

const statItems = [
  { value: "10K+", label: "Active Users" },
  { value: "120K+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime" },
];

const revealContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.15,
    },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function Landing() {
  return (
    <div className="landing-wrapper">
      <div className="landing-grid-overlay"></div>

      {/* Background Blobs */}
      <div className="bg-blob blob1"></div>
      <div className="bg-blob blob2"></div>

      {/* HERO */}
      <section className="hero">
        <motion.div
          className="hero-left"
          variants={revealContainer}
          initial="hidden"
          animate="show"
        >
          <motion.span className="hero-kicker" variants={revealItem}>
            Advanced workflow platform
          </motion.span>

          <motion.h1 variants={revealItem}>
            Organize Work. <br />
            <span>Boost Productivity.</span>
          </motion.h1>

          <motion.p variants={revealItem}>
            DevTask Pro is a modern task management dashboard built
            for teams and individuals who want clarity and performance.
          </motion.p>

          <motion.div className="hero-buttons" variants={revealItem}>
            <Link to="/login">
              <button className="btn-primary">Start Free</button>
            </Link>

            <Link to="/login">
              <button className="btn-outline">Login</button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-right"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <motion.div
            className="preview-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="dashboard-preview glass-card"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.03, rotateX: 2, rotateY: -2 }}
          >
            <h3>Productivity Preview</h3>
            <div className="preview-stats">
              <div>
                <strong>32</strong>
                <span>Tasks</span>
              </div>
              <div>
                <strong>18</strong>
                <span>Completed</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Pending</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Powerful Features</h2>

        <motion.div
          className="features-grid"
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {featureItems.map((item) => (
            <motion.div
              key={item.title}
              variants={revealItem}
              whileHover={{ scale: 1.04, y: -6 }}
              className="feature-card glass-card"
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <motion.div
          className="stats-grid"
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {statItems.map((item) => (
            <motion.div key={item.label} className="stats-tile glass-card" variants={revealItem}>
              <h2>{item.value}</h2>
              <p>{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <motion.section
        className="cta"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Ready to Take Control of Your Work?</h2>
        <Link to="/register">
          <motion.button
            className="btn-primary large-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Get Started Now
          </motion.button>
        </Link>
      </motion.section>

    </div>
  );
}

export default Landing;
