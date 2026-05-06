/**
 * Frontend configuration.
 *
 * Values are read from Vite environment variables (`VITE_*`) at build time.
 * Set them in a `.env` file at the frontend root before running `npm run build`.
 *
 * Example .env:
 *   VITE_SHOP_SLUG=flowery
 */

export const SHOP_SLUG: string =
  (import.meta.env.VITE_SHOP_SLUG as string) || 'flowery';
