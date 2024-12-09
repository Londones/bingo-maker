// import dotenv from "dotenv";
// import { loadEnvConfig } from "@next/env";
// import "@testing-library/jest-dom";

// const path: string = ".env.test";

// // Load env vars from .env.test
// dotenv.config({ path: path });

// // Load Next.js env vars
// const projectDir = process.cwd();
// const result = loadEnvConfig(projectDir, true, console);

// // Combine all env vars
// process.env = {
//     ...process.env,
//     ...result.combinedEnv,
// };

// // Validate required env vars
// const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"];

// requiredEnvVars.forEach((envVar) => {
//     if (!process.env[envVar]) {
//         throw new Error(`Missing required environment variable: ${envVar}`);
//     }
// });
