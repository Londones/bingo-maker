import { z } from "zod";

export const signUpSchema = z.object({
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    username: z.string({ required_error: "Username is required" }),
    password: z
        .string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password must be at most 32 characters"),
});

export const signInSchema = z.object({
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z.string({ required_error: "Password is required" }),
});

// Cell Style Schema
export const cellStyleSchema = z.object({
    color: z.string().nullable().optional(),
    fontSize: z.number().nullable().optional(),
    fontFamily: z.string().nullable().optional(),
    fontWeight: z.string().nullable().optional(),
    fontStyle: z.string().nullable().optional(),
    cellBorderColor: z.string().nullable().optional(),
    cellBorderWidth: z.number().nullable().optional(),
    cellBackgroundColor: z.string().nullable().optional(),
    cellBackgroundImage: z.string().nullable().optional(),
    cellBackgroundOpacity: z.number().nullable().optional(),
    cellBackgroundImageOpacity: z.number().nullable().optional(),
    cellBackgroundImagePosition: z.string().nullable().optional(),
    cellBackgroundImageSize: z.number().nullable().optional(),
});

// Bingo Cell Schema
export const bingoCellSchema = z.object({
    id: z.string().optional(),
    content: z.string(),
    position: z.number().int().nonnegative(),
    validated: z.boolean(),
    cellStyle: cellStyleSchema.nullable().optional(),
});

// Style Schema
export const styleSchema = z.object({
    fontSize: z.number().int().positive(),
    fontFamily: z.string(),
    fontWeight: z.string(),
    fontStyle: z.string(),
    cellBorderColor: z.string(),
    cellBorderWidth: z.number().int().nonnegative(),
    cellBackgroundColor: z.string(),
    cellBackgroundOpacity: z.number().int().min(0).max(100),
    color: z.string(),
    cellSize: z
        .number()
        .int()
        .positive()
        .refine((value) => value >= 100, { message: "Cell size must be at least 100" }),
    gap: z.number().int().nonnegative(),
});

// Background Schema
export const backgroundSchema = z.object({
    value: z.string(),
    backgroundImage: z.string().nullable().optional(),
    backgroundImageOpacity: z.number().nullable().optional(),
    backgroundImagePosition: z.string().nullable().optional(),
    backgroundImageSize: z.number().nullable().optional(),
});

// Stamp Schema
export const stampSchema = z.object({
    type: z.enum(["text", "image"]),
    value: z.string(),
    size: z.number().int().positive(),
    opacity: z.number().min(0).max(1),
});

// Full Bingo Schema with grid size and cell size validation
export const bingoSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    titleWidth: z.number().int().positive().optional(),
    gridSize: z.number().int().positive(),
    status: z.enum(["draft", "published"]),
    cells: z.array(bingoCellSchema),
    style: styleSchema,
    background: backgroundSchema,
    stamp: stampSchema,
    authorToken: z.string().optional(),
    userId: z.string().optional(),
});

// Partial schemas for PATCH requests
export const styleUpdateSchema = styleSchema.partial();

export const backgroundUpdateSchema = backgroundSchema.partial();

export const stampUpdateSchema = stampSchema.partial();

export const bingoCellUpdateSchema = bingoCellSchema.partial();

// BingoPatch Schema
export const bingoPatchSchema = z.object({
    title: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    style: styleUpdateSchema.optional(),
    background: backgroundUpdateSchema.optional(),
    stamp: stampUpdateSchema.optional(),
    gridSize: z.number().int().positive().optional(),
    cells: z.array(bingoCellUpdateSchema).optional(),
    authorToken: z.string().optional(),
});
