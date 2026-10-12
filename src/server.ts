import { Server } from "http";
import app from "./app";
import config from "./config";
import seedSuperAdmin from "./app/DB";
import { setupWebSocketServer } from "./app/modules/socket/socket.controller";

async function main() {
  const server: Server = app.listen(config.port, () => {
    console.log(" Server is running on port ", config.port);
    seedSuperAdmin();
  });

  // Setup WebSocket server
  setupWebSocketServer(server);

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("💥 Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    console.log(error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log(error);
    exitHandler();
  });
}

main();
