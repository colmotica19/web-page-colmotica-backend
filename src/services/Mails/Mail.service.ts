//Mail.service.ts

import { mUser } from "../../model/mariadb/model_user/modelUser";
import { mCode } from "../../model/mariadb/model_mails/modelCode";
import { mNoti } from "../../model/mariadb/model_mails/modelNoti";
import { mManuals } from "../../model/mariadb/model_manuals/modelManuals";
import { validateSchema } from "../../model/validations/schemas";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { sColmoticaService } from "../Colmotica/sColmotica.service";

export class sMailService {
  static async sendMail(idUser: string, val: Record<string, any>) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const code = Math.floor(100000 + Math.random() * 900000);
      console.log("Código generado:", code);

      const validate = validateSchema({
        ID_USERS: idUser,
        CONTENT: code,
        DATE: new Date(),
        STATUS: 1,
      });

      if (!validate.success) {
        throw new Error(
          "Código inválido: " + JSON.stringify(validate.error.format())
        );
      }

      await mCode.minsertVerificationCode(
        validate.data.ID_USERS,
        validate.data.CONTENT
      );

      console.log("Código guardado en DB:", code);

      const response = await resend.emails.send({
        from: `Colmotica <${process.env.MAIL_FROM}>`,
        to: val.data.EMAIL,
        subject: "Verifica tu cuenta",
        html: `
        <p>Hola ${val.data.NAME || "usuario"},</p>
        <p>Tu código de verificación (expira en 10 minutos):</p>
        <h2>${code}</h2>
        <p>Si no solicitaste esta verificación, ignora este correo.</p>`,
      });

      console.log("Correo enviado:", response);

      await sMailService.sendMailNoti(val.data.EMAIL);

      return code.toString();
    } catch (error) {
      console.error(error);
      throw new Error("Fallo al enviar correo");
    }
  }

  static async sendMailNoti(emailUsuario: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      const emailsNoti = await mNoti.sendNoti();

      if (!emailsNoti || emailsNoti.length === 0) return;

      for (const row of emailsNoti) {
        await resend.emails.send({
          from: `Colmotica <${process.env.MAIL_FROM}>`,
          to: row.EMAIL,
          subject: "Nuevo usuario registrado en Colmotica",
          html: `
            <p>Hola,</p>
            <p>Se ha registrado un nuevo usuario en la plataforma Colmotica.</p>
            <p><b>Correo del usuario:</b> ${emailUsuario}</p>
            <p>Por favor, verifica el registro si es necesario.</p>
          `,
        });
        console.log(`Correo enviado a: ${row.EMAIL}`);
      }
    } catch (error) {
      console.error("Error enviando correos de notificación:", error);
      throw new Error("Fallo al enviar correo");
    }
  }

  async verifyCode(idUser: string, code: string): Promise<boolean> {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const [row] = await mCode.mgetLastVerificationCode(idUser);
    if (!row) return false;

    const createdAt = new Date(row.CREATED_AT);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;
    if (diffMinutes > 10) return false;

    if (Number(row.CONTENT) !== Number(code)) return false;

    await mUser.mverifyUser(idUser);
    await mCode.mdeactivateCode(row.ID_CODE);
    const email = await mNoti.sendNoti();
    if (!email || email.length === 0) return true;

    console.log(email);

    try {
      for (const row of email) {
        await resend.emails.send({
          from: `Colmotica <${process.env.MAIL_FROM}>`,
          to: row.EMAIL,
          subject: "Usuario verificado en Colmotica!!",
          html: `
            <p>Hola,</p>
            <p>Se ha verificado un nuevo usuario en la plataforma Colmotica.</p>
            <p><b>Correo del usuario:</b> ${row.EMAIL}</p>

          `,
        });
      }
    } catch (error) {
      console.error("Error al enviar el codigo:", error);
      throw new Error("Fallo al enviar correo");
    }

    return true;
  }

  async approvedManual(ID: BigInt, idUser: string, idManual: string) {
    await mManuals.mapprovedManual(ID, idManual, idUser);

    const emailManual: any = await mNoti.sendNotimanual(idUser, idManual);

    const [data] = await mManuals.mgetUserManualInfo(idUser, idManual);
    if (!data) return false;

    try {
      for (const row of emailManual) {
        const pdfManual = path.resolve(
          __dirname,
          "../../assets/manuals",
          `${row.NAME}.pdf`
        );
        const pdfManualread = fs.readFileSync(pdfManual);
        const pdfManual64 = pdfManualread.toString("base64");

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: `Colmotica <${process.env.MAIL_FROM}>`,
          to: row.EMAIL,
          subject: `Tu manual ${row.NAME} ha sido aprobado`,
          html: `
      <p>Hola,</p>
      <p>Tu solicitud del manual <b>${row.NAME}</b> ha sido aprobada.</p>
    `,

          attachments: [
            {
              filename: `${row.NAME}.pdf`,
              content: pdfManual64,
            },
          ],
        });

        console.log("Correo enviado...");
      }
    } catch (error) {
      console.error("Error enviando correo:", error);
      throw new Error("Fallo al enviar correo");
    }
  }

  async refusedManual(ID: BigInt, idUser: string, idManual: string) {
    await mManuals.mrefusedManual(ID, idManual, idUser);

    const emailManual: any = await mNoti.sendNotimanual(idUser, idManual);

    const [data] = await mManuals.mgetUserManualInfo(idUser, idManual);
    if (!data) return false;

    try {
      console.log({ emailManual });
      for (const row of emailManual) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: `Colmotica <${process.env.MAIL_FROM}>`,
          to: row.EMAIL,
          subject: `Tu manual ${row.NAME} ha sido rechazado`,
          html: `
      <p>Hola,</p>
      <p>Tu solicitud del manual <b>${row.NAME}</b> ha sido rechazada.</p>
      <p>Contactate con el administrador.</p>
    `,
        });

        console.log("Correo enviado...");
      }
    } catch (error) {
      console.error("Error enviando correo:", error);
      throw new Error("Fallo al enviar correo");
    }
  }

  static async sendCodeRecover(email: string) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const user = await mUser.getEmail(email);
      if (!user) return false;

      const code = Math.floor(100000 + Math.random() * 900000);
      console.log("Código generado:", code);

      const idUser: string | null = await mUser.getId(email);
      if (!idUser) return false;

      const response = await resend.emails.send({
        from: `Colmotica <${process.env.MAIL_FROM}>`,
        to: user.EMAIL,
        subject: "Recupera tu cuenta",
        html: `
        <p>Hola ${user.NAME || "usuario"},</p>
        <p>Tu código para cambiar tu clave (expira en 10 minutos):</p>
        <h2>${code}</h2>`,
      });

      console.log("Correo enviado:", response);

      await mCode.minsertRecoverCode(idUser, code);

      return true;
    } catch (error) {
      console.error({ error_message: error });
      throw error;
    }
  }

  static async verifyCodeRecover(email: string, code: string, newPass: string) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const user = await mUser.getEmail(email);
      if (!user) return false;

      // Buscar el último código tipo RECUPERACION
      const [row] = await mCode.mgetLastCodeByType(
        user.ID_USERS,
        "RECUPERACION"
      );
      if (!row) return false;

      // Validar que el código sea el mismo
      if (Number(row.CONTENT) !== Number(code)) {
        console.warn("Código incorrecto");
        return false;
      }

      // Validar tiempo (10 min)
      const createdAt = new Date(row.CREATED_AT);
      const diffMinutes = (Date.now() - createdAt.getTime()) / 60000;
      if (diffMinutes > 10) {
        console.warn("Código expirado");
        return false;
      }

      // ✅ Si todo está bien, cambiar la contraseña
      const userInstance = new mUser(new sColmoticaService());
      await userInstance.mrecoverPass(email, newPass);

      // Desactivar el código
      await mCode.mdeactivateCode(row.ID_CODE);

      // Avisar al usuario
      await resend.emails.send({
        from: `Colmotica <${process.env.MAIL_FROM}>`,
        to: user.EMAIL,
        subject: "Contraseña cambiada correctamente",
        html: `<p>Hola ${user.NAME || "usuario"},</p>
             <p>Tu contraseña ha sido cambiada con éxito.</p>`,
      });

      return true;
    } catch (error) {
      console.error("Error en verifyCodeRecover:", error);
      return false;
    }
  }

  static async verifyRecoverCode(email: string, code: string) {
    try {
      const user = await mUser.getEmail(email);
      if (!user) return false;

      const [row] = await mCode.mgetLastCodeByType(
        user.ID_USERS,
        "RECUPERACION"
      );
      if (!row) return false;

      // Validar código
      if (Number(row.CONTENT) !== Number(code)) return false;

      // Validar expiración (10 minutos)
      const createdAt = new Date(row.CREATED_AT);
      const diffMinutes = (Date.now() - createdAt.getTime()) / 60000;
      if (diffMinutes > 10) return false;

      // ✅ Si todo va bien, desactivar el código para que no se use de nuevo
      await mCode.mdeactivateCode(row.ID_CODE);

      return true;
    } catch (error) {
      console.error("Error en verifyRecoverCode:", error);
      return false;
    }
  }
}
