//Mail.service.ts

import { mUser } from "../../model/mariadb/model_user/modelUser";
import { mCode } from "../../model/mariadb/model_mails/modelCode";
import { mNoti } from "../../model/mariadb/model_mails/modelNoti";
import { mManuals } from "../../model/mariadb/model_manuals/modelManuals";
import { validateSchema } from "../../model/validations/schemas";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
//import { sColmoticaService } from "../Colmotica/sColmotica.service";

export class sMailService {
  static async sendMail(idUser: string, val: Record<string, any>) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: process.env.MAIL_FROM,
          pass: process.env.PASS_APLICATION,
        },
      });

      const code = Math.floor(100000 + Math.random() * 900000);
      console.log("Código generado:", code);

      const validate = validateSchema({
        ID_USERS: idUser,
        CONTENT: code,
        DATE: new Date(),
        STATUS: 1,
        EMAIL: val.data.EMAIL,
      });

      if (!validate.success) {
        throw new Error("Código inválido: " + JSON.stringify(validate.error.format()));
      }

      await mCode.minsertVerificationCode(validate.data.EMAIL, validate.data.CONTENT);

      console.log("Código guardado en DB:", code);

      const response = await transporter.sendMail({
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
    try {
      const emailsNoti = await mNoti.sendNoti();

      const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: process.env.MAIL_FROM,
          pass: process.env.PASS_APLICATION,
        },
      });

      if (!emailsNoti || emailsNoti.length === 0) return;

      for (const row of emailsNoti) {
        await transporter.sendMail({
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

  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_FROM,
          pass: process.env.PASS_APLICATION,
        },
      });

      // 🔹 1. Buscar el último código (sin importar tipo)
      console.log(true);
      const [row] = await mCode.mgetLastCode(email);
      if (!row) {
        console.warn("❌ No se encontró ningún código para:", email);
        return false;
      }

      console.log("🔎 Código encontrado:", row.CONTENT, "Tipo:", row.TYPE);

      // 🔹 2. Validar el tiempo
      const dbDateString = row.CREATED_AT.toString();
      const dateWithoutTZ = dbDateString.replace("T", " ").replace(/\.000Z$/, "");
      const createdAt = new Date(dateWithoutTZ);
      const diffMinutes = (Date.now() - createdAt.getTime()) / 60000;

      if (diffMinutes > 10) {
        console.warn("⌛ Código expirado:", diffMinutes);
        return false;
      }

      // 🔹 3. Validar el código
      if (Number(row.CONTENT) !== Number(code)) {
        console.warn("⚠️ Código incorrecto:", row.CONTENT, code);
        return false;
      }

      // 🔹 4. Aplicar lógica según el tipo
      switch (row.TYPE) {
        case "VERIFICACION": {
          console.log("✅ Código de registro válido");
          await mUser.mverifyUser(email);
          await mCode.mdeactivateCode(row.CONTENT);

          // notificar al admin
          const notiList = await mNoti.sendNoti();

          if (notiList?.length) {
            for (const n of notiList) {
              await transporter.sendMail({
                from: `Colmotica <${process.env.MAIL_FROM}>`,
                to: n.EMAIL,
                subject: "Usuario verificado en Colmotica!!",
                html: `
                <p>Hola,</p>
                <p>Se ha verificado un nuevo usuario en la plataforma Colmotica.</p>
                <p><b>Correo del usuario:</b> ${email}</p>
              `,
              });
            }
          }
          break;
        }
        case "RECUPERACION":
          console.log("✅ Código de recuperación válido");
          // Aquí no activas usuario, solo confirmas que puede cambiar la contraseña
          // Si quieres, puedes desactivar el código para que no se reutilice
          await mCode.mdeactivateCode(row.CONTENT);
          break;

        default:
          console.warn("❌ Tipo de código desconocido:", row.TYPE);
          return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Error en verifyCode:", error);
      return false;
    }
  }

  async approvedManual(ID: BigInt, idUser: string, idManual: string) {
    await mManuals.mapprovedManual(ID, idManual, idUser);

    const emailManual: any = await mNoti.sendNotimanual(idUser, idManual);

    const [data] = await mManuals.mgetUserManualInfo(idUser, idManual);
    if (!data) {
      return false;
    }

    try {
      for (const row of emailManual) {
        const pdfManual = path.resolve(__dirname, "../../assets/manuals", `${row.NAME}.pdf`);
        const pdfManualread = fs.readFileSync(pdfManual);
        const pdfManual64 = pdfManualread.toString("base64");

        const transporter = nodemailer.createTransport({
          service: "gmail",

          auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.PASS_APLICATION,
          },
        });
        await transporter.sendMail({
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
    if (!data) {
      return false;
    }

    try {
      console.log({ emailManual });
      for (const row of emailManual) {
        const transporter = nodemailer.createTransport({
          service: "gmail",

          auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.PASS_APLICATION,
          },
        });
        await transporter.sendMail({
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
      const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: process.env.MAIL_FROM,
          pass: process.env.PASS_APLICATION,
        },
      });
      const user = await mUser.getEmail(email);
      if (!user) {
        return false;
      }

      const code = Math.floor(100000 + Math.random() * 900000);
      console.log("Código generado:", code);

      const idUser: string | null = await mUser.getId(email);
      if (!idUser) {
        return false;
      }

      const response = await transporter.sendMail({
        from: `Colmotica <${process.env.MAIL_FROM}>`,
        to: user.EMAIL,
        subject: "Recupera tu cuenta",
        html: `
        <p>Hola ${user.NAME || "usuario"},</p>
        <p>Tu código para cambiar tu clave (expira en 10 minutos):</p>
        <h2>${code}</h2>`,
      });

      console.log("Correo enviado:", response);

      await mCode.minsertRecoverCode(email, code);

      return true;
    } catch (error) {
      console.error({ error_message: error });
      throw error;
    }
  }
}
