export function employeeDisplayName(employeeName?: string | null, employeeId?: number | null, includeIdFallback = true) {
  const name = employeeName?.trim();
  if (name) return name;
  if (includeIdFallback && typeof employeeId === 'number' && Number.isFinite(employeeId) && employeeId > 0) return `Employee #${employeeId}`;
  return 'Not accepted yet';
}
