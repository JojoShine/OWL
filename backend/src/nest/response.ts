export function success(data: unknown, message: string) {
  // pg / Sequelize serialize BIGINT identifiers as strings. Keep that API contract.
  return { success: true, message, data: JSON.parse(JSON.stringify(data, (_, value) => typeof value === 'bigint' ? value.toString() : value)), timestamp: new Date().toISOString() };
}
