/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // 정적 내보내기 시 필수
  },
};

export default nextConfig;