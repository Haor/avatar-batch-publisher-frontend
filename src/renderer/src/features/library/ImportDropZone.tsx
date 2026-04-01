import { useState, type DragEvent } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { spring, fadeIn } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useMutation } from "../../shared/hooks/useMutation";
import { pickFiles } from "../../lib/desktop";
import { Spinner } from "../../shared/components/Spinner";

interface ImportDropZoneProps {
  onImported: () => void;
}

export function ImportDropZone({ onImported }: ImportDropZoneProps) {
  const { t } = useTranslation(["library"]);
  const api = useApi();
  const [dragOver, setDragOver] = useState(false);

  const importBundle = useMutation(
    (input: { bundlePath: string }) =>
      api.artifacts.importFromBundle({
        bundlePath: input.bundlePath,
        manifestPath: null,
        thumbnailPath: null,
        nameOverride: null,
      }),
  );

  const importManifest = useMutation(
    (input: { manifestPath: string }) =>
      api.artifacts.importFromManifest({ manifestPath: input.manifestPath }),
  );

  const loading = importBundle.loading || importManifest.loading;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const path = (file as File & { path?: string }).path;
      if (!path) continue;

      try {
        if (path.endsWith(".vrca")) {
          await importBundle.execute({ bundlePath: path });
        } else if (path.endsWith(".manifest")) {
          await importManifest.execute({ manifestPath: path });
        }
        onImported();
      } catch { /* error handled by mutation */ }
    }
  }

  async function handleClick() {
    try {
      const paths = await pickFiles({
        title: t("library:importDropZone.chooseModelFiles"),
        filters: [{ name: t("library:importDropZone.avatarFilter"), extensions: ["vrca", "manifest"] }],
        allowMultiple: true,
      });
      if (!paths) return;

      for (const path of paths) {
        try {
          if (path.endsWith(".vrca")) {
            await importBundle.execute({ bundlePath: path });
          } else if (path.endsWith(".manifest")) {
            await importManifest.execute({ manifestPath: path });
          }
          onImported();
        } catch { /* error handled by mutation */ }
      }
    } catch { /* desktop bridge unavailable */ }
  }

  return (
    <motion.div
      className={`dropzone model-card-size ${dragOver ? "dropzone--active" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      transition={spring.snappy}
      variants={fadeIn}
    >
      {loading ? <Spinner size={20} /> : <Plus size={20} strokeWidth={1.75} />}
      <span>{loading ? t("library:importDropZone.importing") : t("library:importDropZone.importModel")}</span>
    </motion.div>
  );
}
