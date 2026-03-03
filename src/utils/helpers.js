export function formatShortDate(dateInput) {
  if (!dateInput) return "No due date";
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
