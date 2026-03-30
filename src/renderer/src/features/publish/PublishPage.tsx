import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useActivePublish } from "../../app/ActivePublishContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { Spinner } from "../../shared/components/Spinner";
import { StepIndicator } from "./StepIndicator";
import { SelectArtifactStep } from "./steps/SelectArtifactStep";
import { SelectAccountsStep } from "./steps/SelectAccountsStep";
import { ConfigureInfoStep, type PerArtifactConfig, type ArtifactInfo } from "./steps/ConfigureInfoStep";
import { PreflightStep } from "./steps/PreflightStep";
import { MonitorView } from "./MonitorView";

const stepLabels = ["选择模型", "选择账号", "配置信息", "确认发布"];

export function PublishPage() {
  const api = useApi();
  const { activeQueueId, setActiveQueueId, clearActiveQueueId } = useActivePublish();
  const { activePage, navigationTick, consumePayload } = useNavigation();
  const [view, setView] = useState<"wizard" | "monitor">("wizard");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // 每个模型独立的完整配置
  const [perArtifactConfigs, setPerArtifactConfigs] = useState<Map<string, PerArtifactConfig>>(new Map());

  const [canStart, setCanStart] = useState(false);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [monitorTerminal, setMonitorTerminal] = useState(false);

  const resetWizard = useCallback(() => {
    setView("wizard");
    setStep(0);
    setDirection(1);
    setQueueId(null);
    setCanStart(false);
    setMonitorTerminal(false);
    setSelectedArtifacts([]);
    setSelectedAccounts([]);
    setPerArtifactConfigs(new Map());
  }, []);

  // artifacts 列表
  const { data: artifactsData } = useQuery(
    (signal) => api.artifacts.list(signal),
    [],
  );

  // 选中的 artifact 信息
  const selectedArtifactInfos = useMemo<ArtifactInfo[]>(() => {
    if (!artifactsData) return [];
    return selectedArtifacts
      .map((id) => artifactsData.items.find((a) => a.artifactId === id))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => ({ artifactId: a.artifactId, name: a.name, thumbnailPath: a.thumbnailPath }));
  }, [selectedArtifacts, artifactsData]);

  // 自动为新选中的 artifact 初始化 per-config
  useEffect(() => {
    setPerArtifactConfigs((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const info of selectedArtifactInfos) {
        if (!next.has(info.artifactId)) {
          next.set(info.artifactId, { name: info.name, description: "", tags: [], releaseStatus: "private", imagePath: info.thumbnailPath });
          changed = true;
        }
      }
      // 清理已取消选择的
      for (const key of next.keys()) {
        if (!selectedArtifacts.includes(key)) {
          next.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedArtifactInfos, selectedArtifacts]);

  function handlePerArtifactChange(artifactId: string, config: PerArtifactConfig) {
    setPerArtifactConfigs((prev) => new Map(prev).set(artifactId, config));
  }

  // 第一个模型的名称 (用于 preflight 和 queue name)
  const firstName = perArtifactConfigs.values().next().value?.name ?? "";

  const createQueue = useMutation(async () => {
    const response = await api.publishQueue.create({
      queueName: firstName || "手动发布",
      items: selectedArtifacts.map((artifactId) => {
        const per = perArtifactConfigs.get(artifactId);
        return {
          artifactId,
          accountIds: selectedAccounts,
          name: per?.name ?? artifactId,
          description: per?.description || null,
          tags: per?.tags ?? [],
          releaseStatus: per?.releaseStatus ?? "private",
          thumbnailPath: per?.imagePath ?? null,
        };
      }),
    });
    return response;
  });

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }
  function goPrev() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleStart() {
    try {
      const result = await createQueue.execute();
      setActiveQueueId(result.queueId);
      setQueueId(result.queueId);
      setMonitorTerminal(false);
      setView("monitor");
    } catch { /* error shown via mutation */ }
  }

  const handleNewPublish = useCallback(() => {
    resetWizard();
  }, [resetWizard]);

  useEffect(() => {
    if (monitorTerminal) clearActiveQueueId();
  }, [monitorTerminal, clearActiveQueueId]);

  useEffect(() => {
    if (activePage !== "publish") return;

    const payload = consumePayload();
    if (payload?.publishArtifactIds?.length) {
      resetWizard();
      setSelectedArtifacts(payload.publishArtifactIds);
      if (payload.publishPrefill) {
        const id = payload.publishArtifactIds[0];
        setPerArtifactConfigs(new Map([[id, {
          name: payload.publishPrefill.name ?? "",
          description: "",
          tags: [],
          releaseStatus: "private",
          imagePath: payload.publishPrefill.imagePath ?? null,
        }]]));
      }
      setStep(Math.max(0, Math.min(payload.publishStep ?? 1, 3)));
      return;
    }

    if (view === "monitor" && monitorTerminal) {
      resetWizard();
      return;
    }

    if (view === "wizard" && !queueId && activeQueueId) {
      setQueueId(activeQueueId);
      setMonitorTerminal(false);
      setView("monitor");
    }
  }, [activePage, navigationTick, view, monitorTerminal, queueId, activeQueueId, resetWizard, consumePayload]);

  const canNextStep = (() => {
    switch (step) {
      case 0: return selectedArtifacts.length > 0;
      case 1: return selectedAccounts.length > 0;
      case 2: return firstName.trim().length > 0;
      case 3: return canStart;
      default: return false;
    }
  })();

  if (view === "monitor" && queueId) {
    return <MonitorView queueId={queueId} onNewPublish={handleNewPublish} onTerminalChange={setMonitorTerminal} />;
  }

  return (
    <div className="publish-wizard">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <StepIndicator currentStep={step} steps={stepLabels} />
      </motion.div>

      <div className="step-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 30, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction * -30, filter: "blur(4px)" }}
            transition={spring.smooth}
          >
            {step === 0 && (
              <SelectArtifactStep
                selected={selectedArtifacts}
                onSelectionChange={setSelectedArtifacts}
              />
            )}
            {step === 1 && (
              <SelectAccountsStep
                selected={selectedAccounts}
                onSelectionChange={setSelectedAccounts}
              />
            )}
            {step === 2 && (
              <ConfigureInfoStep
                artifacts={selectedArtifactInfos}
                perArtifactConfigs={perArtifactConfigs}
                onPerArtifactChange={handlePerArtifactChange}
              />
            )}
            {step === 3 && selectedArtifacts[0] && (
              <PreflightStep
                artifactId={selectedArtifacts[0]}
                accountIds={selectedAccounts}
                config={(() => {
                  const per = perArtifactConfigs.get(selectedArtifacts[0]);
                  return {
                    name: per?.name ?? firstName,
                    description: per?.description ?? "",
                    tags: per?.tags ?? [],
                    releaseStatus: per?.releaseStatus ?? "private",
                    imagePath: per?.imagePath ?? null,
                  };
                })()}
                onCanStartChange={setCanStart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="publish-wizard-actions">
        {step > 0 && (
          <motion.button
            className="btn btn-secondary"
            onClick={goPrev}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            上一步
          </motion.button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <motion.button
            className="btn btn-primary"
            onClick={goNext}
            disabled={!canNextStep}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            下一步
          </motion.button>
        ) : (
          <motion.button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={!canStart || createQueue.loading}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {createQueue.loading ? <Spinner size={14} /> : "开始发布"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
