import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

export function EmailFooter() {
  return (
    <Section className="border-t border-solid border-[#e5e7eb] pt-[24px] pb-[8px] text-center">
      <Text className="m-0 mb-4">
        <Link href="#" className="mx-2 text-[12px] text-[#003366] underline">
          Unsubscribe
        </Link>
        <Link href="#" className="mx-2 text-[12px] text-[#003366] underline">
          News
        </Link>
        <Link href="#" className="mx-2 text-[12px] text-[#003366] underline">
          Contact
        </Link>
      </Text>
      <Text className="m-0 mb-1 text-[12px] text-[#6b7280]">
        400 Shades Creek Parkway Birmingham, AL 35209
      </Text>
      <Text className="m-0 text-[12px] text-[#6b7280]">
        © {new Date().getFullYear()} Robins & Morton
      </Text>
    </Section>
  );
}
