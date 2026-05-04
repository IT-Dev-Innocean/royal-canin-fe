'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  parseActivitiesListResponse,
  type ActivityScannableCode,
} from '@/app/event/activity/activityListTypes';
import type { PosterQuizChallenge } from './multipleChoiceTypes';
import { getToken } from '@/lib/auth';
import {
  isStudyCasePosterQuizCode,
  resolvePosterTrueFalseTokens,
  studyCasePosterLetter,
} from './posterQuizLogic';

export type MultipleChoiceProps = {
  activityId: number;
  activityCode: string | undefined;
  challenge: PosterQuizChallenge;
  submitting: boolean;
  onAnswerWithToken: (token: string) => void | Promise<void>;
  fallback: ReactNode;
};

/** Kuis Study Case Poster: dua opsi pakai `public_token` + label dari API atau pemetaan di `posterQuizLogic`; layout kolom. */
export default function MultipleChoice({
  activityId,
  activityCode,
  challenge,
  submitting,
  onAnswerWithToken,
  fallback,
}: MultipleChoiceProps) {
  const [posterScannableCodes, setPosterScannableCodes] = useState<
    ActivityScannableCode[]
  >([]);

  useEffect(() => {
    if (!activityId || !isStudyCasePosterQuizCode(activityCode)) {
      setPosterScannableCodes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const auth = getToken();
      if (!auth) return;
      try {
        const res = await fetch('/api/activities', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${auth}`,
          },
        });
        if (res.status === 401) return;
        if (!res.ok) return;
        const json: unknown = await res.json();
        const activities = parseActivitiesListResponse(json);
        if (cancelled || activities == null) return;
        const row = activities.find((a) => a.id === activityId);
        setPosterScannableCodes(row?.scannable_codes ?? []);
      } catch {
        if (!cancelled) setPosterScannableCodes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, activityCode]);

  const posterQuizLetter = useMemo(() => {
    if (!activityCode || !isStudyCasePosterQuizCode(activityCode)) return null;
    return studyCasePosterLetter(activityCode);
  }, [activityCode]);

  const mcTokens = useMemo(() => {
    if (!posterQuizLetter || posterScannableCodes.length === 0) {
      return {
        trueToken: null,
        falseToken: null,
        trueLabel: 'Benar',
        falseLabel: 'Salah',
      };
    }
    return resolvePosterTrueFalseTokens(
      posterScannableCodes,
      posterQuizLetter,
      challenge
    );
  }, [posterQuizLetter, posterScannableCodes, challenge]);

  const usePosterMcButtons =
    isStudyCasePosterQuizCode(activityCode) &&
    posterQuizLetter != null &&
    mcTokens.trueToken != null &&
    mcTokens.falseToken != null;

  if (!usePosterMcButtons) {
    return <>{fallback}</>;
  }

  return (
    <div className='mt-4 flex flex-col gap-2 sm:gap-3'>
      <button
        type='button'
        disabled={submitting}
        onClick={() =>
          mcTokens.trueToken && void onAnswerWithToken(mcTokens.trueToken)
        }
        className='flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-rc-red bg-rc-red/10 px-3 py-3 text-center text-[13px] sm:text-sm font-bold text-rc-red transition hover:bg-rc-red/20 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]'>
        {mcTokens.trueLabel}
      </button>
      <button
        type='button'
        disabled={submitting}
        onClick={() =>
          mcTokens.falseToken && void onAnswerWithToken(mcTokens.falseToken)
        }
        className='flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-rc-red bg-rc-red/10 px-3 py-3 text-center text-[13px] sm:text-sm font-bold text-rc-red transition hover:bg-rc-red/20 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]'>
        {mcTokens.falseLabel}
      </button>
    </div>
  );
}

export { isStudyCasePosterQuizCode } from './posterQuizLogic';
