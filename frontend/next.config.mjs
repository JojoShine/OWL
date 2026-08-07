/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境部署路径（从环境变量读取）
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // 静态资源前缀（生产环境）
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // 使用 standalone 输出（支持动态路由，适合 nginx 反向代理）
  output: 'standalone',

  // 安全响应头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },

  // 图片优化配置
  images: {
    unoptimized: true,
  },



  // 跳过类型检查（开发环境加快编译）
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },



  // 优化webpack配置（仅Turbopack不支持时使用）
  webpack: (config, { isServer, dev }) => {
    // 开发模式优化
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false, // 开发环境不压缩，加快编译
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 将大型库分离到单独的chunk
            reactVendor: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // 其他第三方库
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 9,
              reuseExistingChunk: true,
              enforce: true,
            },
            // 共享的组件和工具
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // 开发环境快速刷新优化
  reactStrictMode: false, // 关闭严格模式（开发时会触发双重渲染）
};

export default nextConfig;
