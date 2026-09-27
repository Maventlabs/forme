import { z } from 'zod'

const projectInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export function createProjectInput(input: unknown) {
  return projectInputSchema.safeParse(input)
}

export function parseProjectId(input: unknown) {
  return z.string().uuid().safeParse(input)
}
