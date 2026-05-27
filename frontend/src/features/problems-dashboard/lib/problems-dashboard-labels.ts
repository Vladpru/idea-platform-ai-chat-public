export const PROBLEMS_DASHBOARD_LABELS = {
  pageTitle: 'Problems',
  filterAriaLabel: 'Filter problems by stage',
  filterLayoutId: 'problems-dashboard-filter',
  sortLabel: 'Sort problems',
  sortSelectId: 'problems-sort',
  columnsLabel: 'Column count',
  columnsSelectId: 'problems-columns',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  emptyGridMessage: 'No problems match the current filters.',
  loadingMore: 'Loading more problems...',
  loadErrorFallback: 'Failed to load problems.',
  linkedSectionLabel: 'Linked ideas',
  linkedItemsScrollLeftAriaLabel: 'Scroll linked ideas left',
  emptyDescription: 'No description available.',
  emptyImage: 'No image',
  emptyStates: {
    drafts: {
      title: 'No drafts',
      description:
        "You haven't saved any problem drafts yet. Start creating a problem to save it as a draft.",
      buttonText: 'ADD NEW PROBLEM',
    },
    joined: {
      title: 'No joined problems',
      description:
        "You haven't joined any problems yet. Explore existing problems and join the ones you like.",
      buttonText: 'EXPLORE PROBLEMS',
    },
    published: {
      title: 'No problems',
      description:
        "You haven't created any problems yet. Start creating a problem to share it with the community.",
      buttonText: 'ADD NEW PROBLEM',
    },
  },
} as const;
