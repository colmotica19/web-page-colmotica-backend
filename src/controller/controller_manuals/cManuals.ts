import { Request, Response, Router } from "express";
import { validateManual } from "../../model/validations/schemas";
import { mManuals } from "../../model/mariadb/model_manuals/modelManuals";
import "dotenv/config";
import { sMailService } from "../../services/Mails/Mail.service";
import { sColmoticaService } from "../../services/Colmotica/sColmotica.service";
import { fixBigInt } from "../../util/utils";

export class controllerManuals {
  colmoticaService: sColmoticaService;
  mailService: sMailService;

  constructor(colmoticaService: sColmoticaService, mailService: sMailService) {
    this.colmoticaService = colmoticaService;
    this.mailService = mailService;
  }

  listenRoutes() {
    const router = Router();

    router.post("/users/manuals", controllerManuals.caggManual);
    router.get("/users/manuals", controllerManuals.cgetManuals);
    router.post("/manuals/req", this.cpostManualRequest.bind(this));
    router.get("/manuals/req/pendiente", this.cgetpendingManuals.bind(this));
    router.get("/manuals/req/total", this.cgetNumberReq.bind(this));
    router.patch("/manuals/req/aprobado", this.cpatchApproveManual.bind(this));
    router.patch("/manuals/req/rechazado", this.cpatchRefusedManual.bind(this));

    return router;
  }

  static async caggManual(req: Request, res: Response) {
    const val = validateManual(req.body);

    try {
      if (!val.success) {
        res.status(422).json({
          success: false,
          message: "Digite los campos correctamente...",
        });
      } else {
        const result = await mManuals.maggManual(val.data);
        res.status(201).json({ success: true, result });
      }
    } catch (error) {
      res.status(500).json({ error: "Error del servidor!!  (caggManual)" });
    }
  }

  static async cgetManuals(req: Request, res: Response) {
    try {
      const result = await mManuals.mgetManuals();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de servidor: ", error);
      res.status(500).json({ error: "Error del servidor!! (cgetManuals)" });
    }
  }

  async cpostManualRequest(req: Request, res: Response) {
    const { ID_MANUALS, ID_USERS } = req.body;
    try {
      const result = await mManuals.mreqManual(ID_MANUALS, ID_USERS);
      if (result !== null) {
        res
          .status(201)
          .json({ message: "Solicitud enviada", result: fixBigInt(result) });
      } else {
        res
          .status(429)
          .json({ error: "El usuario llego al limite de peticiones..." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al solicitar el manual" });
    }
  }

  async cpatchApproveManual(req: Request, res: Response) {
    const { ID_MANUALS_VS_USERS, ID_MANUALS, ID_USERS } = req.body;
    try {
      await this.mailService.approvedManual(
        ID_MANUALS_VS_USERS,
        ID_USERS,
        ID_MANUALS
      );
      res.status(201).json({ message: "Manual aprobado y correo enviado" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al aprobar el manual" });
    }
  }

  async cpatchRefusedManual(req: Request, res: Response) {
    const { ID_MANUALS_VS_USERS, ID_MANUALS, ID_USERS } = req.body;
    try {
      await this.mailService.refusedManual(
        ID_MANUALS_VS_USERS,
        ID_USERS,
        ID_MANUALS
      );
      res.status(201).json({
        message: "Manual rechazado y correo de notificacion enviado",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al rechazar el manual" });
    }
  }

  async cgetpendingManuals(req: Request, res: Response) {
    try {
      const result = await mManuals.mgetpendingManuals();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res
        .status(500)
        .json({ error: "Error del servidor!! (cgetpendingManuals)" });
    }
  }

  async cgetNumberReq(req: Request, res: Response) {
    try {
      const result = await mManuals.mgetNumberReq();
      res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error de serviror: ", error);
      res.status(500).json({ error: "Error del servidor!! (cgetNumberReq)" });
    }
  }
}
