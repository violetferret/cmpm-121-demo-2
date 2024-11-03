import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
// app.innerHTML = APP_NAME;

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

// Original implementation of canvas drawing was taken from Mozilla web developer docs
// https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event

// When true, moving the mouse draws on the canvas
let isDrawing = false;
let x = 0;
let y = 0;

interface Point {
  x: number;
  y: number;
}
type Line = Point[];

let currentPoint: Point;
let currentLine: Line = [];
let currentCommand: drawCommand;

const thinMarker: number = 3;
const thickMarker: number = 10;

let currentThickness: number = thinMarker;


let commandStack: drawCommand[] = [];
const redoStack: drawCommand[] = [];

const drawingChanged = new Event("drawing-changed");

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

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [];
  x = e.offsetX;
  y = e.offsetY;
  currentPoint = { x, y };
  currentLine.push(currentPoint);
  currentCommand = new LineDrawCommand(canvasContext, currentLine, currentThickness);
  commandStack.push(currentCommand);
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    x = e.offsetX;
    y = e.offsetY;
    currentPoint = { x, y };
    currentLine.push(currentPoint);
    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseup", function () {
  isDrawing = false;
  // commandStack.push(new LineDrawCommand(canvasContext, currentLine));
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("drawing-changed", function () {
  canvasContext.clearRect(0, 0, 256, 256);
  commandStack.forEach((command) => {
    command.execute();
  });
});

// line break
const br = document.createElement("br");
app.append(br);

// clear button
// learned method from https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingcanvasContext2D/clearRect
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear canvas";
app.append(clearButton);

clearButton.addEventListener("click", function () {
  canvasContext.clearRect(0, 0, 256, 256);
  commandStack = [];
  currentLine = [];
});

// undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

undoButton.addEventListener("click", function () {
  if (commandStack.length > 0) {
    redoStack.push(commandStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

// redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

redoButton.addEventListener("click", function () {
  if (redoStack.length > 0) {
    commandStack.push(redoStack.pop() as drawCommand);
    canvas.dispatchEvent(drawingChanged);
  }
});

// thickness buttons
const thinMarkerButton = document.createElement("button");
thinMarkerButton.innerHTML = "⏺";
app.append(thinMarkerButton);

thinMarkerButton.addEventListener("click", function() {
  currentThickness = thinMarker;
  thinMarkerButton.innerHTML = "⏺";
  thickMarkerButton.innerHTML = "◯";
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.innerHTML = "◯";
app.append(thickMarkerButton);

thickMarkerButton.addEventListener("click", function() {
  currentThickness = thickMarker;
  thickMarkerButton.innerHTML = "⚪";
  thinMarkerButton.innerHTML = "￮";
});

