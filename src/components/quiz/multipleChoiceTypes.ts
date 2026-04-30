import type { EventActivityListItem } from '@/app/event/activity/activityListTypes';

/** Satu tantangan quiz — subset field yang dibutuhkan pemetaan jawaban poster. */
export type PosterQuizChallenge = {
  id?: number;
  position: number;
  question: {
    id: number;
    body: string;
    reward_points?: number | null;
  };
};

export type EventActivityListPayload = {
  success?: boolean;
  data: EventActivityListItem[];
};
