import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isRegistrationOpen(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start && !end) return true;
  const now = new Date().getTime();
  if (start && new Date(start).getTime() > now) return false;
  if (end && new Date(end).getTime() < now) return false;
  return true;
}

export function getRegistrationMessage(start: string | null | undefined, end: string | null | undefined): string | null {
  const now = new Date().getTime();
  if (start && new Date(start).getTime() > now) {
    return `Opens on ${format(new Date(start), "MMM d, yyyy")}`;
  }
  if (end && new Date(end).getTime() < now) {
    return `Closed on ${format(new Date(end), "MMM d, yyyy")}`;
  }
  return null;
}
