import type { LucideIcon } from 'lucide-react';
import {
  Award,
  CheckCircle2,
  Eye,
  Heart,
  Lightbulb,
  MessageSquare,
  PenLine,
  Users,
} from 'lucide-react';

import type { ScoreCategoryKey } from '../model/statistics.types';

const SCORE_CATEGORY_ICONS: Record<ScoreCategoryKey, LucideIcon> = {
  ideas: Lightbulb,
  updates: PenLine,
  joinedProjects: Users,
  comments: MessageSquare,
  views: Eye,
  likes: Heart,
  completedIdeas: CheckCircle2,
  badges: Award,
};

export function getScoreCategoryIcon(key: ScoreCategoryKey): LucideIcon {
  return SCORE_CATEGORY_ICONS[key];
}
