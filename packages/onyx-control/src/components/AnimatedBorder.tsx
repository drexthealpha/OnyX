import React, { useState, useEffect, ReactNode } from 'react';
import { Box } from 'ink';

const COLORS = ['cyan', 'blue', 'magenta', 'red', 'yellow', 'green'];

export function AnimatedBorder({ children, isFocused }: { children: ReactNode; isFocused?: boolean }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => {
      setColorIndex((i) => (i + 1) % COLORS.length);
    }, 200);
    return () => clearInterval(timer);
  }, [isFocused]);

  const borderColor = isFocused ? COLORS[colorIndex] : 'gray';

  return (
    <Box borderStyle="round" borderColor={borderColor}>
      {children}
    </Box>
  );
}
