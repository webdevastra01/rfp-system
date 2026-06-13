import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
  {
    protocol: 'https',
    hostname: 'gasrncdfxphcxiwjevzl.supabase.co',
    pathname: '/storage/v1/object/sign/**',
  },
  {
    protocol: 'https',
    hostname: 'gasrncdfxphcxiwjevzl.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
]
  },
};

export default nextConfig;
