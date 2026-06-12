import { BADGE_ICON_URLS } from '../lib/badge-icons';

type BadgeToastProps = {
  name: string;
  badgeKey: string;
  description: string;
};

export function BadgeToast({ name, badgeKey, description }: BadgeToastProps) {
  const iconUrl = BADGE_ICON_URLS[badgeKey];

  return (
    <div className="relative w-[356px] rounded-xl border border-gray-100 bg-white px-4 pt-10 pb-4 shadow-lg">
      {iconUrl && (
        <div className="absolute -top-7 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full">
          <img src={iconUrl} alt="" aria-hidden className="size-12" />
        </div>
      )}
      <p className="text-brand-dark-blue text-center text-base font-bold">
        🎉 New Badge Earned: {name}
      </p>
      <p className="text-brand-gray-600 mt-1 text-center text-sm">
        {description}
      </p>
    </div>
  );
}
