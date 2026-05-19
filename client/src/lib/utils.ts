import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  return role === 'Attendance' ? 'Attendance Committee' : role;
}