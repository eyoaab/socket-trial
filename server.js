const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store the last five messages in memory
let messageHistory = [];

// HTTP endpoint to return the last five messages
app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    lastFiveMessages: messageHistory,
  });
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("A user connected");
  //  just emit some data to the client
  let counter = 0;
  const maxCount = 10;

  const intervalId = setInterval(() => {
    counter++;
    if (counter >= maxCount) {
      clearInterval(intervalId);
      io.emit("delivery_status_update", {
        status: "ongoing",
        message: "Your delivery status has been updated to: ongoing.",
      });
    }
  }, 5000);

  // Handle message send event
  socket.on("message:send", (data) => {
    console.log("Message received:", data);

    // Store the latest message in the message history
    messageHistory.push(data);

    // Keep only the last five messages in history
    if (messageHistory.length > 10) {
      messageHistory.shift(); // Remove the oldest message
    }

    // Emit message:delivered with only the latest message to the sender
    socket.emit("message:delivered", { ...data, status: "delivered" });

    // Emit message:received to all clients, including the sender
    io.emit("message:received", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };
});

// Listen on the specified port (Render will automatically set the port in the environment variable)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
