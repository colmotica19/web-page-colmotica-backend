//cUsers.ts

import { Request, Response, Router } from "express";
import { validateLogin, validateUser, patchUser } from "../../model/validations/schemas";
import { mUser } from "../../model/mariadb/model_user/modelUser";
import "dotenv/config";
import { sMailService } from "../../services/Mails/Mail.service";
import { sColmoticaService } from "../../services/Colmotica/sColmotica.service";
//import { fixBigInt } from "../../util/utils";
import { auth } from "../../auth/middleware/auth";
import { mCode } from "../../model/mariadb/model_mails/modelCode";

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
    router.post("/users/verify-code-recover", this.verifyCodeRecover.bind(this));
    router.get("/users/iduser", controllerUsers.cgetIdUsers);
    router.get("/auth/me", auth, this.cgetMe);
    router.post("/auth/logout", this.logout);
    router.post("/users/status-verify-code", controllerUsers.stateVerify);
    router.post("/users/type-user", controllerUsers.typeUser);
    router.post("/users/cant-request-manuals", controllerUsers.requestManuals);

    return router;
  }

  async cgetMe(req: Request, res: Response) {
    try {
      const userId = req.cookies.session_id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "No hay sesión activa",
        });
      }

      const user = await mUser.mGetById(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Sesión inválida",
        });
      }

      // Determinar rol
      let roleName = "USUARIO";
      if (user.ID_ROL === 10001) {
        roleName = "SUPER_ADMIN";
      }
      if (user.ID_ROL === 10002) {
        roleName = "ADMINISTRADOR";
      }

      return res.status(200).json({
        success: true,

        user: {
          ID_USERS: user.ID_USERS,
          ID_ROL: user.ID_ROL,
          ROL_NAME: roleName,
          EMAIL: user.EMAIL,
          NAME: user.NAME,
          PAIS: user.PAIS,
          TEL: user.TEL,
          PASS_HASH: user.PASS_HASH,
          VERIFIED: user.VERIFIED,
        },

        // 🔥 LO QUE TU FRONT NECESITA
        userType: {
          success: true,
          message: roleName,
        },
      });
    } catch (error) {
      console.error("Error en cgetMe:", error);
      res.status(500).json({
        success: false,
        message: "Error del servidor",
      });
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

  static async cgetUsers(req: Request, res: Response) {
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
        return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
      }

      const pass_hash_ok = await this.colmoticaService.valHash(valUser.data.PASS_HASH, result[0].PASS_HASH);

      if (!pass_hash_ok) {
        return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
      }

      // ✅ Creamos el token de sesión (puede ser el userID o un JWT como prefieras)
      const sessionToken = result[0].ID_USERS; // SIMPLE: guardamos el ID en la cookie

      // ✅ Seteamos cookie HTTP-only
      res.cookie("session_id", sessionToken, {
        httpOnly: true,
        secure: false, // porque NO estás en https
        sameSite: "lax",
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Login exitoso",
        user: {
          ID_ROL: result[0].ID_ROL,
          VERIFIED: result[0].VERIFIED,
        },
      });
    } catch (error) {
      console.error("Error en cpostLogin: ", error);
      return res.status(500).json({ success: false, message: "Error en el servidor" });
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
        res.status(400).json({ success: false, message: "Código inválido o expirado" });
      }
    } catch (error) {
      console.error("Error en verifyCode:", error);
      res.status(500).json({ success: false, message: "Error en verificación" });
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
      return res.status(200).json({ success: true, message: "Usuario eliminado..." });
    } catch (err) {
      console.error("Error en cdeleteUsers:", err);
      return res.status(500).json({ error: "Error del servidor!!" });
    }
  }

  async crecoverPass(req: Request, res: Response) {
    const { email } = req.body;

    console.log(email);

    try {
      const data = await sMailService.sendCodeRecover(email);

      console.log(data);

      if (!data) {
        res.status(400).json({ error: "EL usuario no esta registrado..." });
      } else {
        res.status(200).json({ success: true, message: "Correo enviado" });
      }
    } catch (error) {
      console.error("Error en verifyCode:", error);
      res.status(500).json({ success: false, message: "Error en verificación" });
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

      // 1️⃣ Obtener el último código
      const codeData = await mCode.mgetLastCode(email);

      if (!codeData || codeData.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Debe solicitar un código de recuperación",
        });
      }

      const code = codeData[0];

      // 2️⃣ Validar que sea de recuperación
      if (code.TYPE !== "RECUPERACION") {
        return res.status(401).json({
          success: false,
          message: "Debe verificar el código de recuperación",
        });
      }

      // 3️⃣ Validar que el código YA HAYA SIDO VERIFICADO
      if (code.STATUS !== 0) {
        return res.status(401).json({
          success: false,
          message: "Debe verificar el código antes de cambiar la contraseña",
        });
      }

      // 4️⃣ Cambiar contraseña
      const userInstance = new mUser(new sColmoticaService());

      const usageCount = await mCode.getUsage(code.CONTENT);

      console.log(usageCount[0].USAGE_COUNT);

      if (usageCount[0].USAGE_COUNT >= 1) {
        return res.status(401).json({
          success: false,
          message: "El código ya ha sido utilizado para cambiar la contraseña",
        });
      }

      await userInstance.mrecoverPass(email, pass);
      const insertUsageCount = await mCode.musageCount(code.CONTENT);
      console.log("Se sumo el contador: ", insertUsageCount);

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
      const valid = await this.mailService.verifyCode(email, code);
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

  async logout(req: Request, res: Response) {
    console.log(true);

    res.clearCookie("session_id", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente",
    });
  }

  static async stateVerify(req: Request, res: Response) {
    const { email } = req.body;

    const verify = await mCode.mstatusVerify(email);

    console.log(verify);

    try {
      if (verify[0].VERIFIED === 0) {
        return res.status(200).json({
          success: false,
          message: "Autorizado pero no se ha verificado aun...",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Usuario verificado",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error del servidor...",
      });
    }
  }

  static async typeUser(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const type = await mUser.mtypeUser(email);

      console.log(type);

      if (type[0].ID_ROL === 10001) {
        return res.status(200).json({
          success: true,
          message: "SUPER_ADMIN",
        });
      } else if (type[0].ID_ROL === 10002) {
        return res.status(200).json({
          success: true,
          message: "ADMINISTRADOR",
        });
      } else if (type[0].ID_ROL === 10003) {
        return res.status(200).json({
          success: true,
          message: "USUARIO",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Rol no identificado...",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error del servidor...",
      });
    }
  }

  static async requestManuals(req: Request, res: Response) {
    const { ID_MANUALS, ID_USERS } = req.body;

    try {
      const result = await mUser.mrequestManuals(ID_MANUALS, ID_USERS);

      if (!result) {
        return res.status(400).json({
          success: false,
          message: "Error al solicitar el manual...",
        });
      } else {
        return res.status(200).json({
          success: true,
          result: result,
        });
      }
    } catch (error) {
      console.error("Error en requestManuals:", error);
      return res.status(500).json({
        success: false,
        message: "Error del servidor...",
      });
    }
  }
}
