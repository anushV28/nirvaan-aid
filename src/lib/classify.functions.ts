import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  description: z.string().trim().min(3).max(2000),
});

export const classifyRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { classifyDescription } = await import("./classify.server");
      return await classifyDescription(data.description);
    } catch (error) {
      console.error("classify handler error", error);
      return { category: "general" as const, urgency: "medium" as const };
    }
  });

