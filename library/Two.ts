import * as Two from 'two.js';

const PI = Math.PI;
const HALF_PI = PI / 2;

interface ShapeProps {
  fill?: string;
  opacity?: number;
  radius?: number;
  rotate?: number;
  stroke?: string;
  strokeDasharray?: [number, number];
  strokeWidth?: number;
  translate?: boolean;
}

interface ArcProps extends ShapeProps {
  a1: number;
  a2: number;
  cx: number;
  cy: number;
  radius: number;
}

const createShape = (shape: Two.Path, props: ShapeProps) => {
  const {
    fill = 'transparent',
    opacity = 1,
    rotate = 0,
    stroke = 'transparent',
    strokeDasharray,
    strokeWidth = 0,
    translate,
  } = props;

  const {
    top,
    left,
    width,
    height,
  } = shape.getBoundingClientRect();

  const cx = left + (width / 2);
  const cy = top + (height / 2);

  if (translate) {
    shape.center();
    shape.translation.set(cx, cy);
  }

  shape.fill = fill;
  shape.stroke = stroke;
  shape.linewidth = strokeWidth;
  shape.opacity = opacity;
  shape.rotation = rotate;

  return shape;
};

export const createCircle = (props: ShapeProps & { radius: number; x: number; y: number }) => {
  return createShape(
    new Two.Circle(props.x, props.y, props.radius),
  props);
};

export const createText = (text: string, props: ShapeProps & { x: number; y: number }) => {
  return new Two.Text(text, props.x, props.y, props);
};

