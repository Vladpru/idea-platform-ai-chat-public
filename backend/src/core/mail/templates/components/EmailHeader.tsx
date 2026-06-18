import { Img, Section } from '@react-email/components';
import * as React from 'react';

const LOGO_URL =
  'https://res.cloudinary.com/oril-pollicoders/image/upload/v1779374468/polycodersLogoWhiteText_q9s8tr.png';

export function EmailHeader() {
  return (
    <Section className="-m-[20px] mb-6 bg-[#003366] p-6">
      <div className="flex items-center">
        <Img
          src={LOGO_URL}
          alt="Pollycoders Logo"
          height="32"
          className="inline-block align-middle"
        />
      </div>
    </Section>
  );
}
