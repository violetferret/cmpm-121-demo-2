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

// Code between lines 22-64 taken from Mozilla web developer docs
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
let lines: Line[] = [];

let currentPoint: Point;
let currentLine: Line = [];

const drawingChanged = new Event("drawing-changed");

// // event.offsetX, event.offsetY gives the (x,y) offset from the edge of the canvas.
// // Add the event listeners for mousedown, mousemove, and mouseup
// canvas.addEventListener("mousedown", (e) => {
//   x = e.offsetX;
//   y = e.offsetY;
//   isDrawing = true;
// });

// canvas.addEventListener("mousemove", (e) => {
//   if (isDrawing) {
//     drawArray.push([x, y]);
//     drawLine(canvasContext, x, y, e.offsetX, e.offsetY);
//     x = e.offsetX;
//     y = e.offsetY;
//   }
// });

// canvas.addEventListener("mouseup", (e) => {
//   if (isDrawing) {
//     drawLine(canvasContext, x, y, e.offsetX, e.offsetY);
//     x = 0;
//     y = 0;
//     isDrawing = false;
//   }
// });

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  x = e.offsetX;
  y = e.offsetY;
  currentPoint = { x, y };
  currentLine.push(currentPoint);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    x = e.offsetX;
    y = e.offsetY;
    currentPoint = { x, y };
    currentLine.push(currentPoint);
    lines.push(currentLine);

    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseup", (e) => {
  isDrawing = false;
  x = 0;
  y = 0;
  currentPoint = {x, y};
  currentLine.push(currentPoint);
});

canvas.addEventListener("drawing-changed", (e) => {
  canvasContext.clearRect(0, 0, 256, 256);
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
        if (lines.length != i+1 && lines[i].length != j+1) {
      drawLine(
        canvasContext,
        lines[i][j].x,
        lines[i][j].y,
        (lines[i + 1][j + 1].x),
        (lines[i + 1][j + 1].y)
      );
    }
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
  if ((x1 == 0 && y1 == 0) || (x2 == 0 && y2 == 0)){
    return;
  } else {
  canvasContext.beginPath();
  canvasContext.strokeStyle = "black";
  canvasContext.lineWidth = 1;
  canvasContext.moveTo(x1, y1);
  canvasContext.lineTo(x2, y2);
  canvasContext.stroke();
  canvasContext.closePath();
  }
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
});
