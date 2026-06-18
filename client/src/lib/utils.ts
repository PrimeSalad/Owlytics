import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Role aliases — a role on the left has the SAME permissions as the role on
 * the right. Adviser ≡ President, VicePresident ≡ Secretary. Keep in sync with
 * the server (`server/src/middleware/requireRole.ts`).
 */
export const ROLE_ALIASES: Partial<Record<UserRole, UserRole>> = {
  Adviser: 'President',
  VicePresident: 'Secretary',
};

/** Collapse an aliased role to its effective permission role. */
export function resolveRole(role: string | undefined | null): string {
  if (!role) return '';
  return ROLE_ALIASES[role as UserRole] ?? role;
}

/** True if `role` (or the role it inherits from) is in `allowed`. */
export function roleSatisfies(role: string | undefined | null, allowed: readonly string[]): boolean {
  if (!role) return false;
  return allowed.includes(role) || allowed.includes(resolveRole(role));
}


export const AVATAR_COLORS = [
  { name: 'Brand', from: 'from-brand-400', to: 'to-brand-600' },
  { name: 'Purple', from: 'from-purple-400', to: 'to-purple-600' },
  { name: 'Blue', from: 'from-blue-400', to: 'to-blue-600' },
  { name: 'Green', from: 'from-green-400', to: 'to-green-600' },
  { name: 'Orange', from: 'from-orange-400', to: 'to-orange-600' },
  { name: 'Pink', from: 'from-pink-400', to: 'to-pink-600' },
  { name: 'Red', from: 'from-red-400', to: 'to-red-600' },
  { name: 'Teal', from: 'from-teal-400', to: 'to-teal-600' },
];

export function roleLabel(role: string): string {
  if (role === 'Attendance') return 'Attendance Committee';
  if (role === 'VicePresident') return 'Vice President';
  return role;
}