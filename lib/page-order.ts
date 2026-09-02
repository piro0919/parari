// The author never says what order the pages go in; the file names already do.
// Numeric collation is the whole point: plain string order puts 10 before 2,
// which silently reorders a comic.
export function orderPages<T extends { name: string; type: string }>(
  files: readonly T[],
): T[] {
  return files
    .filter((file) => file.type.startsWith("image/"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
