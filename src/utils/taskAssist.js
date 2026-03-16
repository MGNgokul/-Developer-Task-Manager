const HIGH_PRIORITY_KEYWORDS = [
  "urgent",
  "critical",
  "blocker",
  "incident",
  "outage",
  "production",
  "security",
];

const LOW_PRIORITY_KEYWORDS = [
  "cleanup",
  "polish",
  "refactor",
  "docs",
  "documentation",
  "nice to have",
];

const ACTION_VERBS = [
  "build",
  "create",
  "fix",
  "update",
  "review",
  "test",
  "deploy",
  "plan",
  "write",
  "optimize",
  "investigate",
];

function getDaysUntil(dateInput) {
  if (!dateInput) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  return Math.floor((due - today) / (1000 * 60 * 60 * 24));
}

function inferPriority({ title, description, dueDate, dependencies }) {
  const text = `${title} ${description}`.toLowerCase();
  const days = getDaysUntil(dueDate);
  const hasHighKeyword = HIGH_PRIORITY_KEYWORDS.some((word) => text.includes(word));
  const hasLowKeyword = LOW_PRIORITY_KEYWORDS.some((word) => text.includes(word));

  if (hasHighKeyword) return "high";
  if (days !== null && days <= 1) return "high";
  if (days !== null && days <= 3) return "medium";
  if (hasLowKeyword && (!dependencies || dependencies.length === 0)) return "low";
  return "medium";
}

export function getTaskAssistInsights({
  title = "",
  description = "",
  dueDate = "",
  subtasks = [],
  dependencies = [],
  priority = "medium",
}) {
  const normalizedTitle = String(title || "").trim();
  const normalizedDescription = String(description || "").trim();
  const hints = [];

  let score = 100;
  if (normalizedTitle.length < 6) {
    hints.push("Use a more specific title (at least 6 characters).");
    score -= 20;
  }
  if (normalizedTitle.length > 60) {
    hints.push("Shorten title to improve scanability.");
    score -= 15;
  }
  if (normalizedDescription.length > 0 && normalizedDescription.length < 20) {
    hints.push("Description is short; include scope or acceptance criteria.");
    score -= 8;
  }
  if (subtasks.length === 0) {
    hints.push("Add at least one checklist item for execution clarity.");
    score -= 10;
  }
  if (!dueDate) {
    hints.push("Set a due date to make this task schedulable.");
    score -= 12;
  }
  if (dependencies.length > 2) {
    hints.push("Many dependencies detected; consider splitting this task.");
    score -= 8;
  }

  const firstWord = normalizedTitle.split(/\s+/)[0]?.toLowerCase() || "";
  if (firstWord && !ACTION_VERBS.includes(firstWord)) {
    hints.push("Start title with an action verb (e.g., Fix, Build, Review).");
    score -= 7;
  }

  const suggestedPriority = inferPriority({
    title: normalizedTitle,
    description: normalizedDescription,
    dueDate,
    dependencies,
  });

  if (priority !== suggestedPriority) {
    hints.push(`Suggested priority: ${suggestedPriority}.`);
  }

  const clarityScore = Math.max(0, Math.min(100, score));

  return {
    clarityScore,
    hints,
    suggestedPriority,
  };
}
