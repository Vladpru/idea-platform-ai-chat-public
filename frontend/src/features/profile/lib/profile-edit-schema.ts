import { z } from 'zod';

const socialLinkSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    value => value.length === 0 || /^https?:\/\/.+/i.test(value),
    'Enter a valid URL starting with http:// or https://',
  );

export const profileEditSchema = z.object({
  firstName: z.string().max(50),
  lastName: z.string().max(50),
  bio: z.string().max(300).catch(''),
  socialLinks: z.array(socialLinkSchema).max(10).catch(['']),
});

export type ProfileEditValues = z.infer<typeof profileEditSchema>;

export const AVATAR_MAX_BYTES = 800 * 1024;

export function normalizeSocialLinksForForm(
  links: string[] | undefined,
): string[] {
  if (!links?.length) {
    return [''];
  }
  return links;
}

export function normalizeSocialLinksForSubmit(links: string[]): string[] {
  return links.map(link => link.trim()).filter(Boolean);
}
