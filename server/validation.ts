import { TRPCError } from "@trpc/server";
export function sanitizeString(input: string): string {
  if (!input) return "";
  let sanitized = input.replace(/<[^>]*>/g, "");
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\
  return sanitized;
}
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  if (value.length < minLength) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${fieldName} must be at least ${minLength} characters long`,
    });
  }
  if (value.length > maxLength) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${fieldName} must not exceed ${maxLength} characters`,
    });
  }
}
export function validatePostTitle(title: string): string {
  validateStringLength(title, 1, 255, "Title");
  return sanitizeString(title);
}
export function validatePostContent(content: string): string {
  validateStringLength(content, 1, 10000, "Content");
  return sanitizeString(content);
}
export function validateUserName(name: string): string {
  validateStringLength(name, 1, 255, "Name");
  return sanitizeString(name);
}
export function validateRole(role: string): "admin" | "editor" | "viewer" {
  const validRoles = ["admin", "editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
    });
  }
  return role as "admin" | "editor" | "viewer";
}
export function validatePostStatus(status: string): "draft" | "published" {
  const validStatuses = ["draft", "published"];
  if (!validStatuses.includes(status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    });
  }
  return status as "draft" | "published";
}
export function validatePostVisibility(
  visibility: string
): "private" | "internal" | "public" {
  const validVisibilities = ["private", "internal", "public"];
  if (!validVisibilities.includes(visibility)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid visibility: ${visibility}. Must be one of: ${validVisibilities.join(", ")}`,
    });
  }
  return visibility as "private" | "internal" | "public";
}
export function validateId(id: any, fieldName: string = "ID"): number {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${fieldName} must be a positive integer`,
    });
  }
  return numId;
}

