import { CHAT_INTENTS } from './chat.types';
import { selectToolNames } from './tool-registry';

describe('selectToolNames', () => {
  it('gives create intents only propose_draft', () => {
    expect(selectToolNames('create_idea', null)).toEqual(['propose_draft']);
    expect(selectToolNames('create_problem', null)).toEqual(['propose_draft']);
  });

  it('gives search the search and get tools', () => {
    expect(selectToolNames('search', null)).toEqual([
      'search_ideas_problems',
      'search_knowledge',
      'get_entity',
    ]);
  });

  it('adds form tools only on the idea form, without duplicates', () => {
    expect(selectToolNames('search', { type: 'idea_form' })).toEqual([
      'search_ideas_problems',
      'search_knowledge',
      'get_entity',
      'suggest_tags',
      'suggest_linked_problems',
    ]);
    expect(selectToolNames('navigate', { type: 'problem_form' })).toEqual([
      'search_knowledge',
    ]);
  });

  it('never offers suggest tools without the idea form', () => {
    for (const intent of CHAT_INTENTS) {
      const names = selectToolNames(intent, null);
      expect(names).not.toContain('suggest_tags');
      expect(names).not.toContain('suggest_linked_problems');
    }
  });
});
