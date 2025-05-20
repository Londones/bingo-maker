import { z } from "zod";

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

// Style Schema with conditional validation
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
    cellSize: z.number().int().positive(),
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

// Combined schema for validating style and stamp together with grid size
const bingoBaseSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    titleWidth: z.number().int().nonnegative().optional(),
    gridSize: z.number().int().positive(),
    status: z.enum(["draft", "published"]),
    cells: z.array(bingoCellSchema),
    style: styleSchema,
    background: backgroundSchema,
    stamp: stampSchema,
    authorToken: z.string().optional(),
    userId: z.string().optional(),
});

// Full Bingo Schema with conditional validation
export const bingoSchema = bingoBaseSchema.superRefine((data, ctx) => {
    // Apply the cell size validation based on grid size
    const maxCellSize = data.gridSize === 3 ? 350 : 200;
    if (data.style.cellSize > maxCellSize) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Cell size must not exceed ${maxCellSize} for grid size ${data.gridSize}`,
            path: ["style", "cellSize"],
        });
    }

    // Apply the stamp size validation based on grid size and cell size
    const maxStampSize = data.gridSize === 3 ? 330 : 180;
    const expectedStampSize = Math.min(data.style.cellSize - 20, maxStampSize);

    if (data.style.cellSize > maxCellSize && data.stamp.size !== expectedStampSize) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Stamp size should be ${expectedStampSize} for the current cell size and grid size`,
            path: ["stamp", "size"],
        });
    }
});

// Partial schemas for PATCH requests
export const styleUpdateSchema = styleSchema.partial();
export const backgroundUpdateSchema = backgroundSchema.partial();
export const stampUpdateSchema = stampSchema.partial();
export const bingoCellUpdateSchema = bingoCellSchema.partial();

// BingoPatch Schema with conditional validation
export const bingoPatchSchema = z
    .object({
        title: z.string().optional(),
        titleWidth: z.number().int().nonnegative().optional(),
        status: z.enum(["draft", "published"]).optional(),
        style: styleUpdateSchema.optional(),
        background: backgroundUpdateSchema.optional(),
        stamp: stampUpdateSchema.optional(),
        cells: z.array(bingoCellUpdateSchema).optional(),
        authorToken: z.string().optional(),
        gridSize: z.number().int().positive().optional(),
    })
    .superRefine((data, ctx) => {
        // Only validate if we have both gridSize and style.cellSize
        if (data.gridSize && data.style?.cellSize) {
            const maxCellSize = data.gridSize === 3 ? 350 : 200;
            if (data.style.cellSize > maxCellSize) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Cell size must not exceed ${maxCellSize} for grid size ${data.gridSize}`,
                    path: ["style", "cellSize"],
                });
            }
        }

        // Only validate stamp size if we have all the necessary data
        if (data.gridSize && data.style?.cellSize && data.stamp?.size) {
            const maxStampSize = data.gridSize === 3 ? 330 : 180;
            const expectedStampSize = Math.min(data.style.cellSize - 20, maxStampSize);

            if (data.style.cellSize > (data.gridSize === 3 ? 350 : 200) && data.stamp.size !== expectedStampSize) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Stamp size should be ${expectedStampSize} for the current cell size and grid size`,
                    path: ["stamp", "size"],
                });
            }
        }
    });
