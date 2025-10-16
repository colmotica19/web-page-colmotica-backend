import { Request, Response, Router } from "express";
import { validateAdmin } from "../../model/validations/schemas";
import { mAdmins } from "../../model/mariadb/model_admins/modelAdmins";
import "dotenv/config";
import { sMailService } from "../../services/Mails/Mail.service";
import { sColmoticaService } from "../../services/Colmotica/sColmotica.service";

export class controllerAdmins {
  colmoticaService: sColmoticaService;
  mailService: sMailService;

  constructor(colmoticaService: sColmoticaService, mailService: sMailService) {
    this.colmoticaService = colmoticaService;
    this.mailService = mailService;
  }

  listenRoutes() {
    const router = Router();

    router.post("/users/admin", controllerAdmins.caggAdmin);
    router.get("/users/admin", controllerAdmins.cgetAdmin);

    return router;
  }

  static async caggAdmin(req: Request, res: Response) {
    const val = validateAdmin(req.body);

    try {
      if (!val.success) {
        res.status(422).json({
          success: false,
          message: "Digite los campos correctamente...",
        });
      } else {
        const result = await mAdmins.maggAdmin(val.data);
        res.status(201).json({ success: true, result });
      }
    } catch (error) {
      res.status(500).json({ error: "Error del servidor!!  (caggAdmin)" });
    }
  }
  static async cgetAdmin(req: Request, res: Response) {
    try {
      const result = await mAdmins.mgetAdmins();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res.status(500).json({ error: "Error del servidor!! (cgetAdmin)" });
    }
  }
}
