export function appendDedup<T>(base: T[], add: T[], key: (x: T) => string): T[] {
  const seen = new Set(base.map(key));
  const out = [...base];
  for (const x of add) {
    const k = key(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}
