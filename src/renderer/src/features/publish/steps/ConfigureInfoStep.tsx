import { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Layers, Pencil, ChevronDown } from "lucide-react";
import { spring } from "../../../shared/springs";
import { Input } from "../../../shared/components/Input";
import { useLocalImage } from "../../../shared/hooks/useLocalImage";
import { isDesktopBridgeAvailable, pickSingleFile } from "../../../lib/desktop";

/** 每个模型的完整配置 */
export interface PerArtifactConfig {
  name: string;
  description: string;
  tags: string[];
  releaseStatus: "private" | "public";
  imagePath: string | null;
}

/** 兼容旧接口 */
export interface PublishItemConfig extends PerArtifactConfig {}

export interface ArtifactInfo {
  artifactId: string;
  name: string;
  thumbnailPath: string | null;
}

interface ConfigureInfoStepProps {
  artifacts: ArtifactInfo[];
  perArtifactConfigs: Map<string, PerArtifactConfig>;
  onPerArtifactChange: (artifactId: string, config: PerArtifactConfig) => void;
}

export function ConfigureInfoStep({
  artifacts,
  perArtifactConfigs,
  onPerArtifactChange,
}: ConfigureInfoStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    artifacts.length === 1 ? artifacts[0].artifactId : null,
  );

  return (
    <div className="configure-step-v2">
      <div className="configure-artifact-list">
        {artifacts.map((artifact) => {
          const config = perArtifactConfigs.get(artifact.artifactId) ?? {
            name: artifact.name,
            description: "",
            tags: [],
            releaseStatus: "private" as const,
            imagePath: artifact.thumbnailPath,
          };
          const isExpanded = expandedId === artifact.artifactId;
          const isSingle = artifacts.length === 1;
          return (
            <ArtifactConfigCard
              key={artifact.artifactId}
              config={config}
              onChange={(c) => onPerArtifactChange(artifact.artifactId, c)}
              expanded={isSingle || isExpanded}
              onToggle={isSingle ? undefined : () => setExpandedId(isExpanded ? null : artifact.artifactId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ArtifactConfigCard({
  config,
  onChange,
  expanded,
  onToggle,
}: {
  config: PerArtifactConfig;
  onChange: (config: PerArtifactConfig) => void;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const { t } = useTranslation(["publish"]);
  const coverUrl = useLocalImage(config.imagePath);
  const [editingName, setEditingName] = useState(false);

  function update(patch: Partial<PerArtifactConfig>) {
    onChange({ ...config, ...patch });
  }

  async function handleChangeCover() {
    if (!isDesktopBridgeAvailable()) return;
    try {
      const path = await pickSingleFile({
        title: t("publish:steps.chooseCover"),
        filters: [{ name: t("publish:steps.imageFilter"), extensions: ["png", "jpg", "jpeg", "webp"] }],
      });
      if (path) update({ imagePath: path });
    } catch { /* */ }
  }

  return (
    <div className={`configure-artifact-card ${expanded ? "configure-artifact-card--expanded" : ""}`}>
      {/* 头部 — 缩略图 + 名称 + 展开按钮 */}
      <div className="configure-artifact-header">
        <div className="configure-artifact-cover" onClick={handleChangeCover}>
          {coverUrl ? (
            <img src={coverUrl} alt={config.name} />
          ) : (
            <Layers size={18} strokeWidth={1.25} />
          )}
        </div>
        <div className="configure-artifact-info">
          {editingName ? (
            <input
              className="input-field configure-artifact-name-input"
              value={config.name}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              autoFocus
            />
          ) : (
            <span
              className="configure-artifact-name"
              onClick={() => setEditingName(true)}
            >
              {config.name}
              <Pencil size={11} strokeWidth={1.75} className="configure-artifact-edit-icon" />
            </span>
          )}
        </div>
        {onToggle && (
          <motion.button
            className="btn btn-ghost btn-icon"
            onClick={onToggle}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={spring.snappy}
            >
              <ChevronDown size={14} strokeWidth={1.75} />
            </motion.div>
          </motion.button>
        )}
      </div>

      {/* 展开区域 — 完整配置 */}
      {expanded && (
        <motion.div
          className="configure-artifact-body"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={spring.smooth}
        >
          <div className="input-group">
            <label className="input-label">{t("publish:steps.description")}</label>
            <textarea
              className="input-field configure-textarea"
              value={config.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              placeholder={t("publish:steps.optional")}
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t("publish:steps.tags")}</label>
            <Input
              placeholder={t("publish:steps.tagPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !config.tags.includes(val)) {
                    update({ tags: [...config.tags, val] });
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            {config.tags.length > 0 && (
              <div className="configure-tags">
                {config.tags.map((tag) => (
                  <span key={tag} className="badge badge--neutral configure-tag">
                    {tag}
                    <button
                      className="configure-tag-remove"
                      onClick={() => update({ tags: config.tags.filter((t) => t !== tag) })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">{t("publish:steps.visibility")}</label>
            <div className="visibility-toggle">
              <button
                className={`visibility-option ${config.releaseStatus === "private" ? "visibility-option--active" : ""}`}
                onClick={() => update({ releaseStatus: "private" })}
              >
                <span className="visibility-option-label">private</span>
                <span className="visibility-option-desc">{t("publish:steps.privateDesc")}</span>
              </button>
              <button
                className={`visibility-option ${config.releaseStatus === "public" ? "visibility-option--active" : ""}`}
                onClick={() => update({ releaseStatus: "public" })}
              >
                <span className="visibility-option-label">public</span>
                <span className="visibility-option-desc">{t("publish:steps.publicDesc")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
