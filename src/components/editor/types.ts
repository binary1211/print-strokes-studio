export interface Slot {
  id: string;
  type: "photo" | "text" | "background" | "sticker";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  bgColor?: string;
}

export interface Template {
  src: string;
  width: number;
  height: number;
}

export interface PreviewState {
  url: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  text?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  bgColor?: string;
}

export interface BorderStyleConfig {
  id: string;
  name: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  inset: number;
  innerStroke?: string;
  bgFill?: string;
}
