import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  async headers() {
    const scriptSources = [
      "'self'",
      "'unsafe-inline'",
      ...(!isProduction ? ["'unsafe-eval'"] : []),
      "https://accounts.google.com",
      "https://checkout.razorpay.com",
    ];
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "frame-ancestors 'self'",
          "form-action 'self'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "style-src 'self' 'unsafe-inline'",
          `script-src ${scriptSources.join(" ")}`,
          "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
          "frame-src https://accounts.google.com https://api.razorpay.com https://checkout.razorpay.com",
          "object-src 'none'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), payment=(self), geolocation=(self)",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
