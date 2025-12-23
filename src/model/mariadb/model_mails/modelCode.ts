// modelCOde.ts

import { randomUUID } from "crypto";
import { executeQuery } from "../conexion_mariadb";

export class mCode {
  static async minsertVerificationCode(email: string, code: number) {
    const query_id_user = `SELECT ID_USERS FROM USERS WHERE EMAIL = ?`;
    const params_id_user = [email];

    const result_idUser = await executeQuery(query_id_user, params_id_user);

    if (result_idUser.length > 0) {
      const idUser = result_idUser[0].ID_USERS;

      const newCode = {
        ID_CODE: randomUUID(),
        ID_USERS: idUser,
        CONTENT: code,
        STATUS: 1,
        EMAIL: email,
      };

      const query = `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, STATUS, TYPE, EMAIL) VALUES (?, ?, ?, ?, 'VERIFICACION', ?)`;
      const params = [
        newCode.ID_CODE,
        newCode.ID_USERS,
        newCode.CONTENT,
        newCode.STATUS,
        newCode.EMAIL,
      ];
      const resultFinal = await executeQuery(query, params);
      console.log(resultFinal);
      return resultFinal;
    } else {
      return null;
    }
  }

  static async minsertRecoverCode(email: string, code: number) {
    const query_id_user = `SELECT ID_USERS FROM USERS WHERE EMAIL = ?`;
    const params_id_user = [email];

    const result_idUser = await executeQuery(query_id_user, params_id_user);

    if (result_idUser.length > 0) {
      const idUser = result_idUser[0].ID_USERS;
      const newCode = {
        ID_CODE: randomUUID(),
        ID_USERS: idUser,
        CONTENT: code,
        STATUS: 1,
        EMAIL: email,
        USAGE_COUNT: 0,
      };

      const query = `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, STATUS, TYPE, EMAIL, USAGE_COUNT) VALUES (?, ?, ?, ?, 'RECUPERACION',?, ?)`;
      const params = [
        newCode.ID_CODE,
        newCode.ID_USERS,
        newCode.CONTENT,
        newCode.STATUS,
        newCode.EMAIL,
        newCode.USAGE_COUNT,
      ];
      const resultFinal = await executeQuery(query, params);
      console.log(resultFinal);
      return resultFinal;
    } else {
      return null;
    }
  }

  static async mgetLastVerificationCode(email: string) {
    const query = `SELECT * FROM CODE_VERIFICATION 
             WHERE EMAIL = ? AND STATUS = 1
             ORDER BY CREATED_AT DESC 
             LIMIT 1`;

    const params = [email];
    const resultFinal = await executeQuery(query, params);
    return resultFinal;
  }

  static async mgetLastCodeByType(email: string, type: string) {
    const query = `
      SELECT * 
      FROM CODE_VERIFICATION 
      WHERE EMAIL = ? AND TYPE = ? 
      ORDER BY CREATED_AT DESC 
      LIMIT 1
    `;
    return await executeQuery(query, [email, type]);
  }

  static async mdeactivateCode(code: number) {
    const query = `UPDATE CODE_VERIFICATION SET STATUS = 0 WHERE CONTENT = ?`;
    return await executeQuery(query, [code]);
  }

  static async mgetLastCode(email: string) {
    // 1️⃣ Obtener ID del usuario por su correo
    const queryUser = `SELECT ID_USERS FROM USERS WHERE EMAIL = ? LIMIT 1`;
    const [userRow] = await executeQuery(queryUser, [email]);

    if (!userRow) {
      console.warn("⚠️ No existe usuario con ese correo:", email);
      return [];
    }

    const userId = userRow.ID_USERS;

    // 2️⃣ Buscar el último código asociado a ese usuario

    const queryCode = `
      SELECT * FROM CODE_VERIFICATION
      WHERE ID_USERS = ?
      ORDER BY CREATED_AT DESC
      LIMIT 1
    `;
    const result = await executeQuery(queryCode, [userId]);

    return result; // devolver el array directamente
  }

  static async musageCount(code: string) {
    const query = ` UPDATE CODE_VERIFICATION SET USAGE_COUNT = USAGE_COUNT + 1 WHERE CONTENT = ?`;
    const params = [code];
    const resultFinal = await executeQuery(query, params);

    return resultFinal;
  }

  static async getUsage(code: string) {
    const query = `
    SELECT USAGE_COUNT FROM CODE_VERIFICATION WHERE CONTENT = ?
  `;
    return await executeQuery(query, [code]);
  }

  static async mverifyStatusCodeRecover(email: string) {
    const sqlCodeCheck = `
          SELECT ID_CODE
          FROM CODE_VERIFICATION
          WHERE EMAIL = ?
            AND TYPE = 'RECUPERACION'
            AND STATUS = 1
          ORDER BY CREATED_AT DESC
          LIMIT 1
        `;
    const codeResult = await executeQuery(sqlCodeCheck, [email]);
    return codeResult;
  }

  static async mstatusVerify(email: string) {
    const query = "SELECT VERIFIED FROM USERS WHERE EMAIL = ?";
    const result = await executeQuery(query, [email]);
    return result;
  }
}
