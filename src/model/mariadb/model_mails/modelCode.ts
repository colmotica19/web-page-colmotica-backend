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

  static async mdeactivateCode(email: string) {
    const query = `UPDATE CODE_VERIFICATION SET STATUS = 0 WHERE EMAIL = ?`;
    return await executeQuery(query, [email]);
  }
}
