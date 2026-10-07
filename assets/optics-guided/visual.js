// Pure mapping from the engine's view (deriveView) to drawing parameters for the guided optics bench (I4).
// No DOM here. It only reads values the model/engine already decided (imageType, effective clarity level, error,
// projectionWithinBench); it never classifies images or judges sharpness itself.
import { BENCH_VIEW } from './input.js';

export const VIEW_W = 750;                                   // the visible bench (88 cm) spans 750 units
export const UNITS_PER_CM = VIEW_W / (BENCH_VIEW.maxCm - BENCH_VIEW.minCm);   // ≈ 8.5 units per cm
export const xOf = (axisCm) => (axisCm - BENCH_VIEW.minCm) * UNITS_PER_CM;

// Sprite geometry (viewBox units at k = 1). Fractions locate landmarks inside the source images.
export const CANDLE = Object.freeze({ h: 76, aspect: 350 / 512, flame: { x: 0.443, y: 0.166 } });   // flame centre sits on the axis
export const LENS = Object.freeze({ h: 220, aspect: 164 / 512, squeeze: 0.6, body: 0.346 });          // lens body centre on the axis
export const SCREEN = Object.freeze({ h: 300, aspect: 488 / 512, squeeze: 0.34, face: { x: 0.04, y: 0.04, w: 0.92, h: 0.56 } });
export const TABLE_BELOW_AXIS = LENS.h * (1 - LENS.body);    // lens stand reaches the table; everything else is posted to it
export const EYE_AT_CM = 38;
export const IMAGE_SQUEEZE = 0.7;                           // the projected candle is drawn slightly narrower, like the oblique screen

// Blur grows continuously with the screen error e; opacity never reaches 0 (Spec §7.3).
export const BLUR_MAX = 16;
export const blurSigmaFor = (level, error, tolerance) => {
  if (level === 1) return 0;
  if (error === null) return BLUR_MAX;
  return Math.min(BLUR_MAX, Math.max(0.8, 1.2 * (error - tolerance)));
};
export const contrastFor = (level, error) => (level === 1 ? 1 : error === null ? 0.3 : Math.min(1, Math.max(0.3, 1 - error / 14)));

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Status text + icon for the live clarity feedback. Text and icon always accompany colour (Spec §7.3). */
export function clarityMessage(view) {
  const { lensState: lens, clarity } = view, level = clarity.effectiveClarityLevel;
  if (view.phase === 'trial3-view-through-lens') return { icon: '◉', text: '你現在看得到一個正立、放大的蠟燭。' };
  if (lens.imageType === 'infinite') return { icon: '◌', text: '光線離開透鏡後幾乎平行，在有限距離的屏幕上找不到清楚影像。' };
  if (lens.imageType === 'real' && !lens.projectionWithinBench && (level === 2 || level === 3)) {
    return { icon: '◐', text: '會形成實像，但清楚位置已經超出這張實驗桌的範圍。' };
  }
  return ({
    1: { icon: '✓', text: '影像最清楚' },
    2: { icon: '◐', text: '已經很接近了' },
    3: { icon: '○', text: '影像還很模糊' },
    4: { icon: '◌', text: '只有散開的光影，已看不出清楚的蠟燭形狀' },
  })[level];
}

/**
 * visualParams(view, { height, rays })
 *   height: viewBox height in units (the renderer derives it from the container's aspect ratio; ≥ 300)
 *   rays:   draw the ray layer
 */
export function visualParams(view, { height = 380, rays = false } = {}) {
  const { lensState: lens, clarity } = view;
  const k = clamp(height / 380, 1, 1.25);
  const axisY = height * 0.5, tableY = axisY + TABLE_BELOW_AXIS * k;
  const level = clarity.effectiveClarityLevel, e = clarity.error;
  const viewThrough = view.phase === 'trial3-view-through-lens';

  const cH = CANDLE.h * k, cW = cH * CANDLE.aspect;
  const candleX = xOf(-view.u);
  const candle = { x: candleX, w: cW, h: cH, imgX: candleX - CANDLE.flame.x * cW, imgY: axisY - CANDLE.flame.y * cH,
    postTop: axisY + (1 - CANDLE.flame.y) * cH, postBottom: tableY };

  const lH = LENS.h * k, lW = lH * LENS.aspect * LENS.squeeze, lensX = xOf(0);
  const lens_ = { x: lensX, w: lW, h: lH, imgX: lensX - lW / 2, imgY: axisY - LENS.body * lH };

  const sH = SCREEN.h * k, sW = sH * SCREEN.aspect * SCREEN.squeeze, screenX = xOf(view.s);
  const screen = { x: screenX, w: sW, h: sH, imgX: screenX - sW / 2, imgY: tableY - sH };
  const face = { x: screen.imgX + SCREEN.face.x * sW, y: screen.imgY + SCREEN.face.y * sH, w: SCREEN.face.w * sW, h: SCREEN.face.h * sH };

  const sigma = blurSigmaFor(level, e, clarity.tolerance), contrast = contrastFor(level, e);
  const real = lens.imageType === 'real';
  const image = real ? { cx: screenX, cy: axisY, scaleX: IMAGE_SQUEEZE * lens.absoluteMagnification, scaleY: -lens.absoluteMagnification,
    w: cW, h: cH, offX: -CANDLE.flame.x * cW, offY: -CANDLE.flame.y * cH } : null;
  const glowOpacity = real ? Math.min(0.55, 0.04 * sigma) : lens.imageType === 'infinite' ? 0.5 : 0.4;

  const out = {
    w: VIEW_W, h: height, k, axisY, tableY, candle, lens: lens_, screen, face, image,
    blurSigma: sigma, contrast, imageOpacity: Math.max(0.5, 1 - 0.03 * sigma),
    glow: { opacity: glowOpacity, rx: face.w * 0.45, ry: face.h * 0.38 },
    screenOpacity: viewThrough ? 0.25 : 1,
    clarity: { level, rawLevel: clarity.rawClarityLevel, error: e, imageType: lens.imageType, withinBench: lens.projectionWithinBench, ...clarityMessage(view) },
    hit: { screen: { x: screenX, y: face.y + face.h / 2, h: sH }, candle: { x: candleX, y: axisY + cH * 0.3, h: cH } },
    ticks: [], rays: null, virtual: null, eye: null,
  };
  for (let cm = Math.ceil(BENCH_VIEW.minCm / 5) * 5; cm <= BENCH_VIEW.maxCm; cm += 5) if (cm !== 0) out.ticks.push({ x: xOf(cm), cm, label: Math.abs(cm) % 10 === 0 && cm > BENCH_VIEW.minCm && cm < BENCH_VIEW.maxCm ? String(Math.abs(cm)) : null });

  // object point used for ray drawing: the candle foot (below the axis); images of it show the inversion
  const h0 = (1 - CANDLE.flame.y) * cH, bx = candleX, by = axisY + h0;
  if (viewThrough && lens.imageType === 'virtual') {
    const vx = xOf(lens.theoreticalV), vy = axisY + lens.magnification * h0, ex = xOf(EYE_AT_CM);
    const ly = vy + (axisY - vy) * (lensX - vx) / (ex - vx);      // lens point whose ray, traced back, reaches the virtual foot
    out.eye = { x: ex, y: axisY };
    out.virtual = { x: vx, imgX: vx - CANDLE.flame.x * cW * lens.magnification, imgY: axisY - CANDLE.flame.y * cH * lens.magnification,
      w: cW * lens.magnification, h: cH * lens.magnification };
    out.rays = [
      { x1: bx, y1: by, x2: lensX, y2: ly, solid: true }, { x1: lensX, y1: ly, x2: ex, y2: axisY, solid: true }, { x1: lensX, y1: ly, x2: vx, y2: vy, solid: false },
      { x1: bx, y1: by, x2: lensX, y2: axisY, solid: true }, { x1: lensX, y1: axisY, x2: lensX + 70, y2: axisY + (axisY - by) * 70 / (lensX - bx), solid: true },
      { x1: lensX, y1: axisY, x2: vx, y2: vy, solid: false },
    ];
  } else if (rays) {
    const slope = (axisY - by) / (lensX - bx), endX = xOf(BENCH_VIEW.maxCm);
    if (real) {
      const ix = xOf(lens.theoreticalV), iy = axisY + lens.magnification * h0;
      out.rays = [
        { x1: bx, y1: by, x2: lensX, y2: by, solid: true }, { x1: lensX, y1: by, x2: ix, y2: iy, solid: true },
        { x1: bx, y1: by, x2: lensX, y2: axisY, solid: true }, { x1: lensX, y1: axisY, x2: ix, y2: iy, solid: true },
      ];
    } else if (lens.imageType === 'infinite') {
      out.rays = [
        { x1: bx, y1: by, x2: lensX, y2: by, solid: true }, { x1: lensX, y1: by, x2: endX, y2: by + slope * (endX - lensX), solid: true },
        { x1: bx, y1: by, x2: lensX, y2: axisY, solid: true }, { x1: lensX, y1: axisY, x2: endX, y2: axisY + slope * (endX - lensX), solid: true },
      ];
    } else {
      const vx = xOf(lens.theoreticalV), vy = axisY + lens.magnification * h0;
      out.rays = [
        { x1: bx, y1: by, x2: lensX, y2: by, solid: true }, { x1: lensX, y1: by, x2: endX, y2: by + (by - vy) / (lensX - vx) * (endX - lensX), solid: true }, { x1: lensX, y1: by, x2: vx, y2: vy, solid: false },
        { x1: bx, y1: by, x2: lensX, y2: axisY, solid: true }, { x1: lensX, y1: axisY, x2: vx, y2: vy, solid: false },
      ];
    }
  }
  return out;
}
