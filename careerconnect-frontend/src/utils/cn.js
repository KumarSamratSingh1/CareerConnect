/**
 * Utility function to combine CSS class names cleanly.
 * Filters out falsy values and joins with a space.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default cn;
