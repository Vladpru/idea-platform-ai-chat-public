export const emailColors = {
  outerBg: '#f4f4f5',
  containerBg: '#ffffff',
  containerBorder: '#eaeaea',
  brandNavy: '#003366',
  textBody: '#4b5563',
  textMuted: '#9ca3af',
  textFooter: '#6b7280',
  divider: '#e5e7eb',
  tagBg: '#e4e8ec',
  tagText: '#6a737c',
  tagBorder: '#d5dbe1',
  statusBadge: '#0d9488',
  statusAccent: '#e17100',
} as const;

export const emailClasses = {
  body: 'mx-auto my-auto bg-[#f4f4f5] px-2 font-sans',
  container:
    'mx-auto my-[40px] max-w-[600px] overflow-hidden rounded border border-solid border-[#eaeaea] bg-white p-[20px]',
  contentSection: 'px-6 pb-6',
  headline:
    'mt-0 mb-6 text-2xl leading-tight font-bold text-[#003366] uppercase',
  splitHeadline:
    'mt-0 mb-6 text-2xl leading-tight font-bold uppercase text-black',
  splitHeadlineAccent: 'text-[#003366]',
  subheading: 'mb-4 text-xl font-bold text-black',
  divider: 'mx-0 my-[24px] w-full border border-solid border-[#e5e7eb]',
  bodyText: 'text-[14px] leading-[24px] text-[#4b5563]',
  disclaimer: 'mt-[32px] text-[12px] leading-[24px] text-[#9ca3af]',
  primaryButton:
    'box-border w-full rounded bg-[#003366] px-5 py-3 text-center text-[14px] font-bold text-white uppercase no-underline',
  secondaryButton:
    'box-border w-full rounded border border-solid border-[#003366] bg-white px-5 py-3 text-center text-[14px] font-bold text-[#003366] uppercase no-underline',
  outlineButton:
    'box-border w-full rounded border border-solid border-[#003366] bg-white px-5 py-3 text-center text-[14px] font-bold text-[#003366] uppercase no-underline',
  serifText:
    'text-[14px] leading-[24px] text-[#4b5563] [font-family:Georgia,Times_New_Roman,serif]',
} as const;
