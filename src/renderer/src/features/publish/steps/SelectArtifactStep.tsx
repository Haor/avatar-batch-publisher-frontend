import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { makeStagger } from "../../../shared/springs";
import { useNavigation } from "../../../app/NavigationContext";
import { EmptyState } from "../../../shared/components/EmptyState";
import { Spinner } from "../../../shared/components/Spinner";
import { ModelCard } from "../../library/ModelCard";
import type { ArtifactSummary } from "../../../contracts/artifacts";

interface SelectArtifactStepProps {
  artifacts: ArtifactSummary[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

const listStagger = makeStagger();

export function SelectArtifactStep({
  artifacts,
  selected,
  onSelectionChange,
  loading = false,
}: SelectArtifactStepProps) {
  const { t } = useTranslation(["publish", "library"]);
  const { navigate } = useNavigation();
  function toggle(id: string) {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  }

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>;
  }

  if (artifacts.length === 0) {
    return (
        <EmptyState
          icon={<Layers size={32} strokeWidth={1.5} />}
          message={t("publish:steps.noLocalModels")}
          action={{ label: t("publish:steps.goImport"), onClick: () => navigate("library") }}
        />
    );
  }

  return (
    <motion.div
      className="model-grid"
      variants={listStagger}
      initial="hidden"
      animate="show"
    >
      {artifacts.map((artifact) => (
        <ModelCard
          key={artifact.artifactId}
          name={artifact.name}
          imageUrl={artifact.thumbnailPath ? `file://${artifact.thumbnailPath}` : null}
          sourceLabel={t("library:source.local")}
          sourceIcon="local"
          selected={selected.includes(artifact.artifactId)}
          onClick={() => toggle(artifact.artifactId)}
        />
      ))}
    </motion.div>
  );
}
