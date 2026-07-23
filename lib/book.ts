/**
 * Single source of truth for the Unwhistled book — buy link, price, facts.
 * The book is live on Amazon; every CTA across the site reads from here.
 */
export const BOOK = {
  amazonUrl: "https://www.amazon.com/dp/B0H9JRTQNT",
  paperback: "$9.99",
  kindle: "$4.99",
  isbn13: "979-8187187621",
} as const
