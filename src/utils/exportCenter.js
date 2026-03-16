function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function tasksToCsv(tasks = []) {
  const headers = [
    "id",
    "title",
    "status",
    "priority",
    "assigneeId",
    "dueDate",
    "recurrence",
    "trackedSeconds",
    "createdAt",
    "completedAt",
    "description",
  ];

  const rows = (Array.isArray(tasks) ? tasks : []).map((task) =>
    [
      task.id,
      task.title,
      task.status,
      task.priority,
      task.assigneeId || "",
      task.dueDate || "",
      task.recurrence || "none",
      Number(task.trackedSeconds || 0),
      task.createdAt || "",
      task.completedAt || "",
      task.description || "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function buildSummaryReport(tasks = [], stats = {}) {
  const now = new Date();
  const completed = tasks.filter((task) => task.status === "done");
  const overdue = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    return new Date(`${task.dueDate}T00:00:00`) < new Date(now.toDateString());
  });

  return JSON.stringify(
    {
      generatedAt: now.toISOString(),
      totals: {
        total: stats.total ?? tasks.length,
        completed: stats.completed ?? completed.length,
        pending: stats.pending ?? Math.max(0, tasks.length - completed.length),
        overdue: stats.overdue ?? overdue.length,
      },
      performance: {
        completionRate: stats.progress ?? 0,
        onTimeRate: stats.onTimeRate ?? 0,
        focusScore: stats.focusScore ?? 0,
        weeklyGoalProgress: stats.weeklyGoalProgress ?? 0,
      },
    },
    null,
    2
  );
}

export function downloadTextFile(filename, content, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
