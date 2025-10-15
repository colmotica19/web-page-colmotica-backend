export interface user {
  ID_USERS?: string;
  ID_ROL?: number;
  EMAIL: string;
  PAIS: string;
  TEL: string;
  NAME: string;
  PASS_HASH: string;
  VERIFIED?: number;
}

export interface userUp {
  ID_USERS?: string;
  ID_ROL?: number;
  EMAIL?: string;
  PAIS?: string;
  TEL?: string;
  NAME?: string;
  PASS_HASH?: string;
  VERIFIED?: number;
}

export interface userLogin {
  ID_USERS?: string;
  ID_ROL?: number;
  EMAIL: string;
  PAIS?: string;
  TEL?: string;
  NAME?: string;
  PASS_HASH: string;
  VERIFIED?: number;
}

export interface codeVerification {
  ID_CODE?: string;
  ID_USERS: string;
  CONTENT: number;
  CREATED_AT?: Date;
  STATUS?: number;
}

export interface manuals {
  ID_MANUALS?: string;
  ID_ROL: number;
  NAME: string;
  CREATE_AT?: Date;
}

export interface logManuals {
  ID_LOG: string;
  ID_USERS: string;
  ID_MANUALS: string;
  CREATE_AT?: Date;
}

export interface admins {
  ID_USERS?: string;
  ID_ROL?: number;
  EMAIL: string;
  PAIS?: string;
  TEL?: string;
  NAME: string;
  PASS_HASH: string;
  VERIFIED?: number;
}

export interface manuals_VS_users {
  ID_MANUALS_VS_USERS?: bigint;
  ID_MANUALS?: string;
  ID_USERS?: string;
  STATE?: Date;
  DATE_REQ?: Date;
  DATE_APPROVED?: Date;
}
