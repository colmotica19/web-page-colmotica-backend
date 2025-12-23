//modelAdmins.ts

import { admins } from "../../Interfaces/interfaces";
import { randomUUID } from "crypto";
import { executeQuery } from "../conexion_mariadb";
import bcrypt from "bcrypt";

export class mAdmins {
  static async maggAdmin(input: admins) {
    const newAdmin = {
      ID_USERS: randomUUID(),
      ID_ROL: input.ID_ROL || 10002,
      EMAIL: input.EMAIL,
      PAIS: null,
      TEL: null,
      NAME: input.NAME,
      PASS_HASH: input.PASS_HASH,
      VERIFED: 1,
    };

    const hash = await bcrypt.hash(newAdmin.PASS_HASH, 12);

    const queryVal = "SELECT * FROM USERS WHERE EMAIL = ?";
    const paramsVal = [newAdmin.EMAIL];

    const resultVal = await executeQuery(queryVal, paramsVal);

    if (resultVal.length !== 0) {
      return { error: "Este administrador ya esta registrado..." };
    } else {
      const query =
        "INSERT INTO USERS (ID_USERS, ID_ROL, EMAIL, PAIS, TEL, NAME, PASS_HASH, VERIFIED)VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const params = [
        newAdmin.ID_USERS,
        newAdmin.ID_ROL,
        newAdmin.EMAIL,
        newAdmin.PAIS,
        newAdmin.TEL,
        newAdmin.NAME,
        hash,
        newAdmin.VERIFED,
      ];

      const resultFinal = executeQuery(query, params);

      console.log({ resultFinal });

      return newAdmin;
    }
  }

  static async mgetAdmins() {
    const query = "SELECT * FROM USERS WHERE ID_ROL = 10002";
    const result = executeQuery(query);

    return result;
  }
}
