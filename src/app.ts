import express from "express";
// import https from "https";
// import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { controllerUsers } from "./controller/controller_users/cUsers";
import { controllerManuals } from "./controller/controller_manuals/cManuals";
import { controllerAdmins } from "./controller/controller_admins/cAdmins";
import { sColmoticaService } from "./services/Colmotica/sColmotica.service";
import { sMailService } from "./services/Mails/Mail.service";
import cookieParser from "cookie-parser";
// import path from "path";

dotenv.config();
const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://192.168.0.169:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.set("trust proxy", 1);
app.use(express.json());

const rcolmoticaUsers = new controllerUsers(
  new sColmoticaService(),
  new sMailService()
);

const rcolmoticaManuals = new controllerManuals(
  new sColmoticaService(),
  new sMailService()
);

const rcolmoticaAdmins = new controllerAdmins(
  new sColmoticaService(),
  new sMailService()
);

app.use("/colmotica", rcolmoticaUsers.listenRoutes());
app.use("/colmotica", rcolmoticaManuals.listenRoutes());
app.use("/colmotica", rcolmoticaAdmins.listenRoutes());

// ---- HTTPS SERVER ----
// Ruta correcta a certs dentro del proyecto
// const keyPath = __dirname + "/certs/colmotica.key";
// const crtPath = __dirname + "/certs/colmotica.crt";

// const privateKey = fs.readFileSync(
//   path.join(process.cwd(), "certs", "colmotica.key"),
//   "utf8"
// );
// const certificate = fs.readFileSync(
//   path.join(process.cwd(), "certs", "colmotica.crt"),
//   "utf8"
// );

// const credentials = { key: privateKey, cert: certificate };

const port = process.env.PORT ?? 1236;

// const server = https.createServer(credentials, app);
app.listen(port, () => {
  console.log(`✅ HTTP Backend on: http://192.168.0.169:${port}`);
});
