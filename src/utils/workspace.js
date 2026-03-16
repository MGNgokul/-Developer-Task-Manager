export const WORKSPACE_MEMBERS_KEY = "workspaceMembers";

const VALID_ROLES = ["owner", "admin", "member"];

function normalizeMember(member) {
  const name = String(member?.name || "").trim();
  const email = String(member?.email || "").trim().toLowerCase();
  const role = VALID_ROLES.includes(member?.role) ? member.role : "member";
  if (!name || !email) return null;

  return {
    id: member?.id || crypto.randomUUID(),
    name,
    email,
    role,
  };
}

export function loadWorkspaceMembers() {
  try {
    const saved = JSON.parse(localStorage.getItem(WORKSPACE_MEMBERS_KEY)) || [];
    if (!Array.isArray(saved)) return [];
    return saved.map(normalizeMember).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveWorkspaceMembers(members) {
  const normalized = Array.isArray(members) ? members.map(normalizeMember).filter(Boolean) : [];
  localStorage.setItem(WORKSPACE_MEMBERS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("workspace-members-updated"));
  return normalized;
}

export function ensureWorkspaceSeed(user) {
  const existing = loadWorkspaceMembers();
  if (existing.length > 0) return existing;

  const fallbackName = String(user?.name || "Workspace Owner").trim();
  const fallbackEmail = String(user?.email || "owner@devtask.local").trim().toLowerCase();
  return saveWorkspaceMembers([
    {
      id: crypto.randomUUID(),
      name: fallbackName,
      email: fallbackEmail,
      role: "owner",
    },
  ]);
}

export function getRoleOptions() {
  return [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "member", label: "Member" },
  ];
}
