//modelUser.ts

import { randomUUID } from "crypto";
import { executeQuery } from "../conexion_mariadb";
//import mariadb from "mariadb";
import {
  user,
  userLogin,
  userUp,
  //manuals_VS_users,
} from "../../Interfaces/interfaces";
import { sColmoticaService } from "../../../services/Colmotica/sColmotica.service";

export class mUser {
  colmoticaService: sColmoticaService;

  constructor(colmoticaService: sColmoticaService) {
    this.colmoticaService = colmoticaService;
  }

  async mpostRegistro(input: user) {
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

    const hash = await this.colmoticaService.createHash(newUser.PASS_HASH);

    const queryVal = "SELECT * FROM USERS WHERE EMAIL = ?";
    const paramsVal = [newUser.EMAIL];

    const resultVal = await executeQuery(queryVal, paramsVal);

    if (resultVal.length !== 0) {
      return { error: "Este correo ya esta registrado..." };
    } else {
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
    const query = "UPDATE USERS SET VERIFIED = 1 WHERE EMAIL = ?";
    const params = [input];
    const resultFinal = executeQuery(query, params);
    return resultFinal;
  }

  static async getEmail(email: string) {
    const query = "SELECT * FROM USERS WHERE EMAIL = ?";
    const [rows] = await executeQuery(query, [email]);
    return rows;
  }

  static async getId(email: string) {
    const recoPass = {
      EMAIL: email,
    };

    const query = "SELECT ID_USERS FROM USERS WHERE EMAIL = ?";
    const params = [recoPass.EMAIL];

    const result = await executeQuery(query, params);

    if (result.length > 0) {
      const id: string = result[0].ID_USERS;
      return id;
    } else {
      console.error({ error: "Este correo no existe..." });
      return null;
    }
  }

  static async getIdUsers() {
    const query = "SELECT ID_USERS FROM USERS";

    const result = await executeQuery(query);

    if (result.length > 0) {
      const id: string = result[0].ID_USERS;
      return id;
    } else {
      console.error({ error: "No hay usuarios registrados..." });
      return null;
    }
  }

  async mrecoverPass(email: string, pass: string) {
    const newPass = await this.colmoticaService.createHash(pass);
    const query = "UPDATE USERS SET PASS_HASH = ? WHERE EMAIL = ? ";
    const params = [newPass, email];

    const resultFinal = await executeQuery(query, params);
    return resultFinal;
  }

  static async mGetById(ID_USERS: number) {
    try {
      const [rows]: any = `SELECT ID_USERS, EMAIL, PASS_HASH 
         FROM users 
         WHERE ID_USERS = ? 
         LIMIT 1`;
      const params = [ID_USERS];

      const result = await executeQuery(rows, params);

      console.log(result);

      return rows && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error en mGetById:", error);
      throw error;
    }
  }
}
