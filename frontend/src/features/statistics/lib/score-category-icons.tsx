import type { LucideIcon } from 'lucide-react';
import {
  Eye,
  Heart,
  Lightbulb,
  MessageSquare,
  PenLine,
  Users,
} from 'lucide-react';

import type { MyScoreCategory } from '../model/statistics.types';

const SCORE_CATEGORY_ICONS: Record<MyScoreCategory['key'], LucideIcon> = {
  ideas: Lightbulb,
  updates: PenLine,
  joinedProjects: Users,
  comments: MessageSquare,
  views: Eye,
  likes: Heart,
};

export function getScoreCategoryIcon(key: MyScoreCategory['key']): LucideIcon {
  return SCORE_CATEGORY_ICONS[key];
}
