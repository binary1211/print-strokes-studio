import React, { useRef } from "react";
import { Rect, Group, Text, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import type { Slot, PreviewState } from "./types";

interface SlotPlaceholderProps {
  slot: Slot;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange?: (slot: Slot) => void;
  mode: "edit" | "preview";
  previewState?: PreviewState;
  onPreviewUpload?: (fileUrl: string) => void;
  onSelectPreview?: () => void;
  isSelectedPreview?: boolean;
  onPreviewChange?: (newState: PreviewState) => void;
}

export const SlotPlaceholder: React.FC<SlotPlaceholderProps> = ({
  slot,
  index,
  isSelected,
  onSelect,
  onChange,
  mode,
  previewState,
  onPreviewUpload,
  onSelectPreview,
  isSelectedPreview,
  onPreviewChange,
}) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const [image] = useImage(previewState?.url || "", "anonymous");

  const isOverlayItem = slot.type === "text" || slot.type === "sticker";

  const handlePreviewClick = () => {
    if (mode !== "preview" || isOverlayItem || !onPreviewUpload) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onPreviewUpload(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (isOverlayItem) {
    const x = previewState?.x ?? slot.x;
    const y = previewState?.y ?? slot.y;
    const scaleX = previewState?.scaleX ?? 1;
    const scaleY = previewState?.scaleY ?? 1;
    const rotation = previewState?.rotation ?? slot.rotation ?? 0;
    const displayText = previewState?.text ?? slot.text ?? (slot.type === "sticker" ? "✨" : "Your Text");
    const textColor = previewState?.color ?? slot.color ?? "#1e293b";
    const fontFamily = previewState?.fontFamily ?? slot.fontFamily ?? "Inter, sans-serif";
    const fontSize = previewState?.fontSize ?? slot.fontSize ?? (slot.type === "sticker" ? 56 : 28);
    const fontStyle = previewState?.fontStyle ?? slot.fontStyle ?? "bold";
    const bgColor = previewState?.bgColor ?? slot.bgColor;

    return (
      <Group
        name={slot.id}
        x={x}
        y={y}
        scaleX={scaleX}
        scaleY={scaleY}
        rotation={rotation}
        width={slot.width}
        height={slot.height}
        draggable={true}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectPreview?.();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectPreview?.();
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          onPreviewChange?.({
            ...(previewState || { url: "", x: slot.x, y: slot.y, scaleX: 1, scaleY: 1, rotation: 0 }),
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          e.cancelBubble = true;
          const node = e.target;
          onPreviewChange?.({
            ...(previewState || { url: "", x: slot.x, y: slot.y, scaleX: 1, scaleY: 1, rotation: 0 }),
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }}
      >
        {bgColor && bgColor !== "transparent" && (
          <Rect
            width={slot.width}
            height={slot.height}
            fill={bgColor}
            cornerRadius={12}
            shadowColor="rgba(0,0,0,0.18)"
            shadowBlur={8}
            shadowOffsetY={2}
          />
        )}
        {isSelectedPreview && (
          <Rect
            width={slot.width}
            height={slot.height}
            stroke="#6366f1"
            strokeWidth={1.5}
            dash={[4, 4]}
            cornerRadius={8}
          />
        )}
        <Text
          text={displayText}
          width={slot.width}
          height={slot.height}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize}
          fill={textColor}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          wrap="word"
        />
      </Group>
    );
  }

  return (
    <Group
      name={slot.id}
      x={slot.x}
      y={slot.y}
      width={slot.width}
      height={slot.height}
      clipFunc={(ctx) => {
        ctx.rect(0, 0, slot.width, slot.height);
      }}
      draggable={mode === "edit"}
      onClick={() => {
        if (mode === "edit") {
          onSelect();
        } else if (mode === "preview" && !image) {
          handlePreviewClick();
        }
      }}
      onTap={() => {
        if (mode === "edit") {
          onSelect();
        } else if (mode === "preview" && !image) {
          handlePreviewClick();
        }
      }}
      onDragEnd={(e) => {
        if (mode !== "edit") return;
        onChange?.({
          ...slot,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      {image && previewState ? (
        <KonvaImage
          name={`preview-img-${slot.id}`}
          image={image}
          x={previewState.x}
          y={previewState.y}
          scaleX={previewState.scaleX}
          scaleY={previewState.scaleY}
          rotation={previewState.rotation}
          draggable={mode === "preview"}
          onClick={(e) => {
            e.cancelBubble = true;
            if (mode === "preview") onSelectPreview?.();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            if (mode === "preview") onSelectPreview?.();
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            if (mode === "preview" && onPreviewChange) {
              onPreviewChange({
                ...previewState,
                x: e.target.x(),
                y: e.target.y(),
              });
            }
          }}
          onTransformEnd={(e) => {
            e.cancelBubble = true;
            if (mode === "preview" && onPreviewChange) {
              const node = e.target;
              onPreviewChange({
                ...previewState,
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
              });
            }
          }}
        />
      ) : (
        <>
          <Rect
            ref={shapeRef}
            width={slot.width}
            height={slot.height}
            fill="rgba(241, 245, 249, 0.85)"
            stroke="#94a3b8"
            strokeWidth={2}
            dash={[8, 6]}
          />
          <Text
            text={mode === "preview" ? "📷 Click to Upload Photo\nor choose from Left Panel" : `Photo ${index + 1}`}
            width={slot.width}
            height={slot.height}
            align="center"
            verticalAlign="middle"
            fontSize={16}
            lineHeight={1.5}
            fill="#475569"
            fontFamily="Inter, sans-serif"
            fontStyle="bold"
            listening={false}
          />
        </>
      )}
    </Group>
  );
};
