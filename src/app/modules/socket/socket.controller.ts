import { WebSocket, WebSocketServer } from "ws";
import prisma from "../../../shared/prisma";
import { verifyWebSocketToken } from "./socket.service";

// Connected clients store
const clients = new Map<string, WebSocket>(); // key = clientId
const admins = new Map<string, WebSocket>(); // key = adminId

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    // ---- Parse query params ----
    const params = new URLSearchParams(req.url?.split("?")[1]);
    const adminToken = params.get("adminToken");
    const clientId = params.get("clientId");
    let adminId: string | null = null;

    if (clientId) {
      clients.set(clientId, ws);
      console.log("🟢 Client connected:", clientId);
    }
    console.log("adminToken in backend", adminToken);
    if (adminToken) {
      const isVerifiedAdmin = verifyWebSocketToken(ws, adminToken as string);

      if (isVerifiedAdmin) {
        admins.set(isVerifiedAdmin.id, ws);
        adminId = isVerifiedAdmin.id;
        console.log("🟢 Admin connected:", isVerifiedAdmin.id);
      } else {
        console.log("🔴 Admin connection failed");
        ws.close();
      }
    }

    ws.on("message", async (msg: any) => {
      try {
        const data = JSON.parse(msg.toString());
        const { type, content } = data;

        // -------------------------
        // Client sends a message
        // -------------------------
        if (type === "client-message" && clientId) {
          // Find or create a room
          let room = await prisma.chatRoom.findFirst({ where: { clientId } });
          if (!room) {
            room = await prisma.chatRoom.create({
              data: { clientId },
            });
          }

          // Check if user is restricted
          if (room.isRestricted) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  "You have been restricted from sending messages. Please contact support.",
              }),
            );
            return;
          }

          // Save message
          const message = await prisma.message.create({
            data: {
              roomId: room.id,
              senderType: "client",
              senderId: clientId,
              content,
            },
          });

          // Send message to admin(s)
          for (const [aid, adminWs] of admins) {
            if (adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(
                JSON.stringify({
                  type: "new-message",
                  from: "client",
                  clientId,
                  message,
                }),
              );
            }
          }
        }

        // -------------------------
        // Admin sends a message
        // -------------------------
        if (type === "admin-message" && adminId && data.clientId) {
          const clientId = data.clientId;

          // Find or create room
          let room = await prisma.chatRoom.findFirst({ where: { clientId } });
          if (!room) {
            room = await prisma.chatRoom.create({
              data: { clientId, adminId },
            });
          } else if (!room.adminId) {
            await prisma.chatRoom.update({
              where: { id: room.id },
              data: { adminId },
            });
          }

          // Save message
          const message = await prisma.message.create({
            data: {
              roomId: room.id,
              senderType: "admin",
              senderId: adminId,
              content,
            },
          });

          // Send to client
          const clientWs = clients.get(clientId);
          if (clientWs && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "new-message",
                from: "admin",
                message,
              }),
            );
          }
        }

        // -------------------------
        // Fetch past messages
        // -------------------------
        if (type === "fetch-history") {
          const targetClient = data.clientId || clientId;
          const room = await prisma.chatRoom.findFirst({
            where: { clientId: targetClient },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          });

          ws.send(
            JSON.stringify({
              type: "message-history",
              clientId: targetClient,
              messages: room?.messages || [],
            }),
          );
        }
      } catch (error) {
        console.error("WS Error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      if (clientId) clients.delete(clientId);
      if (adminId) admins.delete(adminId);
      console.log("🔴 Disconnected:", clientId || adminId);
    });
  });

  console.log("✅ WebSocket server started!");
}
