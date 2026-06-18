import { Column, Img, Row, Text } from '@react-email/components';
import * as React from 'react';

const STAGE_IMAGES: Record<string, string> = {
  IDEATION:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930690/Type_Idea_Status_Ideation_kx3a8z.png',
  PROTOTYPING:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930690/Type_Idea_Status_Prototyping_qjyveh.png',
  COMPLETED:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930690/Type_Idea_Status_Completed_mqzcld.png',
  ARCHIVED:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/v1780930690/Type_Idea_Status_Archived_ayq8t9.png',
  PAUSED:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930690/Type_Idea_Status_Paused_ot7etm.png',
  ACTIVE_PROBLEM:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930689/Type_Problem_Status_Active_problem_dtztwh.png',
  COMPLETED_PROBLEM:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930689/Type_Problem_Status_Completed_problem_wqt39q.png',
  ARCHIVE_PROBLEM:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930689/Type_Problem_Status_Archive_problem_xeon2k.png',
  DRAFT:
    'https://res.cloudinary.com/oril-pollicoders/image/upload/q_auto/f_auto/v1780930689/Type_Draft_Status_Draft_ttartt.png',
};

function normalizeStageKey(stage: string | null | undefined): string {
  if (stage == null || typeof stage !== 'string') return '';
  return stage.trim().toUpperCase().replace(/\s+/g, '_');
}

export type EmailStageChevronBadgeProps = {
  stage?: string | null;
  stageText?: boolean;
  compact?: boolean;
};

export function EmailStageChevronBadge({
  stage,
  stageText = true,
  compact = true,
}: EmailStageChevronBadgeProps) {
  if (!stage?.trim()) return null;

  const key = normalizeStageKey(stage);
  const imageUrl = STAGE_IMAGES[key];

  if (!imageUrl) return null;

  const height = compact ? 18 : 24;
  const fontSize = compact ? '10px' : '13px';

  return (
    <Row className="m-0">
      {stageText && (
        <Column className="pr-2">
          <Text
            className="m-0 font-medium tracking-wide text-[#6a737c]"
            style={{ fontSize, lineHeight: `${height}px` }}
          >
            Stage
          </Text>
        </Column>
      )}
      <Column>
        <Img
          src={imageUrl}
          alt={`Stage: ${stage}`}
          height={height}
          style={{
            display: 'block',
            outline: 'none',
            border: 'none',
            textDecoration: 'none',
          }}
        />
      </Column>
    </Row>
  );
}
