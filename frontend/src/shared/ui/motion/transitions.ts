export const tabUnderlineSpring = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 40,
};

export const panelFadeTransition = { duration: 0.15 };

export const panelFadeMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
