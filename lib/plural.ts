// The cards are in latin, so "1 pages" would show.
export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
