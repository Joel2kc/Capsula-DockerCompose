import { z } from "zod";

export const capsuleSchema = z.object({
    message: z.string()
        .min(10, "Message must be at least 10 characters")
        .max(5000, "Message cannot exceed 5000 characters"),
    unlockDate: z.date()
        .min(new Date(Date.now() + 2 * 60 * 1000), "Unlock date must be at least 2 minutes in the future"),
    file: z.any()
        .refine((file) => !file || file.size <= 50 * 1024 * 1024, `Max file size is 50MB.`)
        .refine(
            (file) => !file || ["image/jpeg", "image/jpg", "image/png", "image/gif", "video/mp4"].includes(file.type),
            "Only .jpeg, .jpg, .png, .gif, and .mp4 formats are supported."
        )
        .optional(),
});