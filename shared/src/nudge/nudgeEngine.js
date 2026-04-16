const DAY_IN_MS = 24 * 60 * 60 * 1000;

const NUDGES = {
  inactive_24h: [
    'You have been missed. Want to take one gentle step back into your day?',
    'No pressure, just a soft check-in: one tiny action can shift your whole mood.',
  ],
  stressed: [
    'You are carrying a lot right now. Let’s pause for one slow breath together.',
    'I can feel the tension. A 60-second reset could help your mind unclench.',
  ],
  doomscroll: [
    'Your attention matters. Want to step away for a minute and come back clearer?',
    'That feed can wait. How about a quick stretch and some water?',
  ],
  default: [
    'You are doing your best. A short pause now can protect your energy.',
  ],
};

export function resolveTrigger({ lastActive, mood, triggerType }) {
  if (triggerType) return triggerType;

  if (mood?.toLowerCase() === 'stressed') return 'stressed';

  if (lastActive) {
    const inactiveForMs = Date.now() - new Date(lastActive).getTime();
    if (!Number.isNaN(inactiveForMs) && inactiveForMs > DAY_IN_MS) {
      return 'inactive_24h';
    }
  }

  return 'default';
}

export function createNudge({ lastActive, mood, triggerType, userName, site, minutes }) {
  const resolvedTrigger = resolveTrigger({ lastActive, mood, triggerType });
  const list = NUDGES[resolvedTrigger] ?? NUDGES.default;
  const message = list[Math.floor(Math.random() * list.length)] ?? NUDGES.default[0];

  const context = [];
  if (site) context.push(`on ${site}`);
  if (minutes) context.push(`for ${minutes} minute${minutes === 1 ? '' : 's'}`);

  const prefix = userName ? `${userName}, ` : '';
  const suffix = context.length ? ` (${context.join(' ')})` : '';

  return {
    triggerType: resolvedTrigger,
    message: `${prefix}${message}${suffix}`,
    action:
      resolvedTrigger === 'stressed'
        ? 'Take 3 deep breaths'
        : resolvedTrigger === 'inactive_24h'
          ? 'Start with one tiny task'
          : 'Put your phone down for 60 seconds',
  };
}
