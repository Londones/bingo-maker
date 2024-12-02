import { randomBytes } from "crypto";

export const generateAuthorToken = (): string => {
    return randomBytes(32).toString("hex");
};
