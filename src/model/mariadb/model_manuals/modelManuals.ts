import { randomUUID } from "crypto";
import { manuals } from "../../Interfaces/interfaces";
import { executeQuery } from "../conexion_mariadb";

export class mManuals {
  static async maggManual(input: manuals) {
    const newManual = {
      ID_MANUALS: randomUUID(),
      ID_ROL: input.ID_ROL,
      NAME: input.NAME,
    };

    const query =
      "INSERT INTO MANUALS (ID_MANUALS, ID_ROL, NAME) VALUES (?,?,?)";
    const params = [newManual.ID_MANUALS, newManual.ID_ROL, newManual.NAME];
    const resultFinal = executeQuery(query, params);

    console.log({ resultFinal });

    return newManual;
  }

  static async mgetManuals() {
    const query = "SELECT * FROM MANUALS";
    const resultFinal = executeQuery(query);
    return resultFinal;
  }

  static async mgetUserManualInfo(idUser: string, idManual: string) {
    const query = `SELECT U.EMAIL, M.NAME
           FROM USERS U
           JOIN MANUALS M ON M.ID_MANUALS = ?
           WHERE U.ID_USERS = ?`;
    const params = [idManual, idUser];
    const resultFinal = executeQuery(query, params);

    return resultFinal;
  }

  static async mreqManual(idManual: string, idUser: string) {
    const newReq = {
      ID_MANUALS: idManual,
      ID_USERS: idUser,
      STATE: "PENDIENTE",
    };

    let query =
      "SELECT COUNT(*) AS SOLICITUDES_REALIZADAS FROM MANUALS_VS_USERS WHERE ID_USERS = ? AND STATE = 'PENDIENTE'";
    let params = [newReq.ID_USERS];

    const result1: any[] = await executeQuery(query, params);

    if (result1[0].SOLICITUDES_REALIZADAS < 5) {
      query =
        "INSERT INTO MANUALS_VS_USERS (ID_MANUALS_VS_USERS, ID_MANUALS, ID_USERS, STATE, DATE_APPROVED) VALUES (COALESCE((SELECT MAX(ID_MANUALS_VS_USERS) + 1 FROM MANUALS_VS_USERS),1), ?,?,?,NULL)";
      params = [newReq.ID_MANUALS, newReq.ID_USERS, newReq.STATE];

      const result2 = await executeQuery(query, params);

      console.log(result2);

      const queryLog =
        "INSERT INTO LOG_MANUAL (ID_LOG, ID_USERS, ID_MANUALS) VALUE (?,?,?)";
      const paramsLog = [randomUUID(), idUser, idManual];

      const resultFinal = executeQuery(queryLog, paramsLog);

      console.log({ queryLog });

      console.log({ resultFinal });

      return resultFinal;
    } else {
      console.error({
        error: "Este usuario alcanzo el numero maximo de solicitudes...",
      });
      return null;
    }
  }

  static async mapprovedManual(ID: BigInt, idManual: string, idUser: string) {
    const query =
      "UPDATE MANUALS_VS_USERS SET STATE = 'APROVADO', DATE_APPROVED = UTC_TIMESTAMP() WHERE ID_MANUALS_VS_USERS = ? AND ID_MANUALS = ? AND ID_USERS = ?";
    const params = [ID, idManual, idUser];
    const resultFinal = executeQuery(query, params);

    return resultFinal;
  }

  static async mrefusedManual(ID: BigInt, idManual: string, idUser: string) {
    const hora = "SET time_zone = '-5:00'";
    const horaF = executeQuery(hora);
    console.log(horaF);

    const result =
      "UPDATE MANUALS_VS_USERS SET STATE = 'RECHAZADO', DATE_APPROVED = UTC_TIMESTAMP() WHERE ID_MANUALS_VS_USERS = ? AND ID_MANUALS = ? AND ID_USERS = ?";
    const params = [ID, idManual, idUser];
    const resultFinal = executeQuery(result, params);

    return resultFinal;
  }

  static async mgetpendingManuals() {
    const query = `SELECT MU.ID_USERS, MU.ID_MANUALS, U.EMAIL, M.NAME, MU.STATE
          FROM MANUALS_VS_USERS MU
          JOIN USERS U ON MU.ID_USERS = U.ID_USERS
          JOIN MANUALS M ON MU.ID_MANUALS = M.ID_MANUALS
          WHERE MU.STATE = 'PENDIENTE'`;

    const resultFinal = executeQuery(query);
    return resultFinal;
  }

  static async mgetNumberReq() {
    const query = "SELECT COUNT(*) FROM LOG_MANUAL";
    const resultFinal = executeQuery(query);

    return resultFinal;
  }
}
