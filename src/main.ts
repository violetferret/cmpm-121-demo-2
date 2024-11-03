// game data ------------------------------------------------------------------------------
import "./style.css";

const APP_NAME = "Sticker Sketchpad";

// When true, moving the mouse draws on the canvas
let isDrawing = false;

// point / line types
interface Point {
  x: number;
  y: number;
}
type Line = Point[];

// stickers
interface Sticker {
  symbol: string;
  button: HTMLButtonElement | null;
}

// current working
let currentPoint: Point;
let currentLine: Line = [];
let currentCommand: drawCommand;
let cursorPoint: Point;
let currentCursor: string = "⏺";
let currentSticker: Sticker;
let currentCursorCommand: CursorCommand | null;

// marker thickness
const thinMarker: number = 3;
const thickMarker: number = 10;

let currentMarkerThickness: number = thinMarker;

// marker color
let currentMarkerColor: string = "black";

interface markerColor {
  symbol: string;
  color: string;
}

const colors = ["⚫️","🟣","🔵","🟢","🟡","🟠","🔴"];

const markerColors: markerColor[] = [
  { symbol: "⚫️", color: "black" },
  { symbol: "🟣", color: "purple" },
  { symbol: "🔵", color: "blue" },
  { symbol: "🟢", color: "green" },
  { symbol: "🟡", color: "yellow" },
  { symbol: "🟠", color: "orange" },
  { symbol: "🔴", color: "red" },
];

// starter stickers
const stickers: Sticker[] = [
  { symbol: "🌸", button: null },
  { symbol: "🌿", button: null },
  { symbol: "🌈", button: null },
];

// stack of commands
let commandStack: drawCommand[] = [];
const redoStack: drawCommand[] = [];

// drawing changed event
const drawingChanged = new Event("drawing-changed");

// tool moved event
const toolMoved = new Event("tool-moved");

// sticker add event
const stickerAdd = new Event("sticker-add");

// interface / class definitions for draw commands
interface drawCommand {
  execute(ctx: CanvasRenderingContext2D): void;
}

class LineDrawCommand implements drawCommand {
  line: Point[];
  thickness: number;
  color: string;

  constructor(line: Point[], thickness: number, color: string) {
    this.line = line;
    this.thickness = thickness;
    this.color = color;
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = "round";
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.thickness;
    for (let i = 0; i < this.line.length - 1; i++) {
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      ctx.moveTo(this.line[i].x, this.line[i].y);
      ctx.lineTo(this.line[i + 1].x, this.line[i + 1].y);
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// class for cursor commands
class CursorCommand implements drawCommand {
  point: Point;

  constructor(point: Point) {
    this.point = point;
  }
  execute(ctx: CanvasRenderingContext2D) {
    if (currentCursor == undefined) {
      ctx.font = "8px monospace";
      ctx.fillText("⏺", this.point.x - 3, this.point.y + 2);
    } else if (currentCursor == "⏺") {
      ctx.font = "8px monospace";
      ctx.fillText("⏺", this.point.x - 3, this.point.y + 2);
    } else if (colors.find(item => item === currentCursor) == currentCursor) {
      ctx.font = "22px monospace";
      ctx.fillText(currentCursor, this.point.x - 8, this.point.y + 6);
    } else {
      ctx.font = "32px monospace";
      ctx.fillText(currentSticker.symbol, this.point.x - 18, this.point.y + 8);
    }
  }
}

class StickerCommand implements drawCommand {
  point: Point;
  sticker: Sticker;

  constructor(sticker: Sticker, point: Point) {
    this.point = point;
    this.sticker = sticker;
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.fillText(this.sticker.symbol, this.point.x - 18, this.point.y + 8);
  }
}

// function for redrawing canvas
function redrawCanvas() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  commandStack.forEach((command) => {
    command.execute(canvasContext);
  });
  if (currentCursorCommand) {
    currentCursorCommand.execute(canvasContext);
  }
}

// app elements --------------------------------------------------------------------------
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// add game title
const gameName = "Sticker Sketchpad";
document.title = gameName;
const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// add canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D;
app.append(canvas);

// line break
app.append(document.createElement("br"));

// clear button
// learned method from https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingcanvasContext2D/clearRect
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear canvas";
app.append(clearButton);

// undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

// redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

// line break
app.append(document.createElement("br"));

// thickness buttons
const thinMarkerButton = document.createElement("button");
thinMarkerButton.innerHTML = "⏺";
app.append(thinMarkerButton);

const thickMarkerButton = document.createElement("button");
thickMarkerButton.innerHTML = "◯";
app.append(thickMarkerButton);

// line break
app.append(document.createElement("br"));

// custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Custom sticker";
app.append(customStickerButton);

// line break
app.append(document.createElement("br"));

// sticker buttons
for (const sticker of stickers) {
  const button = document.createElement("button");
  button.innerHTML = sticker.symbol;
  app.append(button);
  sticker.button = button;
}

// line break
app.append(document.createElement("br"));

// export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
app.append(exportButton);

// event listeners -----------------------------------------------------------------------
canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

// mouse actions
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [];
  currentPoint = { x: e.offsetX, y: e.offsetY };
  if (currentCursor == "⏺" || colors.find(item => item === currentCursor) == currentCursor) {
    currentLine.push(currentPoint);
    currentCommand = new LineDrawCommand(
      currentLine,
      currentMarkerThickness,
      currentMarkerColor
    );
  } else {
    currentCommand = new StickerCommand(currentSticker, currentPoint);
  }
  commandStack.push(currentCommand);
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    currentPoint = { x: e.offsetX, y: e.offsetY };
    currentLine.push(currentPoint);
    canvas.dispatchEvent(drawingChanged);
    currentCursorCommand = null;
  } else {
    cursorPoint = { x: e.offsetX, y: e.offsetY };
    currentCursorCommand = new CursorCommand(cursorPoint);
    canvas.dispatchEvent(toolMoved);
  }
});

canvas.addEventListener("mouseup", function () {
  isDrawing = false;
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mouseout", function () {
  currentCursorCommand = null;
  canvas.dispatchEvent(toolMoved);
});

canvas.addEventListener("mouseenter", (e) => {
  cursorPoint = { x: e.offsetX, y: e.offsetY };
  currentCursorCommand = new CursorCommand(cursorPoint);
  canvas.dispatchEvent(toolMoved);
});

// clear button
clearButton.addEventListener("click", function () {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  commandStack = [];
  currentLine = [];
});

// undo button
undoButton.addEventListener("click", function () {
  if (commandStack.length > 0) {
    redoStack.push(commandStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

// redo button
redoButton.addEventListener("click", function () {
  if (redoStack.length > 0) {
    commandStack.push(redoStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

// marker buttons
thinMarkerButton.addEventListener("click", function () {
  currentMarkerThickness = thinMarker;
  currentCursor = "⏺";
  currentMarkerColor = "black";
  thinMarkerButton.innerHTML = "⏺";
  thickMarkerButton.innerHTML = "◯";
});

thickMarkerButton.addEventListener("click", function () {
  currentMarkerThickness = thickMarker;
  const randomMarkerColor: markerColor = markerColors[Math.floor(Math.random() * (markerColors.length - 1))];
  currentMarkerColor = randomMarkerColor.color;
  currentCursor = randomMarkerColor.symbol;
  thickMarkerButton.innerHTML = randomMarkerColor.symbol;
  thinMarkerButton.innerHTML = "￮";
});

// sticker buttons
for (const sticker of stickers) {
  if (sticker.button) {
    sticker.button.addEventListener("click", function () {
      currentCursor = sticker.symbol;
      currentSticker = sticker;
    });
  }
}

// custom sticker button
customStickerButton.addEventListener("click", function () {
  const newSymbol: string = prompt("Custom sticker text", "🍊") as string;
  stickers.push({ symbol: newSymbol, button: null });
  canvas.dispatchEvent(stickerAdd);
});

// adding sticker event
canvas.addEventListener("sticker-add", function () {
  for (const sticker of stickers) {
    if (!sticker.button) {
      const button = document.createElement("button");
      button.innerHTML = sticker.symbol;
      app.append(button);
      sticker.button = button;
    }
    for (const sticker of stickers) {
      if (sticker.button) {
        sticker.button.addEventListener("click", function () {
          currentCursor = sticker.symbol;
          currentSticker = sticker;
        });
      }
    }
  }
});

// export button
exportButton.addEventListener("click", function () {
  const exportCanvas = document.createElement("canvas") as HTMLCanvasElement;
  const exportCanvasContext = exportCanvas.getContext(
    "2d"
  ) as CanvasRenderingContext2D;

  exportCanvasContext.canvas.height = 1024;
  exportCanvasContext.canvas.width = 1024;

  exportCanvasContext.scale(4, 4);

  exportCanvasContext.fillStyle = "white";
  exportCanvasContext.fillRect(0, 0, 1024, 1024);

  commandStack.forEach((command) => {
    command.execute(exportCanvasContext);
  });

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});
