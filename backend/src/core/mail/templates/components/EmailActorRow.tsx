import { Column, Img, Row, Section, Text } from '@react-email/components';
import * as React from 'react';

type EmailActorRowProps = {
  name: string;
  avatarUrl?: string | null;
  timestamp?: string;
};

export function EmailActorRow({
  name,
  avatarUrl,
  timestamp,
}: EmailActorRowProps) {
  return (
    <Section className="mb-4">
      <Row>
        {avatarUrl ? (
          <Column className="w-[40px] pr-3">
            <Img
              src={avatarUrl}
              alt={name}
              width="32"
              height="32"
              className="rounded-full"
            />
          </Column>
        ) : null}
        <Column>
          <Text className="m-0 text-[14px] font-bold text-black">{name}</Text>
          {timestamp ? (
            <Text className="m-0 mt-1 text-[12px] text-[#6b7280]">
              {timestamp}
            </Text>
          ) : null}
        </Column>
      </Row>
    </Section>
  );
}
