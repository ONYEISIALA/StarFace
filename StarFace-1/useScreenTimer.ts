import { useEffect, useState } from 'react';

export function useScreenTimer() {
  const enabled = localStorage.getItem('parental_enabled') === 'true';
  const totalTime = Number(localStorage.getItem('parental_screenTime') || '30');
  const [remaining, setRemaining] = useState<number>(() => {
    const saved = localStorage.getItem('parental_remaining');
    return saved ? Number(saved) : totalTime * 60;
  });

  useEffect(() => {
    if (!enabled || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        localStorage.setItem('parental_remaining', next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, remaining]);

  const resetTimer = () => {
    const newTime = totalTime * 60;
    setRemaining(newTime);
    localStorage.setItem('parental_remaining', newTime.toString());
  };

  return { remaining, isLocked: remaining <= 0, resetTimer };
}
