//mColmotica.ts

import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: "192.168.0.169",
  user: "JULIAN1044",
  port: 3307,
  password: "1234567890",
  database: "COLMOTICA_WEB",
  bigIntAsNumber: true,
});

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

export class modelColmotica {
  constructor() {}

  static async mpostRegistro(input: user) {
    let conn;
    try {
      conn = await pool.getConnection();

      const newUser = {
        ID_USERS: randomUUID(),
        ID_ROL: input.ID_ROL,
        EMAIL: input.EMAIL,
        PAIS: input.PAIS,
        TEL: input.TEL,
        NAME: input.NAME,
        PASS_HASH: input.PASS_HASH,
        VERIFIED: input.VERIFIED,
      };

      const hash = await bcrypt.hash(newUser.PASS_HASH, 12);

      const result = await conn.query(
        "INSERT INTO USERS (ID_USERS, ID_ROL, EMAIL, PAIS, TEL, NAME, PASS_HASH, VERIFIED)VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newUser.ID_USERS,
          newUser.ID_ROL,
          newUser.EMAIL,
          newUser.PAIS,
          newUser.TEL,
          newUser.NAME,
          hash,
          newUser.VERIFIED,
        ]
      );

      console.log({ resultM: result });

      return newUser;
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  static async mgetUsers() {
    let conn;
    try {
      conn = await pool.getConnection();

      const result = await conn.query("SELECT * FROM USERS");

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  static async mpostLogin(input: userLogin) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query("SELECT * FROM USERS WHERE EMAIL = ?", [
        input.EMAIL,
      ]);
      if (result.length !== 0) {
        return result;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error mpostLogin: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async minsertVerificationCode(idUser: string, code: number) {
    let conn;
    try {
      conn = await pool.getConnection();
      const newCode = {
        ID_CODE: randomUUID(),
        ID_USERS: idUser,
        CONTENT: code,
        CREATED_AT: new Date(),
        STATUS: 1,
      };

      const result = await conn.query(
        `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, CREATED_AT, STATUS) 
       VALUES (?, ?, ?, ?, ?)`,
        [
          newCode.ID_CODE,
          newCode.ID_USERS,
          newCode.CONTENT,
          newCode.CREATED_AT,
          newCode.STATUS,
        ]
      );
      console.log(result);
      return result;
    } finally {
      if (conn) conn.release();
    }
  }

  static async mgetLastVerificationCode(idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `SELECT * FROM CODE_VERIFICATION 
       WHERE ID_USERS = ? 
       ORDER BY CREATED_AT DESC 
       LIMIT 1`,
        [idUser]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  }

  static async mverifyUser(input: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        "UPDATE USERS SET VERIFIED = 1 WHERE ID_USERS = ?",
        [input]
      );
      return result;
    } catch (error) {
      console.log("Error en mverifyUser: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async maggMail(input: emailsNoti) {
    let conn;
    try {
      conn = await pool.getConnection();

      const newNoti = {
        ID_EMAILS: randomUUID(),
        ID_ROL: 10001,
        EMAIL: input.EMAIL,
      };

      const result = await conn.query(
        "INSERT INTO EMAILS_NOTI (ID_EMAILS, ID_ROL, EMAIL) VALUE (?,?,?)",
        [newNoti.ID_EMAILS, newNoti.ID_ROL, newNoti.EMAIL]
      );

      return result;
    } catch (error) {
      console.error("Error en maggMail: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mupdateUsers(idUser: string, input: userUp) {
    let conn;
    try {
      conn = await pool.getConnection();
      let result = await conn.query(`SELECT * FROM USERS WHERE ID_USERS = ?`, [
        idUser,
      ]);
      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const registroUpdate = {
        EMAIL: input.EMAIL ?? row.EMAIL,
        PAIS: input.PAIS ?? row.PAIS,
        TEL: input.TEL ?? row.TEL,
        NAME: input.NAME ?? row.NAME,
      };

      await conn.query(
        "UPDATE USERS SET EMAIL = ?, PAIS = ?, TEL = ?, NAME = ? WHERE ID_USERS = ?",
        [
          registroUpdate.EMAIL,
          registroUpdate.PAIS,
          registroUpdate.TEL,
          registroUpdate.NAME,
          idUser,
        ]
      );

      const updated = await conn.query(
        "SELECT * FROM USERS WHERE ID_USERS = ?",
        [idUser]
      );

      return updated[0];
    } catch (err) {
      console.log("Error en mupdateUsers: ", err);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mDeleteuser(idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      let result = await conn.query(
        "SELECT ID_USERS FROM USERS WHERE ID_USERS = ?",
        [idUser]
      );
      if (result.length === 0) {
        return null;
      }
      result = await conn.query("DELETE FROM USERS WHERE ID_USERS = ?", [
        idUser,
      ]);
    } catch (error) {
      console.error("Error en mDeleteuser: ", error);
    } finally {
      if (conn) conn.release();
    }
  }
}
