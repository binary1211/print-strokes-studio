import type { Slot, Template } from "./types";

const MAX_SLOTS = 100;
const MIN_CANVAS = 10;
const MAX_CANVAS = 10_000;

const finiteInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const safeTemplateSource = (value: unknown) => {
  if (value === "" || value == null) return "";
  if (typeof value !== "string" || value.length > 5_000_000) return "";
  return value;
};

const validateSlot = (value: unknown, index: number): Slot => {
  if (!value || typeof value !== "object") throw new Error(`Slot ${index + 1} is invalid`);
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `slot-${index + 1}`;
  const type = raw.type === "photo" || raw.type === "text" || raw.type === "background" ? raw.type : "photo";
  const x = finiteInRange(raw.x, -MAX_CANVAS, MAX_CANVAS) ? raw.x : 0;
  const y = finiteInRange(raw.y, -MAX_CANVAS, MAX_CANVAS) ? raw.y : 0;
  const width = finiteInRange(raw.width, 1, MAX_CANVAS) ? raw.width : 200;
  const height = finiteInRange(raw.height, 1, MAX_CANVAS) ? raw.height : 200;
  const rotation = finiteInRange(raw.rotation, -3600, 3600) ? raw.rotation : 0;

  return {
    id,
    type,
    x,
    y,
    width,
    height,
    rotation,
    text: typeof raw.text === "string" ? raw.text.slice(0, 500) : undefined,
    color: typeof raw.color === "string" ? raw.color : undefined,
  };
};

export const validateSlots = (value: unknown): Slot[] => {
  if (!Array.isArray(value) || value.length > MAX_SLOTS) return [];
  return value.map(validateSlot);
};

export const validateTemplate = (value: unknown, fallbackImageSrc = ""): Template => {
  if (!value || typeof value !== "object") {
    return { width: 800, height: 600, src: fallbackImageSrc };
  }
  const raw = value as Record<string, unknown>;
  return {
    width: finiteInRange(raw.width, MIN_CANVAS, MAX_CANVAS) ? raw.width : 800,
    height: finiteInRange(raw.height, MIN_CANVAS, MAX_CANVAS) ? raw.height : 600,
    src: safeTemplateSource(raw.src ?? fallbackImageSrc),
  };
};

export const parseTemplatePayload = (json: string, fallbackImageSrc = "") => {
  if (!json) throw new Error("Template JSON is empty");
  const parsed = JSON.parse(json) as Record<string, unknown>;
  return {
    template: validateTemplate(parsed.template, fallbackImageSrc),
    slots: validateSlots(parsed.slots),
  };
};
