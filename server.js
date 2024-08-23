const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";

io.on("connection", (socket) => {
  console.log("A user connected");

  // 新しいプレイヤーに現在のゲーム状態を送信
  socket.emit("updateBoard", { board, currentPlayer });

  socket.on("makeMove", (data) => {
    const { index } = data;

    if (board[index] === "") {
      board[index] = currentPlayer;
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      io.emit("updateBoard", { board, currentPlayer });
    }
  });

  socket.on("restartGame", () => {
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    io.emit("updateBoard", { board, currentPlayer });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.use(express.static("public"));

server.listen(3000, () => {
  console.log("Listening on port 3000");
});
