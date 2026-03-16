import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";
import { loadWorkspaceMembers } from "../utils/workspace";
import useTeamPresence from "../hooks/useTeamPresence";

function Team() {
  const { tasks, stats } = useContext(TaskContext);
  const { presenceList, summary, myAvailability, setMyAvailability } = useTeamPresence();
  const members = useMemo(() => loadWorkspaceMembers(), []);
  const workloadMap = useMemo(
    () =>
      new Map((stats.memberWorkload || []).map((item) => [item.memberId, item])),
    [stats.memberWorkload]
  );

  const cards = useMemo(
    () =>
      members.map((member) => {
        const assigned = tasks.filter((task) => task.assigneeId === member.id);
        const open = assigned.filter((task) => task.status !== "done").length;
        const done = assigned.filter((task) => task.status === "done").length;
        const workload = workloadMap.get(member.id);
        return {
          ...member,
          open,
          done,
          utilization: workload?.utilization ?? 0,
          capacity: workload?.capacity ?? 0,
          planned: workload?.estimatedHours ?? 0,
          overloaded: workload?.overloaded ?? false,
        };
      }),
    [members, tasks, workloadMap]
  );

  return (
    <div className="profile-page team-page">
      <motion.section
        className="glass-card profile-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Team Workspace</h2>
        <p>Track owner workload, execution pace, and assignment health in one place.</p>
      </motion.section>

      <section className="profile-grid team-grid">
        {cards.map((member) => (
          <article key={member.id} className="glass-card team-card">
            <div className="team-card-head">
              <h3>{member.name}</h3>
              <span className={`priority ${member.overloaded ? "high" : "low"}`}>
                {member.role}
              </span>
            </div>
            <p className="analytics-note">{member.email}</p>
            <ul className="section-list">
              <li>Open tasks: {member.open}</li>
              <li>Completed: {member.done}</li>
              <li>Utilization: {member.utilization}%</li>
              <li>
                Planned vs capacity: {member.planned}h / {member.capacity}h
              </li>
            </ul>
          </article>
        ))}
      </section>

      <section className="glass-card">
        <div className="team-card-head">
          <h3>Live Presence</h3>
          <label className="settings-toggle">
            <span>My availability</span>
            <select value={myAvailability} onChange={(e) => setMyAvailability(e.target.value)}>
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="dnd">Do Not Disturb</option>
            </select>
          </label>
        </div>
        <p className="dashboard-subtitle">
          Online: {summary.online} | Away: {summary.away} | DND: {summary.dnd} | Offline: {summary.offline}
        </p>
        <div className="dashboard-list">
          {presenceList.map((item) => (
            <article key={item.email} className="dashboard-list-item">
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.role} | Last seen: {item.lastSeenLabel}
                </p>
                <p>Route: {item.route}</p>
              </div>
              <span className={`presence-pill presence-pill--${item.status}`}>{item.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card team-footer">
        <h3>Workload Risk</h3>
        <p className="dashboard-subtitle">
          {stats.overloadedMembers} member(s) are currently above weekly capacity.
        </p>
        <Link to="/settings" className="filter-btn">
          Manage Team Capacity
        </Link>
      </section>
    </div>
  );
}

export default Team;
