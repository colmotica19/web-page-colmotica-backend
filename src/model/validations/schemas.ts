//schemas.ts

import z from "zod";

export const userSchema = z.object({
  ID_USERS: z.string().uuid().optional(),
  ID_ROL: z.number().int().positive().max(99999).optional().default(10003),
  EMAIL: z.string().email().max(255),
  PAIS: z.string().max(255),
  TEL: z.string().max(20),
  NAME: z.string().max(255),
  PASS_HASH: z
    .string()
    .min(8)
    .max(255)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  //   .regex(/[!@#$%^&*(),.?":{}|<>]/, "Debe contener al menos un caracter especial")
  VERIFIED: z.number().int().positive().max(1).optional().default(0),
});

export const upSchema = z.object({
  EMAIL: z.string().email().max(255),
  PAIS: z.string().max(255),
  TEL: z.string().max(20),
  NAME: z.string().max(255),
});

export const loginSchema = z.object({
  ID_USERS: z.string().uuid().optional(),
  ID_ROL: z.number().int().positive().max(99999).optional().default(10002),
  EMAIL: z.string().email().max(255),
  PAIS: z.string().max(255).optional(),
  TEL: z.string().max(20).optional(),
  NAME: z.string().max(255).optional(),
  PASS_HASH: z
    .string()
    .min(8)
    .max(255)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const manualSchema = z.object({
  ID_MANUALS: z.string().uuid().optional(),
  ID_ROL: z.number().int().positive().max(99999),
  NAME: z.string().max(255),
  CREATE_AT: z.date().optional(),
});

export const codeSchema = z.object({
  ID_CODE: z.string().uuid().optional(),
  ID_USERS: z.string().uuid(),
  CONTENT: z.number().int().positive().max(999999),
  DATE: z.date().optional(),
  STATUS: z.number().int().default(1),
  EMAIL: z.string().email().max(255),
});

/*export const addMail = z.object({
  ID_EMAILS: z.string().uuid().optional(),
  ID_ROL: z.number().int().positive().max(99999).optional().default(10001),
  EMAIL: z.string().email().max(255),
});*/

export const adminSchema = z.object({
  ID_USERS: z.string().uuid().optional(),
  ID_ROL: z.number().int().positive().max(99999).optional(),
  EMAIL: z.string().email().max(255),
  NAME: z.string().max(255),
  PASS_HASH: z
    .string()
    .min(8)
    .max(255)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export function validateUser(obj: object) {
  return userSchema.safeParse(obj);
}

export function validateLogin(obj: object) {
  return loginSchema.safeParse(obj);
}

export function validateSchema(obj: object) {
  return codeSchema.safeParse(obj);
}

/*export function validateNoti(obj: object) {
  return addMail.safeParse(obj);
}*/

export function patchUser(obj: object) {
  return upSchema.partial().safeParse(obj);
}

export function validateManual(obj: object) {
  return manualSchema.safeParse(obj);
}

export function validateAdmin(obj: object) {
  return adminSchema.safeParse(obj);
}
