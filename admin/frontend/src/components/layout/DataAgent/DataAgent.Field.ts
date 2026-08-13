import { z } from "zod";

export const DataAgentBaseSchema = z.object({
  workspaceId: z.string().optional(),

  agentName: z.string().min(1, "Agent name is required").max(100, "Agent name is too long"),

  isActive: z.boolean(),
  seq: z.coerce.number().min(1, "Sequence is required , Min value : 1"),
});
