import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const WelcomeEmail = () => {
  const previewText = `Welcome to The Idea Platform`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-[#f4f4f5] px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[600px] overflow-hidden rounded border border-solid border-[#eaeaea] bg-white p-[20px]">
            {/* Header */}
            <Section className="-m-[20px] mb-6 bg-[#003366] p-6">
              <div className="flex items-center">
                <Img
                  src="https://res.cloudinary.com/oril-pollicoders/image/upload/v1779374468/polycodersLogoWhiteText_q9s8tr.png"
                  alt="Pollycoders Logo"
                  height="32"
                  className="inline-block align-middle"
                />
              </div>
            </Section>

            <Section className="px-6 pb-6">
              <Heading className="mt-0 mb-6 text-2xl leading-tight font-bold text-[#003366] uppercase">
                WELCOME TO THE IDEA PLATFORM
              </Heading>

              <Hr className="mx-0 my-[24px] w-full border border-solid border-[#e5e7eb]" />

              <Heading as="h3" className="mb-4 text-xl font-bold text-black">
                We're glad you're here
              </Heading>

              <Text className="text-[14px] leading-[24px] text-[#4b5563]">
                Your account has been successfully created. We are excited to
                have you join our community of innovators and creators. Our
                platform is designed to help you capture, share, and develop the
                next big ideas.
              </Text>

              <Text className="mt-[24px] text-[14px] leading-[24px] text-[#4b5563]">
                You can now start exploring existing projects, submitting your
                own concepts, and collaborating with your team members to bring
                innovations to life.
              </Text>

              <Text className="mt-[32px] text-[12px] leading-[24px] text-[#9ca3af]">
                If you did not create an account, you can safely ignore this
                email.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-solid border-[#e5e7eb] pt-[24px] pb-[8px] text-center">
              <Text className="m-0 mb-4">
                <Link
                  href="#"
                  className="mx-2 text-[12px] text-[#003366] underline"
                >
                  Unsubscribe
                </Link>
                <Link
                  href="#"
                  className="mx-2 text-[12px] text-[#003366] underline"
                >
                  News
                </Link>
                <Link
                  href="#"
                  className="mx-2 text-[12px] text-[#003366] underline"
                >
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
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
