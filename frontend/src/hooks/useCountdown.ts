import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '../utils/formatters';

export function useCountdown(isoDeadline: string) {
  const [label, setLabel] = useState<string>(() => formatTimeRemaining(isoDeadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(formatTimeRemaining(isoDeadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [isoDeadline]);

  return label;
}
