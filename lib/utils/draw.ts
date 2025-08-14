export function drawKeypoints(ctx: CanvasRenderingContext2D, keypoints: any[]) {
  keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.5) {
      const { x, y } = keypoint;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "white",
  font = "16px Arial"
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
