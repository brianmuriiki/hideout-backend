import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  // MongoDB URI
  mongodbUri: process.env.MONGODB_URI || "",

  // JWT Secret
  jwtSecret:
    process.env.JWT_SECRET ||
    "hideout-creatives-default-secret-key-please-change-in-production-1234567890",

  // Google OAuth
  googleClientId:
    process.env.GOOGLE_CLIENT_ID ||
    "182385611527-9spuovpp98nusnrsvh9fnts3vl4pn4u6.apps.googleusercontent.com",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",

  // Allowed Admin Emails
  adminEmails: (process.env.ADMIN_EMAILS || "shadowhacktech@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  // Allowed Google Redirect URIs
  adminRedirectUris: (
    process.env.ADMIN_REDIRECT_URIS ||
    process.env.ADMIN_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    "https://hideout-creatives.vercel.app/admin/,https://hideout-creatives.vercel.app/admin,http://localhost:5173/admin/,http://localhost:5173/admin"
  )
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean),

  // CORS Origins
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    process.env.ALLOWED_ORIGINS ||
    process.env.ALLOWED_ORIGIN ||
    "https://hideout-creatives.vercel.app,http://localhost:5173,http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

/**
 * Checks if a redirect URI is allowed, comparing normalized URLs to prevent
 * trailing slash mismatches from blocking login.
 */
export function isRedirectUriAllowed(redirectUri) {
  if (!redirectUri || typeof redirectUri !== "string") return false;
  const normalize = (url) => url.trim().replace(/\/+$/, "").toLowerCase();
  const target = normalize(redirectUri);

  return config.adminRedirectUris.some(
    (allowed) => normalize(allowed) === target,
  );
}

/**
 * Checks if an email is allowlisted as an admin.
 */
export function isAdminEmail(email) {
  if (!email || typeof email !== "string") return false;
  return config.adminEmails.includes(email.trim().toLowerCase());
}

