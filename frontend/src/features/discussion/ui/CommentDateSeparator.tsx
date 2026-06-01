type CommentDateSeparatorProps = {
  label: string;
};

export function CommentDateSeparator({ label }: CommentDateSeparatorProps) {
  return (
    <div
      className="bg-brand-cool-gray-3 mx-auto mb-4 w-fit rounded-full px-4 py-1.5 text-xs font-medium text-gray-500"
      role="separator"
      aria-label={label}
    >
      {label}
    </div>
  );
}
