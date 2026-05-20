import { z } from 'zod';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'optional'];

export const roadmapSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          level: z.enum(LEVELS),
        })
      ),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
    })
  ),
});
