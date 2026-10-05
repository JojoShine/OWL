// Split trusted, checked-in PostgreSQL seed SQL without splitting string contents.
function splitSql(sql) {
  const statements = []; let start = 0, i = 0;
  while (i < sql.length) {
    const c = sql[i], next = sql[i + 1];
    if (c === "'" || c === '"') {
      const escaped = c === "'" && /\b[eE]$/.test(sql.slice(0, i)); i++;
      let closed = false;
      while (i < sql.length) {
        if (escaped && sql[i] === '\\') { i += 2; continue; }
        if (sql[i++] === c) { if (sql[i] === c) { i++; continue; } closed = true; break; }
      }
      if (!closed) throw new Error('Unterminated SQL string');
      continue;
    }
    if (c === '-' && next === '-') { const end = sql.indexOf('\n', i); i = end < 0 ? sql.length : end; continue; }
    if (c === '/' && next === '*') {
      i += 2; let depth = 1;
      while (i < sql.length && depth) {
        if (sql.slice(i,i+2) === '/*') { depth++; i += 2; }
        else if (sql.slice(i,i+2) === '*/') { depth--; i += 2; }
        else i++;
      }
      if (depth) throw new Error('Unterminated SQL comment');
      continue;
    }
    if (c === '$') {
      const tag = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
      if (tag) { const end = sql.indexOf(tag, i + tag.length); if (end < 0) throw new Error('Unterminated SQL body'); i = end + tag.length; continue; }
    }
    if (c === ';') { if (sql.slice(start,i).trim()) statements.push(sql.slice(start,i)); start = i + 1; }
    i++;
  }
  const last = sql.slice(start).trim(); if (last && !/^(?:--[^\n]*(?:\n|$)|\s)*$/.test(last)) statements.push(last);
  return statements;
}
module.exports = { splitSql };
