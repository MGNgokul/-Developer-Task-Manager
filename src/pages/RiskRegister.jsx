import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const KEY = "riskRegisterItems";

function loadRisks() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || [];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function RiskRegister() {
  const [risks, setRisks] = useState(loadRisks);
  const [draft, setDraft] = useState({
    title: "",
    impact: "medium",
    likelihood: "medium",
    mitigation: "",
  });

  const summary = useMemo(() => {
    return {
      high: risks.filter((item) => item.impact === "high" || item.likelihood === "high").length,
      open: risks.filter((item) => item.status === "open").length,
      mitigated: risks.filter((item) => item.status === "mitigated").length,
    };
  }, [risks]);

  const persist = (next) => {
    setRisks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addRisk = () => {
    const title = draft.title.trim();
    if (!title) return;
    const item = {
      id: crypto.randomUUID(),
      title,
      impact: draft.impact,
      likelihood: draft.likelihood,
      mitigation: draft.mitigation.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    persist([item, ...risks]);
    setDraft({ title: "", impact: "medium", likelihood: "medium", mitigation: "" });
  };

  const setStatus = (id, status) => {
    persist(risks.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const removeRisk = (id) => {
    persist(risks.filter((item) => item.id !== id));
  };

  return (
    <div className="analytics-page risk-page">
      <motion.section
        className="analytics-header glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Risk Register</h2>
        <p>Identify, classify, and mitigate delivery risks before they become blockers.</p>
      </motion.section>

      <section className="analytics-grid">
        <article className="glass-card analytics-card">
          <h3>Add Risk</h3>
          <label className="settings-toggle settings-toggle--stack">
            <span>Risk title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Vendor API instability"
            />
          </label>
          <label className="settings-toggle">
            <span>Impact</span>
            <select
              value={draft.impact}
              onChange={(e) => setDraft((prev) => ({ ...prev, impact: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="settings-toggle">
            <span>Likelihood</span>
            <select
              value={draft.likelihood}
              onChange={(e) => setDraft((prev) => ({ ...prev, likelihood: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <textarea
            rows={4}
            value={draft.mitigation}
            onChange={(e) => setDraft((prev) => ({ ...prev, mitigation: e.target.value }))}
            placeholder="Mitigation plan..."
          />
          <button type="button" className="btn" onClick={addRisk}>
            Add Risk
          </button>
        </article>

        <article className="glass-card analytics-card">
          <h3>Risk Snapshot</h3>
          <ul className="section-list">
            <li>High-severity risks: {summary.high}</li>
            <li>Open risks: {summary.open}</li>
            <li>Mitigated risks: {summary.mitigated}</li>
          </ul>
        </article>
      </section>

      <section className="glass-card">
        <h3>Register</h3>
        <div className="dashboard-list">
          {risks.map((risk) => (
            <article key={risk.id} className="dashboard-list-item">
              <div>
                <strong>{risk.title}</strong>
                <p>
                  Impact: {risk.impact} | Likelihood: {risk.likelihood}
                </p>
                {risk.mitigation && <p>{risk.mitigation}</p>}
              </div>
              <div className="settings-row">
                <select value={risk.status} onChange={(e) => setStatus(risk.id, e.target.value)}>
                  <option value="open">Open</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="mitigated">Mitigated</option>
                </select>
                <button type="button" className="btn-outline" onClick={() => removeRisk(risk.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
          {risks.length === 0 && <p className="kanban-empty">No risk records yet.</p>}
        </div>
      </section>
    </div>
  );
}

export default RiskRegister;
