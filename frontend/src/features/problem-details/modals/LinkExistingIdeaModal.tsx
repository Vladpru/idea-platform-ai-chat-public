import { useMyIdeasQuery } from '@/features/ideas/hooks/use-idea-queries';
import {
  fieldLabelClass,
  primaryBtnClass,
  publishBtnClass,
  selectClass,
} from '@/features/ideas/lib/styles';
import { ArrowLink } from '@/features/ideas/ui/icons/ArrowLink';
import { useLinkIdeasToProblemMutation } from '@/features/problem-details/lib/use-problem-idea-link-mutations';
import { cancelOutlineBtn } from '@/features/profile/ui/profile-view-classes';
import { Link } from '@tanstack/react-router';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import {
  handleComboboxKeyboard,
  handleSearchInputEscape,
} from '@/shared/lib/keyboard';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const SAVE_TOOLTIP = 'Select at least one idea to link it to this problem.';

type LinkExistingIdeaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemId: string;
  linkedIdeaIds?: string[];
};

export function LinkExistingIdeaModal({
  open,
  onOpenChange,
  problemId,
  linkedIdeaIds = [],
}: LinkExistingIdeaModalProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const { data: myIdeasFeed, isLoading } = useMyIdeasQuery();
  const linkMutation = useLinkIdeasToProblemMutation(problemId);
  const myIdeas = useMemo(() => myIdeasFeed?.data ?? [], [myIdeasFeed?.data]);

  const linkedSet = useMemo(() => new Set(linkedIdeaIds), [linkedIdeaIds]);

  const availableIdeas = useMemo(() => {
    return myIdeas
      .filter(idea => !linkedSet.has(idea.id))
      .map(idea => ({
        id: idea.id,
        label: idea.title?.trim() || 'Untitled idea',
      }));
  }, [linkedSet, myIdeas]);

  const filteredIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableIdeas;
    return availableIdeas.filter(idea =>
      idea.label.toLowerCase().includes(query),
    );
  }, [availableIdeas, search]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDropdownOpen(false);
      setSearch('');
      setSelectedIdeaIds([]);
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    if (!dropdownOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown, { capture: true });
    return () =>
      document.removeEventListener('mousedown', onPointerDown, {
        capture: true,
      });
  }, [dropdownOpen]);

  const handleToggleIdea = (ideaId: string) => {
    setSelectedIdeaIds(previous =>
      previous.includes(ideaId)
        ? previous.filter(id => id !== ideaId)
        : [...previous, ideaId],
    );
  };

  const handleSave = () => {
    if (selectedIdeaIds.length === 0) return;

    linkMutation.mutate(selectedIdeaIds, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  const canSave = selectedIdeaIds.length > 0 && !linkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'border-brand-gray-200 bg-card max-w-lg gap-0 overflow-visible rounded-lg border p-0 shadow-xl',
          'sm:max-w-[520px]',
        )}
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <div className="relative p-6 md:p-8">
          <button
            type="button"
            className="text-brand-dark-blue hover:bg-muted focus-visible:ring-ring absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Close"
            onClick={() => handleOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </button>

          <DialogHeader className="space-y-2 pr-8 text-left">
            <DialogTitle className="text-brand-gray-900 text-xl font-bold">
              Link idea
            </DialogTitle>
            <DialogDescription className="text-brand-gray-600 text-sm">
              Got an idea that solves this? Link it!
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div>
              <p className={fieldLabelClass}>
                Ideas that can solve this problem
              </p>

              <div ref={containerRef} className="relative mt-2">
                <div
                  id="link-idea-select"
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-controls={listboxId}
                  tabIndex={0}
                  onClick={() => setDropdownOpen(previous => !previous)}
                  onKeyDown={event => {
                    handleComboboxKeyboard(event, {
                      onToggle: () => setDropdownOpen(previous => !previous),
                      onClose: closeDropdown,
                    });
                  }}
                  className={cn(
                    selectClass,
                    'relative h-auto min-h-8 cursor-pointer rounded-md pr-9 pl-2 text-left',
                    dropdownOpen &&
                      'border-brand-light-blue ring-brand-light-blue/40 ring-2',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5 py-1.5">
                    {selectedIdeaIds.length === 0 ? (
                      <span className="text-muted-foreground px-1 text-sm">
                        Choose an idea...
                      </span>
                    ) : (
                      selectedIdeaIds.map(id => {
                        const label = availableIdeas.find(
                          idea => idea.id === id,
                        )?.label;
                        if (!label) return null;

                        return (
                          <span
                            key={id}
                            className="bg-brand-gray-100 text-brand-gray-900 inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs"
                          >
                            <span className="max-w-[150px] truncate sm:max-w-[200px]">
                              {label}
                            </span>
                            <button
                              type="button"
                              onClick={event => {
                                event.stopPropagation();
                                handleToggleIdea(id);
                              }}
                              className="text-brand-gray-600 hover:text-brand-gray-900 inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors"
                              aria-label={`Remove ${label}`}
                            >
                              <X
                                className="size-3"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <ChevronDown
                    className={cn(
                      'text-brand-gray-600 pointer-events-none absolute top-3 right-3 z-10 size-4 transition-transform',
                      dropdownOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </div>

                {dropdownOpen ? (
                  <div
                    id={listboxId}
                    role="listbox"
                    aria-multiselectable={true}
                    className="border-brand-gray-200 bg-card absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border shadow-lg"
                  >
                    <div className="mx-2 p-2">
                      <div className="relative">
                        <Input
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          onKeyDown={event => {
                            handleSearchInputEscape(event, closeDropdown);
                          }}
                          placeholder="Search ideas..."
                          className="focus-visible:ring-brand-gray-200 text-brand-gray-500 bg-card h-8 rounded-xs pr-9 text-xs focus-visible:ring-1"
                          aria-label="Search ideas"
                        />
                        <Search
                          className="text-brand-gray-400 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                          aria-hidden
                        />
                      </div>
                    </div>

                    <ul className="max-h-52 overflow-y-auto py-1">
                      {isLoading ? (
                        <li className="text-brand-gray-600 px-3 py-2 text-sm">
                          Loading ideas…
                        </li>
                      ) : filteredIdeas.length === 0 ? (
                        <li className="text-brand-gray-600 px-3 py-2 text-sm">
                          No ideas found
                        </li>
                      ) : (
                        filteredIdeas.map(idea => {
                          const isSelected = selectedIdeaIds.includes(idea.id);

                          return (
                            <li
                              key={idea.id}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors',
                                  isSelected
                                    ? 'bg-brand-light-blue/35 hover:bg-brand-light-blue/45'
                                    : 'hover:bg-brand-light-blue/15',
                                )}
                                onClick={() => handleToggleIdea(idea.id)}
                                onKeyDown={event => {
                                  if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                  ) {
                                    event.preventDefault();
                                    handleToggleIdea(idea.id);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <span className="text-brand-gray-900 min-w-0 flex-1 truncate text-left text-sm">
                                  {idea.label}
                                </span>

                                <Link
                                  to={ROUTES.ideaDetail(idea.id)}
                                  target="_blank"
                                  className="text-brand-dark-blue inline-flex shrink-0 items-center gap-1 text-xs font-bold"
                                  onClick={event => event.stopPropagation()}
                                >
                                  View
                                  <ArrowLink className="size-3.5" aria-hidden />
                                </Link>

                                {isSelected ? (
                                  <Check
                                    className="text-brand-dark-blue size-4 shrink-0"
                                    aria-hidden
                                  />
                                ) : (
                                  <span
                                    className="size-4 shrink-0"
                                    aria-hidden
                                  />
                                )}
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className={cancelOutlineBtn}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>

              {canSave ? (
                <Button
                  type="button"
                  className={primaryBtnClass}
                  disabled={linkMutation.isPending}
                  onClick={handleSave}
                >
                  {linkMutation.isPending ? 'Saving…' : 'Save & link idea'}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        disabled
                        className={publishBtnClass}
                        tabIndex={-1}
                      >
                        Save &amp; link idea
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{SAVE_TOOLTIP}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
