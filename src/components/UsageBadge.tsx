import { Badge } from '@mantine/core';

/**
 * Props for the UsageBadge component
 * 
 * Requirements: 2.1, 2.2, 2.4, 15.2
 */
interface UsageBadgeProps {
  /** Number of times the ingress link has been opened */
  count: number;
}

/**
 * UsageBadge component displays the usage count for an ingress link
 * 
 * Features:
 * - Displays the total number of opens for an ingress host
 * - Blue color for count > 0, gray for count = 0
 * - Light variant for subtle appearance
 * - Positioned with marginLeft: 'auto' for right alignment
 * 
 * Requirements: 2.1, 2.2, 2.4, 15.2
 */
export function UsageBadge({ count }: UsageBadgeProps) {
  return (
    <Badge
      size="sm"
      variant="light"
      color={count > 0 ? 'blue' : 'gray'}
      style={{ marginLeft: 'auto' }}
    >
      {count}
    </Badge>
  );
}
