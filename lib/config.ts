/**
 * Application configuration constants.
 * 
 * Override these via environment variables in production.
 * Default values are provided for local development.
 */

/**
 * Whop experience slug used in redirects.
 * This is the URL slug that appears in /experiences/[slug] routes.
 */
export const WHOP_EXPERIENCE_SLUG = process.env.WHOP_EXPERIENCE_SLUG || "whalenet-2e";

/**
 * Whop store URL for subscription links.
 * Used in subscribe pages, FAQ, and activation pages.
 */
export const WHOP_STORE_URL = process.env.WHOP_STORE_URL || "https://whop.com/whalenet-2e/";
