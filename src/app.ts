//app.ts

import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { controllerUsers } from "./controller/controller_users/cUsers";
import { controllerManuals } from "./controller/controller_manuals/cManuals";
import { controllerAdmins } from "./controller/controller_admins/cAdmins";
import { sColmoticaService } from "./services/Colmotica/sColmotica.service";
import { sMailService } from "./services/Mails/Mail.service";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);
const server = createServer(app);
const port = process.env.PORT ?? 1234;

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

server.listen(port, () => {
  console.log(`Server run from: http://localhost:${port}`);
});
