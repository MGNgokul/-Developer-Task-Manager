import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const KEY = "clientPortalUpdates";

function loadUpdates() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || [];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function ClientPortal() {
  const [updates, setUpdates] = useState(loadUpdates);
  const [draft, setDraft] = useState({
    client: "",
    summary: "",
    status: "on-track",
  });
  const [errors, setErrors] = useState({});

  const grouped = useMemo(() => {
    return updates.reduce((map, item) => {
      const key = item.client || "Unknown Client";
      if (!map[key]) map[key] = [];
      map[key].push(item);
      return map;
    }, {});
  }, [updates]);

  const persist = (next) => {
    setUpdates(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addUpdate = () => {
    const client = draft.client.trim();
    const summary = draft.summary.trim();
    const nextErrors = {};
    if (!client) {
      nextErrors.client = "Client name is required.";
    }
    if (!summary) {
      nextErrors.summary = "Summary is required.";
    } else if (summary.length < 10) {
      nextErrors.summary = "Summary should be at least 10 characters.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const item = {
      id: crypto.randomUUID(),
      client,
      summary,
      status: draft.status,
      createdAt: new Date().toISOString(),
    };
    setErrors({});
    persist([item, ...updates]);
    setDraft({ client: "", summary: "", status: "on-track" });
  };

  const removeUpdate = (id) => {
    persist(updates.filter((item) => item.id !== id));
  };

  return (
    <div className="profile-page client-page">
      <motion.section
        className="profile-header glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Client Portal</h2>
        <p>Prepare structured client updates and track account delivery status.</p>
      </motion.section>

      <section className="profile-grid">
        <article className="glass-card profile-card">
          <h3>New Update</h3>
          <label>
            Client
            <input
              type="text"
              value={draft.client}
              onChange={(e) => {
                const next = e.target.value;
                setDraft((prev) => ({ ...prev, client: next }));
                if (errors.client && next.trim()) {
                  setErrors((prev) => ({ ...prev, client: "" }));
                }
              }}
              placeholder="Acme Corp"
              className={errors.client ? "input-error" : ""}
            />
          </label>
          {errors.client && <p className="error">{errors.client}</p>}
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="on-track">On Track</option>
              <option value="attention">Needs Attention</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label>
            Summary
            <textarea
              rows={5}
              value={draft.summary}
              onChange={(e) => {
                const next = e.target.value;
                setDraft((prev) => ({ ...prev, summary: next }));
                if (errors.summary && next.trim().length >= 10) {
                  setErrors((prev) => ({ ...prev, summary: "" }));
                }
              }}
              placeholder="Delivery summary for this client..."
              className={errors.summary ? "input-error" : ""}
            />
          </label>
          {errors.summary && <p className="error">{errors.summary}</p>}
          <button type="button" className="btn" onClick={addUpdate}>
            Publish Update
          </button>
        </article>

        <article className="glass-card profile-card">
          <h3>Client Streams</h3>
          <div className="client-groups">
            {Object.entries(grouped).map(([client, items]) => (
              <article key={client} className="backup-item">
                <strong>{client}</strong>
                <p>{items.length} update(s)</p>
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="client-update-row">
                    <span className={`priority ${item.status === "on-track" ? "low" : item.status === "attention" ? "medium" : "high"}`}>
                      {item.status}
                    </span>
                    <p>{item.summary}</p>
                    <button type="button" className="btn-outline" onClick={() => removeUpdate(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </article>
            ))}
            {updates.length === 0 && <p className="settings-note">No client updates yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

export default ClientPortal;
