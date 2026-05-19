import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function roleLabel(role: string): string {
  return role === 'Attendance' ? 'Attendance Committee' : role;
}