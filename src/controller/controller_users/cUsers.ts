//cUsers.ts

import { Request, Response, Router } from "express";
import {
  validateLogin,
  validateUser,
  patchUser,
} from "../../model/validations/schemas";
import { mUser } from "../../model/mariadb/model_user/modelUser";
import "dotenv/config";
import { sMailService } from "../../services/Mails/Mail.service";
import { sColmoticaService } from "../../services/Colmotica/sColmotica.service";
//import { fixBigInt } from "../../util/utils";
import { auth } from "../../auth/middleware/auth";

export class controllerUsers {
  colmoticaService: sColmoticaService;
  mailService: sMailService;

  constructor(colmoticaService: sColmoticaService, mailService: sMailService) {
    this.colmoticaService = colmoticaService;
    this.mailService = mailService;
  }

  listenRoutes() {
    const router = Router();

    router.post("/users", this.cpostUsers.bind(this));
    router.get("/users", controllerUsers.cgetUsers);
    router.post("/users/login", this.cpostLogin.bind(this));
    router.post("/users/verify-code", this.VerifyCode.bind(this));
    router.patch("/users/update/:idUser", controllerUsers.cpatchUsers);
    router.delete("/users/delete/:idUser", controllerUsers.cdeleteUser);
    router.post("/users/sendcode", this.crecoverPass.bind(this));
    router.post("/users/recover-pass", this.cupPass.bind(this));
    router.get("/users/iduser", controllerUsers.cgetIdUsers);
    router.get("/auth/me", auth, this.cgetMe);

    return router;
  }

  async cgetMe(req: Request, res: Response) {
    try {
      const sessionId = req.cookies.session_id;

      console.log(sessionId);

      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      // Busca usuario por ID (sessionId fue guardado como ID_USERS)
      const result = await mUser.mGetById(sessionId);

      if (!result || result.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Sesión inválida",
        });
      }

      const user = result[0];

      return res.status(200).json({
        success: true,
        user: {
          EMAIL: user.EMAIL,
          PASS_HASH: user.PASS_HASH, // Si quieres, puedes omitirlo aquí
        },
      });
    } catch (error) {
      console.error("Error en cgetMe:", error);
      res.status(500).json({ success: false, message: "Error del servidor" });
    }
  }

  async cpostUsers(req: Request, res: Response) {
    const newObj = new mUser(this.colmoticaService);

    try {
      const val = validateUser(req.body);
      if (!val.success) {
        res.status(422).json({
          error: "Digite los datos correctamente postUsers",
          message: JSON.parse(val.error.message),
        });
      } else {
        const result = await newObj.mpostRegistro(val.data);
        console.log(val.data);
        if ("error" in result) {
          res.status(400).json(result);
        } else {
          const token = result.ID_USERS;
          sMailService.sendMail(token, val);
          res.status(201).json({ success: true, result });
        }
      }
    } catch (error) {
      console.error("Error en cpostUsers:", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  static async cgetUsers(_req: Request, res: Response) {
    try {
      const result = await mUser.mgetUsers();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  async cpostLogin(req: Request, res: Response) {
    const valUser = validateLogin(req.body);

    try {
      if (!valUser.success) {
        return res.status(422).json({
          success: false,
          message: "Digite correctamente las credenciales...",
        });
      }

      const result = await mUser.mpostLogin(valUser.data);

      if (!result || result.length === 0) {
        return res
          .status(401)
          .json({ success: false, message: "Credenciales incorrectas." });
      }

      const pass_hash_ok = await this.colmoticaService.valHash(
        valUser.data.PASS_HASH,
        result[0].PASS_HASH
      );

      if (!pass_hash_ok) {
        return res
          .status(401)
          .json({ success: false, message: "Credenciales incorrectas." });
      }

      // ✅ Creamos el token de sesión (puede ser el userID o un JWT como prefieras)
      const sessionToken = result[0].ID_USERS; // SIMPLE: guardamos el ID en la cookie

      // ✅ Seteamos cookie HTTP-only
      res.cookie("session_id", sessionToken, {
        httpOnly: true,
        secure: false, // porque NO estás usando HTTPS
        sameSite: "none", // no uses "none" mientras uses IP
        path: "/",
      });
      return res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
      });
    } catch (error) {
      console.error("Error en cpostLogin: ", error);
      return res
        .status(500)
        .json({ success: false, message: "Error en el servidor" });
    }
  }

  async VerifyCode(req: Request, res: Response) {
    const { email, code } = req.body;
    try {
      const verified = await this.mailService.verifyCode(email, code);
      console.log("Backend recibió:", email, code);
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

  static async cpatchUsers(req: Request, res: Response) {
    try {
      const { idUser } = req.params;

      const result = patchUser(req.body);
      if (!result.success) {
        return res.status(422).json({
          success: false,
          errors: result.error,
        });
      }

      const upUser = await mUser.mupdateUsers(idUser, result.data);

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
      const ls = await mUser.mDeleteuser(idUser);
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

  async crecoverPass(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const data = await sMailService.sendCodeRecover(email);
      if (!data) {
        res.status(400).json({ error: "Codigo invalido o expirado..." });
      } else {
        res.status(200).json({ success: true, message: "Correo enviado" });
      }
    } catch (error) {
      console.error("Error en verifyCode:", error);
      res
        .status(500)
        .json({ success: false, message: "Error en verificación" });
    }
  }

  async cupPass(req: Request, res: Response) {
    const { email, pass } = req.body;

    try {
      const user = await mUser.getEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Correo no encontrado",
        });
      }

      const userInstance = new mUser(new sColmoticaService());
      await userInstance.mrecoverPass(email, pass);

      return res.status(200).json({
        success: true,
        message: "Contraseña cambiada correctamente",
      });
    } catch (error) {
      console.error("Error en cupPass:", error);
      return res.status(500).json({
        success: false,
        message: "Error al cambiar la contraseña",
      });
    }
  }

  async verifyCodeRecover(req: Request, res: Response) {
    const { email, code } = req.body;

    try {
      const valid = await sMailService.verifyRecoverCode(email, code);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Código inválido o expirado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Código verificado correctamente",
      });
    } catch (error) {
      console.error("Error en verifyCodeRecover:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar el código",
      });
    }
  }

  static async cgetIdUsers(_req: Request, res: Response) {
    try {
      const result = await mUser.getIdUsers();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res.status(500).json({ error: "Error del servidor!!" });
    }
  }
}
