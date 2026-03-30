import { motion } from "motion/react";
import { Layers } from "lucide-react";
import { makeStagger } from "../../../shared/springs";
import { useApi } from "../../../app/ApiContext";
import { useNavigation } from "../../../app/NavigationContext";
import { useQuery } from "../../../shared/hooks/useQuery";
import { EmptyState } from "../../../shared/components/EmptyState";
import { Spinner } from "../../../shared/components/Spinner";
import { ModelCard } from "../../library/ModelCard";

interface SelectArtifactStepProps {
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

const listStagger = makeStagger();

export function SelectArtifactStep({ selected, onSelectionChange }: SelectArtifactStepProps) {
  const api = useApi();
  const { navigate } = useNavigation();

  const { data, loading } = useQuery(
    (signal) => api.artifacts.list(signal),
    [],
  );

  const artifacts = data?.items ?? [];

  function toggle(id: string) {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>;

  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={<Layers size={32} strokeWidth={1.5} />}
        message="暂无本地模型"
        action={{ label: "去导入", onClick: () => navigate("library") }}
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
          sourceLabel="本地"
          sourceIcon="local"
          selected={selected.includes(artifact.artifactId)}
          onClick={() => toggle(artifact.artifactId)}
        />
      ))}
    </motion.div>
  );
}
