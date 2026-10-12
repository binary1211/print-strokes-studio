import React from "react";
import { Type, PaintBucket } from "lucide-react";
import type { PreviewState, Slot } from "./types";

interface PreviewToolbarProps {
  slot: Slot;
  previewState?: PreviewState;
  onChange: (newState: PreviewState) => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  slot,
  previewState,
  onChange,
}) => {
  if (slot.type !== "text") return null;

  const currentText = previewState?.text ?? slot.text ?? "Sample Text";
  const currentColor = previewState?.color ?? slot.color ?? "#333333";

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50">
        <Type size={16} className="text-primary" />
        <input
          type="text"
          className="bg-transparent text-xs font-medium focus:outline-none text-slate-800"
          value={currentText}
          onChange={(e) => {
            onChange({
              ...(previewState || { url: "", x: slot.x, y: slot.y, scaleX: 1, scaleY: 1, rotation: 0 }),
              text: e.target.value,
            });
          }}
          placeholder="Enter custom text..."
        />
      </div>
      <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50">
        <PaintBucket size={16} className="text-primary" />
        <input
          type="color"
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
          value={currentColor}
          onChange={(e) => {
            onChange({
              ...(previewState || { url: "", x: slot.x, y: slot.y, scaleX: 1, scaleY: 1, rotation: 0 }),
              color: e.target.value,
            });
          }}
        />
        <span className="text-xs text-slate-500 font-mono">{currentColor}</span>
      </div>
    </div>
  );
};
