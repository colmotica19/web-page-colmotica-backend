//mColmotica.ts

import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import mariadb from "mariadb";
import {
  user,
  userLogin,
  userUp,
  manuals,
  admins,
  //manuals_VS_users,
} from "../Interfaces/interfaces";

const pool = mariadb.createPool({
  host: "192.168.0.169",
  user: "JULIAN1044",
  port: 3307,
  password: "1234567890",
  database: "COLMOTICA_WEB",
  timezone: "local",
  bigIntAsNumber: true,
});

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
        STATUS: 1,
      };

      const result = await conn.query(
        `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, STATUS) 
       VALUES (?, ?, ?, ?)`,
        [newCode.ID_CODE, newCode.ID_USERS, newCode.CONTENT, newCode.STATUS]
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
       WHERE ID_USERS = ? AND STATUS = 1
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
      return result;
    } catch (error) {
      console.error("Error en mDeleteuser: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async sendNoti() {
    let conn;
    try {
      conn = await pool.getConnection();

      const result = await conn.query(
        "SELECT EMAIL FROM USERS WHERE ID_ROL = '10001'  OR ID_ROL = '10002'"
      );

      if (result.length === 0) {
        console.log("No hay correos registrados...");
        return;
      }

      return result;
    } catch (error) {
      console.error("Error en sendNoti: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async sendNotimanual(idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();

      const result = await conn.query(
        "SELECT EMAIL FROM USERS WHERE ID_USERS = ?",
        [idUser]
      );

      if (result.length === 0) {
        console.log("No hay correos registrados...");
        return;
      }

      return result;
    } catch (error) {
      console.error("Error en sendNotimanuals: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mdeactivateCode(idCode: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE CODE_VERIFICATION SET STATUS = 0 WHERE ID_CODE = ?`,
        [idCode]
      );
    } finally {
      if (conn) conn.release();
    }
  }

  static async maggAdmin(input: admins) {
    let conn;
    try {
      conn = await pool.getConnection();

      const newAdmin = {
        ID_USERS: randomUUID(),
        ID_ROL: input.ID_ROL || 10002,
        EMAIL: input.EMAIL,
        PAIS: null,
        TEL: null,
        NAME: input.NAME,
        PASS_HASH: input.PASS_HASH,
        VERIFED: null,
      };

      const hash = await bcrypt.hash(newAdmin.PASS_HASH, 12);

      const result = await conn.query(
        "INSERT INTO USERS (ID_USERS, ID_ROL, EMAIL, PAIS, TEL, NAME, PASS_HASH, VERIFIED)VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newAdmin.ID_USERS,
          newAdmin.ID_ROL,
          newAdmin.EMAIL,
          newAdmin.PAIS,
          newAdmin.TEL,
          newAdmin.NAME,
          hash,
          newAdmin.VERIFED,
        ]
      );

      console.log({ result });

      return newAdmin;
    } catch (error) {
      console.error("Error en maggAdmin: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mgetAdmins() {
    let conn;
    try {
      conn = await pool.getConnection();

      const result = await conn.query(
        "SELECT * FROM USERS WHERE ID_ROL = 10002"
      );

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  static async maggManual(input: manuals) {
    let conn;
    try {
      conn = await pool.getConnection();

      const newManual = {
        ID_MANUALS: randomUUID(),
        ID_ROL: input.ID_ROL,
        NAME: input.NAME,
      };

      const result = await conn.query(
        "INSERT INTO MANUALS (ID_MANUALS, ID_ROL, NAME) VALUES (?,?,?)",
        [newManual.ID_MANUALS, newManual.ID_ROL, newManual.NAME]
      );

      console.log({ result });

      return newManual;
    } catch (error) {
      console.error("Error en maggManual: ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mgetManuals() {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query("SELECT * FROM MANUALS");
      return result;
    } catch (error) {
      console.error("Error en mgetManual(): ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mgetUserManualInfo(idUser: string, idManual: string) {
    const conn = await pool.getConnection();
    try {
      const rows = await conn.query(
        `SELECT U.EMAIL, M.NAME
       FROM USERS U
       JOIN MANUALS M ON M.ID_MANUALS = ?
       WHERE U.ID_USERS = ?`,
        [idManual, idUser]
      );
      return rows;
    } finally {
      conn.release();
    }
  }

  static async mreqManual(idManual: string, idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();

      const newReq = {
        ID_MANUALS: idManual,
        ID_USERS: idUser,
        STATE: "PENDIENTE",
      };

      let result = await conn.query(
        "SELECT COUNT(*) AS SOLICITUDES_REALIZADAS FROM MANUALS_VS_USERS WHERE ID_USERS = ?",
        [newReq.ID_USERS]
      );

      if (result[0].SOLICITUDES_REALIZADAS < 5) {
        result = await conn.query(
          "INSERT INTO MANUALS_VS_USERS (ID_MANUALS_VS_USERS, ID_MANUALS, ID_USERS, STATE, DATE_APPROVED) VALUES (COALESCE((SELECT MAX(ID_MANUALS_VS_USERS) + 1 FROM MANUALS_VS_USERS),1), ?,?,?,NULL)",
          [newReq.ID_MANUALS, newReq.ID_USERS, newReq.STATE]
        );

        const log = await conn.query(
          "INSERT INTO LOG_MANUAL (ID_LOG, ID_USERS, ID_MANUALS) VALUE (?,?,?)",
          [randomUUID(), idUser, idManual]
        );

        console.log({ log });

        console.log({ result });

        return result;
      } else {
        console.error({
          error: "Este usuario alcanzo el numero maximo de solicitudes...",
        });
        return null;
      }
    } catch (error) {
      console.error("Error en mreqManual(): ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mapprovedManual(ID: BigInt, idManual: string, idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      const hora = conn.query("SET time_zone = '-5:00'");
      console.log({ hora_actual: hora });
      const result = await conn.query(
        "UPDATE MANUALS_VS_USERS SET STATE = 'APROVADO', DATE_APPROVED = UTC_TIMESTAMP() WHERE ID_MANUALS_VS_USERS = ? AND ID_MANUALS = ? AND ID_USERS = ?",
        [ID, idManual, idUser]
      );
      return result;
    } catch (error) {
      console.error("Error en mapprovedManual(): ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mrefusedManual(ID: BigInt, idManual: string, idUser: string) {
    let conn;
    try {
      conn = await pool.getConnection();
      const hora = conn.query("SET time_zone = '-5:00'");
      console.log({ hora_actual: hora });
      const result = await conn.query(
        "UPDATE MANUALS_VS_USERS SET STATE = 'RECHAZADO', DATE_APPROVED = UTC_TIMESTAMP() WHERE ID_MANUALS_VS_USERS = ? AND ID_MANUALS = ? AND ID_USERS = ?",
        [ID, idManual, idUser]
      );
      return result;
    } catch (error) {
      console.error("Error en mapprovedManual(): ", error);
    } finally {
      if (conn) conn.release();
    }
  }

  static async mgetpendingManuals() {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
      SELECT MU.ID_USERS, MU.ID_MANUALS, U.EMAIL, M.NAME, MU.STATE
      FROM MANUALS_VS_USERS MU
      JOIN USERS U ON MU.ID_USERS = U.ID_USERS
      JOIN MANUALS M ON MU.ID_MANUALS = M.ID_MANUALS
      WHERE MU.STATE = 'PENDIENTE'
    `);
      return rows;
    } catch (error) {
      console.error("Error en mgetpendingManuals(): ", error);
    } finally {
      if (conn) conn.release();
    }
  }
}
