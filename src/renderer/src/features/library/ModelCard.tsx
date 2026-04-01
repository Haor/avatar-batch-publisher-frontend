import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Layers, Cloud, HardDrive } from "lucide-react";
import { spring, fadeIn } from "../../shared/springs";
import { useLocalImage } from "../../shared/hooks/useLocalImage";

interface ModelCardProps {
  modelKey?: string;
  name: string;
  imageUrl: string | null;
  sourceLabel: string;
  sourceIcon: "local" | "cloud";
  selected?: boolean;
  onClick?: () => void;
  onSelect?: (modelKey: string) => void;
}

export const ModelCard = memo(function ModelCard({
  modelKey,
  name,
  imageUrl,
  sourceLabel,
  sourceIcon,
  selected,
  onClick,
  onSelect,
}: ModelCardProps) {
  const resolvedImage = useLocalImage(imageUrl);

  const handleClick = useCallback(() => {
    if (onSelect && modelKey) {
      onSelect(modelKey);
    } else {
      onClick?.();
    }
  }, [onSelect, modelKey, onClick]);

  return (
    <motion.div
      className={`card card-interactive model-card ${selected ? "card-active" : ""}`}
      variants={fadeIn}
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      transition={spring.snappy}
      data-selected={selected || undefined}
    >
      <div className="model-card-image">
        {resolvedImage ? (
          <img src={resolvedImage} alt={name} loading="lazy" />
        ) : (
          <Layers size={24} strokeWidth={1.5} />
        )}
      </div>
      <div className="model-card-body">
        <span className="model-card-name">{name}</span>
        <span className="model-card-source">
          {sourceIcon === "cloud" ? (
            <Cloud size={11} strokeWidth={1.75} />
          ) : (
            <HardDrive size={11} strokeWidth={1.75} />
          )}
          {sourceLabel}
        </span>
      </div>
    </motion.div>
  );
});
