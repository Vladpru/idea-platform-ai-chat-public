import activeVoiceIconUrl from '../public/ActiveVoice.svg';
import collaboratorIconUrl from '../public/Collaborator.svg';
import completerIconUrl from '../public/Completer.svg';
import connectorIconUrl from '../public/Connector.svg';
import innovatorIconUrl from '../public/Innovator.svg';
import topContributorIconUrl from '../public/TopContributor.svg';

export const BADGE_ICON_URLS: Record<string, string> = {
  innovator: innovatorIconUrl,
  active_voice: activeVoiceIconUrl,
  collaborator: collaboratorIconUrl,
  completer: completerIconUrl,
  connector: connectorIconUrl,
  top_contributor: topContributorIconUrl,
};

export const BADGE_EARNED_MESSAGES: Record<string, string> = {
  innovator: "You've created 5 ideas — your vision is making an impact!",
  active_voice: "You've added 10+ comments — your voice shapes the conversation!",
  collaborator: "You've joined 10+ projects — teamwork fuels great results!",
  completer: "You've completed 3 ideas — execution makes the difference!",
  connector: "You've invited 5+ users — your network drives collaboration!",
  top_contributor: "You've topped the monthly leaderboard — outstanding!",
};
