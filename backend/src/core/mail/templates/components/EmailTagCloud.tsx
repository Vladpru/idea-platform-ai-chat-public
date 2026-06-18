import { Text } from '@react-email/components';
import * as React from 'react';

import { emailColors } from './email-tokens';

type EmailTagCloudProps = {
  tags: string[];
  extraTagCount?: number;
  compact?: boolean;
};

const tagStyle = (compact: boolean): React.CSSProperties => ({
  display: 'inline-block',
  backgroundColor: emailColors.tagBg,
  color: emailColors.tagText,
  border: `1px solid ${emailColors.tagBorder}`,
  borderRadius: '8px',
  fontSize: compact ? '10px' : '12px',
  fontWeight: 400,
  padding: compact ? '2px 6px' : '3px 7px',
  marginRight: compact ? '4px' : '8px',
  marginBottom: '4px',
  maxWidth: compact ? '80px' : '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const counterStyle = (compact: boolean): React.CSSProperties => ({
  ...tagStyle(compact),
  fontWeight: 700,
  maxWidth: 'none',
});

export function EmailTagCloud({
  tags,
  extraTagCount = 0,
  compact = true,
}: EmailTagCloudProps) {
  const visibleTags = tags.slice(0, 3);
  const remaining =
    extraTagCount > 0 ? extraTagCount : Math.max(0, tags.length - visibleTags.length);

  if (visibleTags.length === 0) {
    return null;
  }

  return (
    <Text className="m-0 mb-4" style={{ lineHeight: '1.6' }}>
      {visibleTags.map(tag => (
        <span key={tag} style={tagStyle(compact)} title={tag}>
          {tag}
        </span>
      ))}
      {remaining > 0 ? (
        <span style={counterStyle(compact)}>+{remaining}</span>
      ) : null}
    </Text>
  );
}
