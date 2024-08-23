const socket = io();

const config = {
  type: Phaser.AUTO,
  width: 300,
  height: 300,
  scene: {
    create: create,
    restartGame: restartGame,
  },
  parent: "phaser-example",
  backgroundColor: "#FFFFFF",
};

const game = new Phaser.Game(config);
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameText = [];
let gameActive = true;
let restartButton;
let statusText;

function create() {
  const scene = this;

  // 盤面を描画
  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * 100 + 50;
    const y = Math.floor(i / 3) * 100 + 50;

    // グリッド線を描画
    const cell = scene.add
      .rectangle(x, y, 100, 100, 0xdddddd)
      .setStrokeStyle(2, 0x000000);

    // インタラクション設定
    cell.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      if (gameActive && board[i] === "") {
        // クリック時にボードが有効かつ空の場合
        socket.emit("makeMove", { index: i });
      }
    });

    const text = scene.add
      .text(x, y, "", { fontSize: "48px", color: "#000" })
      .setOrigin(0.5, 0.5);
    gameText.push(text);
  }

  // 「もう一度する」ボタンを作成
  restartButton = scene.add
    .text(150, 250, "Play Again", {
      fontSize: "24px",
      color: "#000",
      backgroundColor: "#FFFF00",
    })
    .setOrigin(0.5, 0.5)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", restartGame);

  // 初期状態ではボタンを非表示
  restartButton.setVisible(false);

  // 勝利メッセージを表示するためのテキスト
  statusText = scene.add
    .text(150, 150, "", { fontSize: "32px", color: "#FF0000" })
    .setOrigin(0.5, 0.5);

  // サーバーからのアップデートを受信
  socket.on("updateBoard", (data) => {
    board = data.board;
    currentPlayer = data.currentPlayer;
    gameActive = !checkWinner(); // 勝者がいればゲームを停止
    updateBoard();
  });
}

function updateBoard() {
  for (let i = 0; i < board.length; i++) {
    gameText[i].setText(board[i]);
  }
}

function checkWinner() {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (let combo of winningCombinations) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      statusText.setText(`${board[a]} Wins!`); // 勝者のメッセージを表示
      showRestartButton();
      return true; // 勝者がいることを返す
    }
  }

  if (!board.includes("")) {
    statusText.setText("Draw!"); // 引き分けのメッセージを表示
    showRestartButton();
    return true; // ゲームを終了
  }

  return false; // ゲーム続行
}

function showRestartButton() {
  restartButton.setVisible(true);
  gameActive = false; // ゲームを終了
}

function restartGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  updateBoard();
  restartButton.setVisible(false);
  statusText.setText(""); // 勝利メッセージをクリア
  // サーバーにもリセットを通知
  socket.emit("restartGame");
}
