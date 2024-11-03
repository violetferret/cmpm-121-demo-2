// game data ------------------------------------------------------------------------------
import "./style.css";

const APP_NAME = "Sticker Sketchpad";

// When true, moving the mouse draws on the canvas
let isDrawing = false;
let x = 0;
let y = 0;

interface Point {
  x: number;
  y: number;
}
type Line = Point[];

// current working
let currentPoint: Point;
let currentLine: Line = [];
let currentCommand: drawCommand;
let cursorPoint: Point;
let currentCursor: string = "⏺";
let cursorCommand: CursorCommand | null;

// marker thickness
const thinMarker: number = 3;
const thickMarker: number = 10;
let currentThickness: number = thinMarker;

// stack of commands
let commandStack: drawCommand[] = [];
const redoStack: drawCommand[] = [];

// drawing changed event
const drawingChanged = new Event("drawing-changed");

// tool moved event
const toolMoved = new Event("tool-moved");

// stickers
interface Sticker {
  symbol: string,
  button: HTMLButtonElement | null
}

let currentSticker: Sticker; 

const stickers: Sticker[] = [
  {symbol: "🌸", button: null},
  {symbol: "🌿", button: null},
  {symbol: "🌈", button: null}
];

// interface / class definitions for draw commands
interface drawCommand {
  execute(): void;
}

class LineDrawCommand implements drawCommand {
  ctx: CanvasRenderingContext2D;
  line: Point[];
  thickness: number;

  constructor(ctx: CanvasRenderingContext2D, line: Point[], thickness: number) {
    this.ctx = ctx;
    this.line = line;
    this.thickness = thickness;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = thickness;
  }

  execute(): void {
    for (let i = 0; i < this.line.length - 1; i++) {
      this.ctx.lineWidth = this.thickness;
      this.ctx.beginPath();
      this.ctx.moveTo(this.line[i].x, this.line[i].y);
      this.ctx.lineTo(this.line[i + 1].x, this.line[i + 1].y);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }
}

// class for cursor commands
class CursorCommand implements drawCommand {
  ctx: CanvasRenderingContext2D;
  point: Point;

  constructor(ctx: CanvasRenderingContext2D, point: Point) {
    this.ctx = ctx;
    this.point = point
  }
  execute() {
    if (currentCursor == undefined) {
      this.ctx.font = "8px monospace";
      this.ctx.fillText("⏺", this.point.x - 3, this.point.y + 2);
  } else if (currentCursor == "⏺") {
      this.ctx.font = "8px monospace";
      this.ctx.fillText("⏺", this.point.x - 3, this.point.y + 2);
    } else if (currentCursor == "⚪") {
      this.ctx.font = "22px monospace";
      this.ctx.fillText("⏺", this.point.x - 8, this.point.y + 6);
    } else {
      this.ctx.font = "32px monospace";
      this.ctx.fillText(currentSticker.symbol, this.point.x - 18, this.point.y + 8);
    }
  }
}

class StickerCommand implements drawCommand {
  ctx: CanvasRenderingContext2D;
  point: Point;
  sticker: Sticker;

  constructor(ctx: CanvasRenderingContext2D, sticker: Sticker, point: Point) {
    this.ctx = ctx;
    this.point = point;
    this.sticker = sticker;
  }

  execute(): void {
    this.ctx.fillText(this.sticker.symbol, this.point.x - 18, this.point.y + 8);
  }
}

// function for redrawing canvas
function redrawCanvas() {
  canvasContext.clearRect(0, 0, 256, 256);
  commandStack.forEach((command) => {
    command.execute();
  });
  if (cursorCommand) {
    cursorCommand.execute();
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

// sticker buttons
for (const sticker of stickers) {
  const button = document.createElement("button");
  button.innerHTML = sticker.symbol;
  app.append(button);
  sticker.button = button;
}

// event listeners -----------------------------------------------------------------------
canvas.addEventListener("drawing-changed", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [];
  currentPoint = { x: e.offsetX, y: e.offsetY };
  if (currentCursor == "⏺" || currentCursor == "⚪") {
    currentLine.push(currentPoint);
    currentCommand = new LineDrawCommand(
      canvasContext,
      currentLine,
      currentThickness
  );
  } else {
    currentCommand = new StickerCommand(canvasContext, currentSticker, currentPoint)
  }
  commandStack.push(currentCommand);
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    currentPoint = { x: e.offsetX, y: e.offsetY };
    currentLine.push(currentPoint);
    canvas.dispatchEvent(drawingChanged);
    cursorCommand = null;
  } else {
    cursorPoint = {x: e.offsetX, y: e.offsetY};
    cursorCommand = new CursorCommand(canvasContext, cursorPoint);
    canvas.dispatchEvent(toolMoved);
  }
});

canvas.addEventListener("mouseup", function () {
  isDrawing = false;
  canvas.dispatchEvent(drawingChanged);
});


canvas.addEventListener("mouseout", function () {
  cursorCommand = null;
  canvas.dispatchEvent(toolMoved);
});

canvas.addEventListener("mouseenter", (e) => {
  cursorPoint = {x: e.offsetX, y: e.offsetY};
  cursorCommand = new CursorCommand(canvasContext, cursorPoint);
  canvas.dispatchEvent(toolMoved);
});

clearButton.addEventListener("click", function () {
  canvasContext.clearRect(0, 0, 256, 256);
  commandStack = [];
  currentLine = [];
});

undoButton.addEventListener("click", function () {
  if (commandStack.length > 0) {
    redoStack.push(commandStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

redoButton.addEventListener("click", function () {
  if (redoStack.length > 0) {
    commandStack.push(redoStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

thinMarkerButton.addEventListener("click", function () {
  currentThickness = thinMarker;
  currentCursor = "⏺";
  thinMarkerButton.innerHTML = "⏺";
  thickMarkerButton.innerHTML = "◯";
});

thickMarkerButton.addEventListener("click", function () {
  currentThickness = thickMarker;
  currentCursor = "⚪";
  thickMarkerButton.innerHTML = "⚪";
  thinMarkerButton.innerHTML = "￮";
});

for (const sticker of stickers) {
  if (sticker.button) {
  sticker.button.addEventListener("click", (e) => {
    currentCursor = sticker.symbol;
    currentSticker = sticker;
  })
  }
}
