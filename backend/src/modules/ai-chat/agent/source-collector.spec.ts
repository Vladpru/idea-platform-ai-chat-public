import { SourceCollector } from './source-collector';

describe('SourceCollector', () => {
  it('dedupes entity sources by type and id, keeping the highest relevance', () => {
    const collector = new SourceCollector();
    collector.add([{ type: 'idea', id: 'i1', title: 'A', relevance: 0.2 }]);
    collector.add([{ type: 'idea', id: 'i1', title: 'A', relevance: 0.9 }]);
    collector.add([{ type: 'problem', id: 'i1', title: 'P', relevance: 0.1 }]);

    expect(collector.list()).toEqual([
      { type: 'idea', id: 'i1', title: 'A', relevance: 0.9 },
      { type: 'problem', id: 'i1', title: 'P', relevance: 0.1 },
    ]);
  });

  it('dedupes knowledge sources by title', () => {
    const collector = new SourceCollector();
    collector.add([
      { type: 'knowledge', title: 'faq.md', relevance: 0.5 },
      { type: 'knowledge', title: 'faq.md', relevance: 0.3 },
    ]);

    expect(collector.list()).toEqual([
      { type: 'knowledge', title: 'faq.md', relevance: 0.5 },
    ]);
  });
});
