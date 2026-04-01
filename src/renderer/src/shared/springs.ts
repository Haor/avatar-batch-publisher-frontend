export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
  smooth: { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },
  gentle: { type: "spring", stiffness: 170, damping: 22, mass: 1 },
  bouncy: { type: "spring", stiffness: 400, damping: 15, mass: 0.6 },
} as const;

/** 列表 stagger 容器 variants */
export function makeStagger(delay = 0.04) {
  return {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: delay } },
  };
}

/** 子元素 fadeIn variants */
export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
};
