import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export function ProgressBar({ value, width = 40, color = 'green' }: { value: number; width?: number; color?: string }) {
  const [animValue, setAnimValue] = useState(0);

  useEffect(() => {
    setAnimValue(value);
  }, [value]);

  const filledWidth = Math.round((animValue / 100) * width);
  const emptyWidth = width - filledWidth;
  const filledString = '█'.repeat(filledWidth);
  const emptyString = '░'.repeat(emptyWidth);

  return (
    <Box>
      <Text color={color}>{filledString}</Text>
      <Text color="gray">{emptyString}</Text>
    </Box>
  );
}
