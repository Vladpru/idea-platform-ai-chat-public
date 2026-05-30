export const IDEAS_DASHBOARD_LABELS = {
  pageTitle: 'Ideas',
  filterAriaLabel: 'Filter ideas by stage',
  filterLayoutId: 'ideas-dashboard-filter',
  sortLabel: 'Sort ideas',
  sortSelectId: 'ideas-sort',
  columnsLabel: 'Column count',
  columnsSelectId: 'ideas-columns',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  emptyGridMessage: 'No ideas match the current filters.',
  loadingMore: 'Loading more ideas...',
  loadErrorFallback: 'Failed to load ideas.',
  linkedSectionLabel: 'Linked problems',
  linkedItemsScrollLeftAriaLabel: 'Scroll linked problems left',
  emptyDescription: 'No description available.',
  emptyImage: 'No image',
  emptyStates: {
    drafts: {
      title: 'No drafts',
      description:
        "You haven't saved any idea drafts yet. Start creating an idea to save it as a draft.",
      buttonText: 'ADD NEW IDEA',
    },
    joined: {
      title: 'No joined ideas',
      description:
        "You haven't joined any ideas yet. Explore existing ideas and join the ones you like.",
      buttonText: 'EXPLORE IDEAS',
    },
    published: {
      title: 'No ideas',
      description:
        "You haven't created any ideas yet. Start creating an idea to share it with the community.",
      buttonText: 'ADD NEW IDEA',
    },
  },
} as const;
