import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { executeQuery } from "../conexion_mariadb";
//import mariadb from "mariadb";
import {
  user,
  userLogin,
  userUp,
  //manuals_VS_users,
} from "../../Interfaces/interfaces";

export class mUser {
  static async mpostRegistro(input: user) {
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

    const query =
      "INSERT INTO USERS (ID_USERS, ID_ROL, EMAIL, PAIS, TEL, NAME, PASS_HASH, VERIFIED)VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    const params = [
      newUser.ID_USERS,
      newUser.ID_ROL,
      newUser.EMAIL,
      newUser.PAIS,
      newUser.TEL,
      newUser.NAME,
      hash,
      newUser.VERIFIED,
    ];

    await executeQuery(query, params);

    console.log({ resultM: query });

    return newUser;
  }

  static async mgetUsers() {
    const query = "SELECT * FROM USERS";
    const result: any[] = await executeQuery(query);
    return result;
  }

  static async mpostLogin(input: userLogin) {
    const query = "SELECT * FROM USERS WHERE EMAIL = ?";
    const params = [input.EMAIL];
    const resultQuery: any[] = await executeQuery(query, params);
    if (resultQuery.length !== 0) {
      console.log(resultQuery);
      return resultQuery;
    } else {
      return false;
    }
  }

  static async mupdateUsers(idUser: string, input: userUp) {
    let query: any = `SELECT * FROM USERS WHERE ID_USERS = ?`;
    let params = [idUser];

    const result: any[] = await executeQuery(query, params);

    if (result.length === 0) {
      return null;
    } else {
      const row = result[0];
      const registroUpdate = {
        EMAIL: input.EMAIL ?? row.EMAIL,
        PAIS: input.PAIS ?? row.PAIS,
        TEL: input.TEL ?? row.ROW,
        NAME: input.NAME ?? row.NAME,
      };

      const upQuery =
        "UPDATE USERS SET EMAIL = ?, PAIS = ?, TEL = ?, NAME = ? WHERE ID_USERS = ?";
      const upParams = [
        registroUpdate.EMAIL,
        registroUpdate.PAIS,
        registroUpdate.TEL,
        registroUpdate.NAME,
        idUser,
      ];
      await executeQuery(upQuery, upParams);

      const finalQuery = "SELECT * FROM USERS WHERE ID_USERS = ?";
      const finalParams = [idUser];

      const upResult: any[] = await executeQuery(finalQuery, finalParams);

      if (upResult.length !== 0) {
        return upResult[0];
      } else {
        return null;
      }
    }
  }

  static async mDeleteuser(idUser: string) {
    const resultQuery = "SELECT ID_USERS FROM USERS WHERE ID_USERS = ?";
    const resultParams = [idUser];

    const resultFinal = await executeQuery(resultQuery, resultParams);

    if (resultFinal.length === 0) {
      return null;
    } else {
      const resultQuery2 = "DELETE FROM USERS WHERE ID_USERS = ?";
      const resultParams2 = [idUser];
      const resultFinal2 = await executeQuery(resultQuery2, resultParams2);
      return resultFinal2;
    }
  }

  static async mverifyUser(input: string) {
    const query = "UPDATE USERS SET VERIFIED = 1 WHERE ID_USERS = ?";
    const params = [input];
    const resultFinal = executeQuery(query, params);
    return resultFinal;
  }
}
