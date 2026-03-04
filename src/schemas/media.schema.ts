
import { z } from "zod";

export const mediaSearchSchema = z.object({
  q: z.string().optional(),
  mediaType: z
    .enum(["image", "video", "audio"])
    .optional(),
  yearStart: z
    .string()
    .regex(/^\d{4}$/, "Must be a 4-digit year")
    .optional(),
  yearEnd: z
    .string()
    .regex(/^\d{4}$/, "Must be a 4-digit year")
    .optional(),
  keywords: z.string().optional(),
  page: z
    .string()
    .regex(/^\d+$/, "Must be a number")
    .optional(),
  pageSize: z
    .string()
    .regex(/^\d+$/, "Must be a number")
    .optional(),
});

export const nasaIdSchema = z.object({
  nasa_id: z.string().min(1, "NASA ID is required"),
});

export const yearSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "Must be a 4-digit year")
    .transform(Number),
});

export const topicSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

export const dashboardSchema = z.object({
  keyword: z.string().optional().default("Earth"),
});

export type MediaSearchQuery = z.infer<typeof mediaSearchSchema>;
export type NasaIdParams = z.infer<typeof nasaIdSchema>;
export type YearParams = z.infer<typeof yearSchema>;
export type TopicParams = z.infer<typeof topicSchema>;
export type DashboardQuery = z.infer<typeof dashboardSchema>;
