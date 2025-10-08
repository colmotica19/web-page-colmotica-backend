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

export interface emailsNoti {
  ID_EMAILS?: string;
  ID_ROL: number;
  EMAIL: string;
}
