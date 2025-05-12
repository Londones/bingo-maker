// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net",
                port: "",
                search: "",
            },
            {
                protocol: "https",
                hostname: "s3-starfire.s3.eu-west-3.amazonaws.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

module.exports = nextConfig;
