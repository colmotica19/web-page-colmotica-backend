//app.ts

import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { controllerColmotica } from "./controller/cColmotica";
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

const rColmotica = new controllerColmotica(
  new sColmoticaService(),
  new sMailService()
);
app.use("/colmotica", rColmotica.listenRoutes());

server.listen(port, () => {
  console.log(`Server run from: http://localhost:${port}`);
});
