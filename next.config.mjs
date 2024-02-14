/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // now it breaks the imports in the static. fix
  assetPrefix: "./",
};

export default nextConfig;
