// modelCOde.ts

import { randomUUID } from "crypto";
import { executeQuery } from "../conexion_mariadb";

export class mCode {
  static async minsertVerificationCode(idUser: string, code: number) {
    const newCode = {
      ID_CODE: randomUUID(),
      ID_USERS: idUser,
      CONTENT: code,
      STATUS: 1,
    };

    const query = `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, STATUS, TYPE) VALUES (?, ?, ?, ?, 'VERIFICACION')`;
    const params = [
      newCode.ID_CODE,
      newCode.ID_USERS,
      newCode.CONTENT,
      newCode.STATUS,
    ];
    const resultFinal = await executeQuery(query, params);
    console.log(resultFinal);
    return resultFinal;
  }

  static async minsertRecoverCode(idUser: string, code: number) {
    const newCode = {
      ID_CODE: randomUUID(),
      ID_USERS: idUser,
      CONTENT: code,
      STATUS: 1,
    };

    const query = `INSERT INTO CODE_VERIFICATION (ID_CODE, ID_USERS, CONTENT, STATUS, TYPE) VALUES (?, ?, ?, ?, 'RECUPERACION')`;
    const params = [
      newCode.ID_CODE,
      newCode.ID_USERS,
      newCode.CONTENT,
      newCode.STATUS,
    ];
    const resultFinal = await executeQuery(query, params);
    console.log(resultFinal);
    return resultFinal;
  }

  static async mgetLastVerificationCode(idUser: string) {
    const query = `SELECT * FROM CODE_VERIFICATION 
             WHERE ID_USERS = ? AND STATUS = 1
             ORDER BY CREATED_AT DESC 
             LIMIT 1`;

    const params = [idUser];
    const resultFinal = executeQuery(query, params);
    return resultFinal;
  }

  static async mgetLastCodeByType(idUser: string, type: string) {
    const query = `
      SELECT * 
      FROM CODE_VERIFICATION 
      WHERE ID_USERS = ? AND TYPE = ? 
      ORDER BY CREATED_AT DESC 
      LIMIT 1
    `;
    return await executeQuery(query, [idUser, type]);
  }

  static async mdeactivateCode(idCode: string) {
    const query = `UPDATE CODE_VERIFICATION SET STATUS = 0 WHERE ID_CODE = ?`;
    return await executeQuery(query, [idCode]);
  }
}
