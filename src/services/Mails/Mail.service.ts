import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { modelColmotica } from "../../model/mariadb/mColmotica";
import { validateSchema } from "../../model/validations/schemas";

export class sMailService {
  constructor() {}

  static async sendMail(idUser: string, val: Record<string, any>) {
    const envioCorreo = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    const code = Math.floor(100000 + Math.random() * 900000);

    console.log("codigo generado: ", code);

    // Valida esta vaina antes de insertar
    const validate = validateSchema({
      ID_USERS: idUser,
      CONTENT: code,
      DATE: new Date(),
      STATUS: 1,
    });
    console.log(validate.success);

    if (!validate.success) {
      throw new Error(
        "Código inválido: " + JSON.stringify(validate.error.format())
      );
    }

    await modelColmotica.minsertVerificationCode(
      validate.data.ID_USERS,
      validate.data.CONTENT
    );

    console.log("Codigo generado en sendmail: ", code);

    await envioCorreo.sendMail({
      from: `"Colmotica" <${process.env.MAIL_USER}>`,
      to: val.data.EMAIL,
      subject: "Verifica tu cuenta",
      html: `<p>Aqui esta el codigo de verofocacion de tu cuenta (expira en 10m):</p>
        <h2> Codigo: ${code}</h2>`,
    });

    return code.toString();
  }

  async sendMailNoti(email: string) {
    const envioCorreo = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await envioCorreo.sendMail({
      from: `"Colmotica" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta",
      html: `<p>Este usuario ha sido verificado</p>
        <h2> Correo: ${email}</h2>`,
    });
  }

  async verifyCode(idUser: string, code: string): Promise<boolean> {
    const [row] = await modelColmotica.mgetLastVerificationCode(idUser);
    if (!row) return false;

    // Valida la expiración (10 min) del codigo
    const createdAt = new Date(row.CREATED_AT);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;
    if (diffMinutes > 10) return false;

    if (row.CONTENT !== Number(code)) return false;
    // Actualiza
    await modelColmotica.mverifyUser(idUser);
    return true;
  }

  verifyEmail(token: string) {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tokenSecret"
    ) as { EMAIL: string };

    return decoded;
  }
}
