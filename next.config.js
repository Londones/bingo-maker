// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "r6kb2iiay0.ufs.sh",
                port: "",
                search: "",
            },
            {
                protocol: "https",
                hostname: "uploadthing.com",
                port: "",
                search: "",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                port: "",
                search: "",
            },
        ],
    },
};

module.exports = nextConfig;
