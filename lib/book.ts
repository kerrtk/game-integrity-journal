/**
 * Single source of truth for the Unwhistled book — buy link, price, facts.
 * The book is live on Amazon. `amazonUrl` uses an ISBN search that resolves
 * to the product; swap it for the exact /dp/<ASIN> URL once confirmed and
 * every CTA across the site updates from here.
 */
export const BOOK = {
  amazonUrl: "https://www.amazon.com/s?k=9798187187621",
  paperback: "$9.99",
  kindle: "$4.99",
  isbn13: "979-8187187621",
} as const
