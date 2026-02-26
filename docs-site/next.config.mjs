import nextra from 'nextra'

const withNextra = nextra({})

const isProduction = process.env.NODE_ENV === 'production'
const basePath = isProduction ? '/nexis' : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined
}

export default withNextra(nextConfig)
