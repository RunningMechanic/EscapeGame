// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["https://localhost:3000", "*"], // すべてのオリジンを許可
  async headers() {
    return [

      {
        source: "/:path*", // すべてのルートに適用
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // 必要に応じて "*" を特定のオリジンに変更
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  experimental: {
    middleware: true, // ミドルウェアを有効化
  },
};

module.exports = nextConfig