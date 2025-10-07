import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class sColmoticaService {
  constructor() {}

  createToken(data: any) {
    const token = jwt.sign(
      { creds: data },
      process.env.JWT_SECRET || "tokenSecret",
      { expiresIn: "1h" }
    );
    return token;
  }

  async createHash(input1: string, input2: string) {
    const hashVal = await bcrypt.compare(input1, input2);
    return hashVal;
  }
}
