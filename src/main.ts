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
let index = 0;

interface Point {
  x: number;
  y: number;
}
type Line = Point[];
let lines: Line[] = [];

let currentPoint: Point;
let currentLine: Line = [];

const drawingChanged = new Event("drawing-changed");

canvas.addEventListener("mousedown", (e) => {
  if (isDrawing == false) {
    currentLine = [];
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
    currentPoint = { x, y };
    currentLine.push(currentPoint);
    lines.push(currentLine);
    console.log(lines.length);
    return;
  }
  isDrawing = true;
  x = e.offsetX;
  y = e.offsetY;
  currentPoint = { x, y };
  lines[index].push(currentPoint);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    x = e.offsetX;
    y = e.offsetY;
    currentPoint = { x, y };
    lines[index].push(currentPoint);

    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseup", (e) => {
  isDrawing = false;
  index++;
});

canvas.addEventListener("drawing-changed", (e) => {
  canvasContext.clearRect(0, 0, 256, 256);
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length - 1; j++) {
      drawLine(
        canvasContext,
        lines[i][j].x,
        lines[i][j].y,
        lines[i][j + 1].x,
        lines[i][j + 1].y
      );
    }
  }
});

function drawLine(
  canvasContext: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  canvasContext.beginPath();
  canvasContext.strokeStyle = "black";
  canvasContext.lineWidth = 1;
  canvasContext.moveTo(x1, y1);
  canvasContext.lineTo(x2, y2);
  canvasContext.stroke();
  canvasContext.closePath();
}

// add a break between
const br = document.createElement("br");
app.append(br);

// clear button
// learned method from https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingcanvasContext2D/clearRect
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear canvas";
app.append(clearButton);

clearButton.addEventListener("click", function () {
  canvasContext.clearRect(0, 0, 256, 256);
  currentLine = [];
  lines = [];
  index = 0;
  undoLines = [];
});

// undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

let undoLines: Line[] = [];
let undoLine: Line;

undoButton.addEventListener("click", function () {
  if (lines.length > 0) {
    undoLine = lines.pop() as Line;
    index--;
    undoLines.push(undoLine);
    canvas.dispatchEvent(drawingChanged);
  }
});

// redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

let redoLine: Line;

redoButton.addEventListener("click", function () {
  if (undoLines.length > 0) {
    redoLine = undoLines.pop() as Line;
    lines.push(redoLine);
    index++;
    canvas.dispatchEvent(drawingChanged);
  }
});
