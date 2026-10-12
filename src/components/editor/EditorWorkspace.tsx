import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import type { Slot, Template, PreviewState, BorderStyleConfig } from "./types";
import { SlotPlaceholder } from "./SlotPlaceholder";
import { SelectionTransformer } from "./SelectionTransformer";

interface EditorWorkspaceProps {
  template: Template | null;
  slots: Slot[];
  selectedId: string | null;
  onSelectSlot: (id: string | null) => void;
  onChangeSlot: (slot: Slot) => void;
  mode: "edit" | "preview";
  previewData: Record<string, PreviewState>;
  onPreviewUpload: (slotId: string, url: string) => void;
  selectedPreviewId: string | null;
  onSelectPreviewId: (id: string | null) => void;
  onPreviewChange: (id: string, newState: PreviewState) => void;
  processPreviewFile?: (file: File) => Promise<string>;
  borderConfig?: BorderStyleConfig;
  canvasBg?: string;
  stageRef?: React.RefObject<Konva.Stage>;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  template,
  slots,
  selectedId,
  onSelectSlot,
  onChangeSlot,
  mode,
  previewData,
  onPreviewUpload,
  selectedPreviewId,
  onSelectPreviewId,
  onPreviewChange,
  borderConfig,
  canvasBg = "#ffffff",
  stageRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 500 });
  const [image] = useImage(template?.src || "", "anonymous");

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth || 640,
          height: containerRef.current.offsetHeight || 500,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedOnBackground = e.target.name() === "background-image" || e.target.name() === "canvas-bg";
    if (clickedOnEmpty || clickedOnBackground) {
      onSelectSlot(null);
      onSelectPreviewId(null);
    }
  };

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (template) {
    const scaleX = dimensions.width / template.width;
    const scaleY = dimensions.height / template.height;
    scale = Math.min(scaleX, scaleY) * 0.92;
    offsetX = (dimensions.width - template.width * scale) / 2;
    offsetY = (dimensions.height - template.height * scale) / 2;
  }

  const photoSlots = slots.filter((s) => s.type === "photo" || s.type === "background");
  const overlaySlots = slots.filter((s) => s.type === "text" || s.type === "sticker");
  const primaryPhotoSlot = photoSlots[0];
  const frameBox = primaryPhotoSlot || { x: 0, y: 0, width: template?.width || 600, height: template?.height || 600 };

  const activeTransformerTarget = selectedPreviewId
    ? slots.find((s) => s.id === selectedPreviewId)?.type === "photo"
      ? `preview-img-${selectedPreviewId}`
      : selectedPreviewId
    : null;

  return (
    <div className="w-full h-full relative select-none" ref={containerRef}>
      {!template && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <p className="font-semibold text-sm">No Template Loaded</p>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Base Canvas Background */}
          {template && (
            <Rect
              name="canvas-bg"
              x={frameBox.x}
              y={frameBox.y}
              width={frameBox.width}
              height={frameBox.height}
              fill={canvasBg}
              cornerRadius={borderConfig?.cornerRadius || 0}
              shadowColor="rgba(15, 23, 42, 0.18)"
              shadowBlur={24}
              shadowOffsetY={8}
            />
          )}

          {image && (
            <KonvaImage
              image={image}
              name="background-image"
              width={template?.width}
              height={template?.height}
              listening={true}
            />
          )}

          {/* Photo Slots */}
          {photoSlots.map((slot, i) => (
            <SlotPlaceholder
              key={slot.id}
              slot={slot}
              index={i}
              isSelected={slot.id === selectedId}
              onSelect={() => onSelectSlot(slot.id)}
              onChange={onChangeSlot}
              mode={mode}
              previewState={previewData[slot.id]}
              onPreviewUpload={(url) => onPreviewUpload(slot.id, url)}
              isSelectedPreview={selectedPreviewId === slot.id}
              onSelectPreview={() => onSelectPreviewId(slot.id)}
              onPreviewChange={(newState) => onPreviewChange(slot.id, newState)}
            />
          ))}

          {/* Decorative Border / Frame Overlay */}
          {borderConfig && borderConfig.strokeWidth > 0 && (
            <>
              <Rect
                x={frameBox.x + borderConfig.inset}
                y={frameBox.y + borderConfig.inset}
                width={frameBox.width - borderConfig.inset * 2}
                height={frameBox.height - borderConfig.inset * 2}
                stroke={borderConfig.stroke}
                strokeWidth={borderConfig.strokeWidth}
                cornerRadius={borderConfig.cornerRadius}
                listening={false}
              />
              {borderConfig.innerStroke && (
                <Rect
                  x={frameBox.x + borderConfig.inset + borderConfig.strokeWidth * 0.75}
                  y={frameBox.y + borderConfig.inset + borderConfig.strokeWidth * 0.75}
                  width={frameBox.width - (borderConfig.inset + borderConfig.strokeWidth * 0.75) * 2}
                  height={frameBox.height - (borderConfig.inset + borderConfig.strokeWidth * 0.75) * 2}
                  stroke={borderConfig.innerStroke}
                  strokeWidth={2}
                  cornerRadius={Math.max(0, borderConfig.cornerRadius - 4)}
                  listening={false}
                />
              )}
            </>
          )}

          {/* Text & Emoji/Sticker Overlays */}
          {overlaySlots.map((slot, i) => (
            <SlotPlaceholder
              key={slot.id}
              slot={slot}
              index={i}
              isSelected={slot.id === selectedId}
              onSelect={() => onSelectSlot(slot.id)}
              onChange={onChangeSlot}
              mode={mode}
              previewState={previewData[slot.id]}
              onPreviewUpload={(url) => onPreviewUpload(slot.id, url)}
              isSelectedPreview={selectedPreviewId === slot.id}
              onSelectPreview={() => onSelectPreviewId(slot.id)}
              onPreviewChange={(newState) => onPreviewChange(slot.id, newState)}
            />
          ))}

          {mode === "edit" && <SelectionTransformer selectedId={selectedId} />}
          {mode === "preview" && activeTransformerTarget && (
            <SelectionTransformer selectedId={activeTransformerTarget} />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
