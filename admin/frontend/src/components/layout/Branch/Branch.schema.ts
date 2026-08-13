import { z } from "zod";

export const branchConfigurationSchema = z.object({
  id: z.string().optional(),
  branchId: z.string().nullable().optional(),
  configType: z.string().nullable().optional(),
  agentType: z.enum(["sql", "rag"]),
  endpoint: z.string().nullable().optional(),
  db: z.string().nullable().optional(),
  user: z.string().nullable().optional(),
  port: z.array(z.string()).nullable().optional(),
});

export const branchSchema = z.object({
  branchName: z.string().min(1, "Branch name is required"),
  branchType: z.string(),
  branchLocation: z.string().min(1, "Location is required"),
  branchUserAccess: z
    .union([z.array(z.string()), z.string()])
    .nullable()
    .optional(),
  branchLogo: z
    .union([z.instanceof(File), z.string()])
    .nullable()
    .optional(),
  bgImg: z
    .union([z.instanceof(File), z.string()])
    .nullable()
    .optional(),
  dataAgentBotName: z.string().nullable().optional(),
  dataAgentWelcomeprompt: z.string().nullable().optional(),

  isActive: z.boolean().nullable().optional(),
  isDefault: z.boolean().nullable().optional(),

  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
