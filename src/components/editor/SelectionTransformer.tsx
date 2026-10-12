import React, { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import Konva from "konva";

interface SelectionTransformerProps {
  selectedId: string | null;
}

export const SelectionTransformer: React.FC<SelectionTransformerProps> = ({ selectedId }) => {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (selectedId && trRef.current) {
      const stage = trRef.current.getStage();
      if (stage) {
        const selectedNode = stage.findOne("." + selectedId);
        if (selectedNode === trRef.current.node()) return;

        if (selectedNode) {
          trRef.current.nodes([selectedNode]);
          trRef.current.getLayer()?.batchDraw();
        } else {
          trRef.current.nodes([]);
        }
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 15 || newBox.height < 15) return oldBox;
        return newBox;
      }}
      rotateEnabled={true}
      keepRatio={true}
      anchorSize={10}
      anchorCornerRadius={5}
      borderStroke="#4f46e5"
      anchorStroke="#4f46e5"
      anchorFill="#ffffff"
      borderStrokeWidth={2}
    />
  );
};
