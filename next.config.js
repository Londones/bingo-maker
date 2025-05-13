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
    // Add experimental configuration to increase the server actions body size limit
    experimental: {
        serverActions: {
            bodySizeLimit: "4mb", // Increase to 4MB which should be enough for most image uploads
        },
    },
};

module.exports = nextConfig;
