export interface Point {
  x: number;
  y: number;
}

// Representing the digit "3" (two curved lobes)
export const demoDigitThree: Point[][] = [
  // Upper curve
  [
    { x: 90, y: 80 },
    { x: 120, y: 70 },
    { x: 160, y: 70 },
    { x: 190, y: 90 },
    { x: 190, y: 120 },
    { x: 170, y: 140 },
    { x: 140, y: 145 },
    { x: 120, y: 145 }
  ],
  // Lower curve
  [
    { x: 120, y: 145 },
    { x: 155, y: 145 },
    { x: 185, y: 160 },
    { x: 195, y: 190 },
    { x: 185, y: 220 },
    { x: 150, y: 235 },
    { x: 110, y: 235 },
    { x: 85, y: 215 }
  ]
];

// Helper to animate drawing the digit on a canvas
export function animateDrawing(
  ctx: CanvasRenderingContext2D,
  brushSize: number,
  onStrokePoint: (x: number, y: number, isStarting: boolean) => void,
  onComplete: () => void
) {
  let strokeIdx = 0;
  let pointIdx = 0;

  function drawNextPoint() {
    if (strokeIdx >= demoDigitThree.length) {
      onComplete();
      return;
    }

    const stroke = demoDigitThree[strokeIdx];
    const point = stroke[pointIdx];
    const isStarting = pointIdx === 0;

    // Draw visually on the canvas context passed in
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#FFFFFF";

    if (isStarting) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else {
      const prevPoint = stroke[pointIdx - 1];
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    // Trigger state changes in the Canvas component via callback
    onStrokePoint(point.x, point.y, isStarting);

    pointIdx++;
    if (pointIdx >= stroke.length) {
      strokeIdx++;
      pointIdx = 0;
      // Wait slightly longer between strokes
      setTimeout(drawNextPoint, 150);
    } else {
      setTimeout(drawNextPoint, 30);
    }
  }

  drawNextPoint();
}
