import { randomBytes } from "crypto";

export const generateAuthorToken = () => {
    return randomBytes(32).toString("hex");
};
