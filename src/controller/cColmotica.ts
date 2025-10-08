//cColmotica.ts

import { Request, Response, Router } from "express";
import {
  validateLogin,
  validateUser,
  validateNoti,
  patchUser,
} from "../model/validations/schemas";
import { modelColmotica } from "../model/mariadb/mColmotica";
import "dotenv/config";
import { sMailService } from "../services/Mails/Mail.service";
import { sColmoticaService } from "../services/Colmotica/sColmotica.service";

export class controllerColmotica {
  colmoticaService: sColmoticaService;
  mailService: sMailService;
  constructor(colmoticaService: sColmoticaService, mailService: sMailService) {
    this.colmoticaService = colmoticaService;
    this.mailService = mailService;
  }

  listenRoutes() {
    const router = Router();

    router.post("/users", this.cpostUsers.bind(this));
    router.get("/users", controllerColmotica.cgetUsers);
    router.post("/users/login", this.cpostLogin.bind(this));
    router.post("/users/verify-code", this.verifyCode.bind(this));
    router.post("/users/addMails", controllerColmotica.cpostAddMailNoti);
    router.patch("/users/update/:idUser", controllerColmotica.cpatchUsers);
    router.delete("/users/delete/:idUser", controllerColmotica.cdeleteUser);

    return router;
  }

  async cpostUsers(req: Request, res: Response) {
    try {
      const val = validateUser(req.body);
      if (!val.success) {
        res
          .status(422)
          .json({ error: "Digite los datos correctamente postUsers" });
      } else {
        const result = await modelColmotica.mpostRegistro(val.data);
        console.log(val.data);
        const token = result.ID_USERS;
        sMailService.sendMail(token, val);
        res.status(201).json({ success: true, result });
      }
    } catch (error) {
      console.error("Error en cpostUsers:", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  static async cgetUsers(req: Request, res: Response) {
    try {
      const result = await modelColmotica.mgetUsers();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  async cpostLogin(req: Request, res: Response) {
    const valUser = validateLogin(req.body);
    console.log(valUser);

    try {
      if (!valUser.success) {
        res.status(422).json({
          success: false,
          message: "Digite correctamente las credenciales...",
        });
      } else {
        const result = await modelColmotica.mpostLogin(valUser.data);

        const pass = valUser.data.PASS_HASH;
        const pass_hash = await this.colmoticaService.createHash(
          pass,
          result[0].PASS_HASH
        );
        const reqLogin = req.body;

        if (result[0].EMAIL === reqLogin.EMAIL && pass_hash === true) {
          console.log("Credenciales correctas!!");
          res.status(201).json({ success: true, reqLogin });
        } else {
          res
            .status(401)
            .json({ success: false, message: "Acceso no autorizado..." });
        }
      }
    } catch (error) {
      console.error("Error en cpostLogin: ", error);
      res
        .status(500)
        .json({ success: false, message: "Error en el servidor (cpostLogin)" });
    }
  }

  async verifyCode(req: Request, res: Response) {
    const { idUser, code } = req.body;
    try {
      const verified = await this.mailService.verifyCode(idUser, code);
      if (verified) {
        res.status(200).json({ success: true, message: "Usuario verificado" });
      } else {
        res
          .status(400)
          .json({ success: false, message: "Código inválido o expirado" });
      }
    } catch (error) {
      console.error("Error en verifyCode:", error);
      res
        .status(500)
        .json({ success: false, message: "Error en verificación" });
    }
  }

  static async cpostAddMailNoti(req: Request, res: Response) {
    const val = validateNoti(req.body);
    try {
      if (!val.success) {
        res
          .status(422)
          .json({ error: "Digite los datos correctamente el correo" });
      } else {
        const result = await modelColmotica.maggMail(val.data);
        res.status(201).json({
          success: true,
          result: result,
        });
      }
    } catch (error) {
      console.error("Error en cpostAddMail:", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  static async cpatchUsers(req: Request, res: Response) {
    try {
      const { idUser } = req.params;

      // Validar el body con Zod
      const result = patchUser(req.body);
      if (!result.success) {
        return res.status(422).json({
          success: false,
          errors: result.error,
        });
      }

      // Actualizar usuario
      const upUser = await modelColmotica.mupdateUsers(idUser, result.data);

      if (!upUser) {
        return res.status(404).json({ message: "Usuario no encontrado..." });
      }

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        data: upUser,
      });
    } catch (err) {
      console.error("Error en cpatchUsers:", err);
      return res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  static async cdeleteUser(req: Request, res: Response) {
    try {
      const { idUser } = req.params;
      const ls = await modelColmotica.mDeleteuser(idUser);
      if (ls === null) {
        return res.status(404).json({ message: "Usuario no encontrado..." });
      }
      return res
        .status(200)
        .json({ success: true, message: "Usuario eliminado..." });
    } catch (err) {
      console.error("Error en cdeleteUsers:", err);
      return res.status(500).json({ error: "Error del servidor!!" });
    }
  }
}
