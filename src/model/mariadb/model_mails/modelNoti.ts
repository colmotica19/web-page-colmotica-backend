import { executeQuery } from "../conexion_mariadb";

export class mNoti {
  static async sendNoti() {
    const query =
      "SELECT EMAIL FROM USERS WHERE ID_ROL = '10001'  OR ID_ROL = '10002'";

    const resultFinal = await executeQuery(query, []);
    if (resultFinal.length == 0) {
      console.log("No hay correos registrados...");
      return;
    }

    return resultFinal;
  }

  static async sendNotimanual(idUser: string, idManual: string) {
    const query = `SELECT U.EMAIL, M.NAME
          FROM USERS U, MANUALS M
          WHERE U.ID_USERS = ? AND M.ID_MANUALS = ?`;

    const params = [idUser, idManual];

    const resultFinal = await executeQuery(query, params);

    if (resultFinal.length === 0) {
      console.log("No hay correos registrados...");
      return;
    }

    console.log(resultFinal);

    return resultFinal;
  }
}
