import { Column, Img, Row, Section, Text } from '@react-email/components';
import * as React from 'react';

import type { EnrichedEntityCard } from '../../types/enriched-email.types';
import { EmailStageChevronBadge } from './EmailStageChevronBadge';
import { EmailTagCloud } from './EmailTagCloud';

type EmailEntityCardProps = {
  entity: EnrichedEntityCard;
};

export function EmailEntityCard({ entity }: EmailEntityCardProps) {
  return (
    <Section className="mb-6">
      {entity.imageUrl ? (
        <Img
          src={entity.imageUrl}
          alt={entity.title}
          className="mb-4 w-full rounded-sm"
        />
      ) : null}

      <Text className="m-0 mb-3 text-lg font-bold text-black">
        {entity.title}
      </Text>

      <Row className="mb-3">
        <Column className="w-[32px] pr-2" valign="middle">
          {entity.authorAvatarUrl ? (
            <Img
              src={entity.authorAvatarUrl}
              alt={entity.authorName}
              width="24"
              height="24"
              className="rounded-full"
            />
          ) : null}
        </Column>
        <Column valign="middle">
          <Text className="m-0 text-[12px] text-[#4b5563]">
            {entity.authorName}
          </Text>
        </Column>
        {entity.stageLabel ? (
          <Column align="right" valign="middle">
            <EmailStageChevronBadge stage={entity.stageLabel} compact />
          </Column>
        ) : null}
      </Row>

      {entity.descriptionExcerpt ? (
        <Text className="m-0 mb-4 [font-family:Georgia,Times_New_Roman,serif] text-[14px] leading-[24px] text-[#4b5563]">
          {entity.descriptionExcerpt}
        </Text>
      ) : null}

      <EmailTagCloud
        tags={entity.tags}
        extraTagCount={entity.extraTagCount}
        compact
      />

      <Text className="m-0 text-[12px] text-[#6b7280]">
        {entity.viewCount} views · {entity.commentCount} comments ·{' '}
        {entity.likeCount} likes
      </Text>
    </Section>
  );
}
