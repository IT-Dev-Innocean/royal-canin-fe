'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';

type ChallengeStatus =
  | 'pending'
  | 'solved'
  | 'skipped'
  | 'failed'
  | (string & {});

interface ChallengeQuestion {
  id: number;
  body: string;
  reward_points?: number | null;
}

interface SessionChallenge {
  id?: number;
  position: number;
  status: ChallengeStatus;
  wrong_attempt_count?: number;
  question: ChallengeQuestion;
}

interface SessionActivity {
  id: number;
  code?: string;
  name: string;
  questions_per_session?: number;
}

interface ActivitySession {
  id: number;
  status: string;
  activity: SessionActivity;
  challenges: SessionChallenge[];
  resumed?: boolean;
}

interface SessionDetailResponse {
  success?: boolean;
  message?: string;
  data?: {
    session?: ActivitySession | null;
  } | null;
}

interface ScanAnswerResponse {
  success?: boolean;
  message?: string;
  data?: {
    session?: ActivitySession | null;
    correct?: boolean;
    reward_points?: number | null;
    points_awarded?: number | null;
    points_earned?: number | null;
    session_completed?: boolean;
  } | null;
}

type AnswerResult = {
  correct: boolean;
  message: string;
  points: number | null;
};

function statusBadge(s: ChallengeStatus) {
  switch (s) {
    case 'answered_correctly':
      return {
        label: 'Terjawab',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'skipped':
      return {
        label: 'Dilewati',
        cls: 'bg-gray-100 text-gray-600 border-gray-200',
      };
    case 'failed':
      return {
        label: 'Gagal',
        cls: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'pending':
    default:
      return {
        label: 'Menunggu jawaban',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      };
  }
}

function QuizContent() {
  const search = useSearchParams();
  const sessionIdRaw = search.get('sessionId');
  const sessionId =
    sessionIdRaw && /^\d+$/.test(sessionIdRaw) ? Number(sessionIdRaw) : NaN;

  const [session, setSession] = useState<ActivitySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerChallenge, setScannerChallenge] =
    useState<SessionChallenge | null>(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const [result, setResult] = useState<AnswerResult | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    getState: () => number;
  } | null>(null);

  const fetchSession = useCallback(
    async (silent = false) => {
      if (Number.isNaN(sessionId)) {
        setError('Session ID tidak valid.');
        setLoading(false);
        return;
      }
      const token = getToken();
      if (!token) {
        logoutParticipantHard();
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(`/api/activities/sessions/${sessionId}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          logoutParticipantHard();
          return;
        }
        const json = (await res
          .json()
          .catch(() => ({}))) as SessionDetailResponse;
        if (!res.ok || json.success === false) {
          setError(json.message ?? 'Gagal memuat detail sesi.');
          setSession(null);
          return;
        }
        const s = json.data?.session ?? null;
        if (!s) {
          setError('Data sesi tidak ditemukan.');
          setSession(null);
          return;
        }
        setSession(s);
      } catch {
        if (!silent) {
          setError('Tidak dapat terhubung ke server.');
          setSession(null);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      /* already stopped */
    }
    html5QrRef.current = null;
  }, []);

  const closeScanner = useCallback(() => {
    void stopScanner();
    setScannerOpen(false);
    setScannerChallenge(null);
    setScanError(null);
    setCameraError(null);
    setManualCode('');
    setScanSubmitting(false);
  }, [stopScanner]);

  const submitScan = useCallback(
    async (qrToken: string, challenge: SessionChallenge) => {
      const token = getToken();
      if (!token) {
        logoutParticipantHard();
        return;
      }

      setScanSubmitting(true);
      setScanError(null);

      try {
        const res = await fetch('/api/activities/scan', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            token: qrToken.trim(),
            activity_question_id: challenge.question.id,
          }),
        });

        if (res.status === 401) {
          logoutParticipantHard();
          return;
        }

        const json = (await res.json().catch(() => ({}))) as ScanAnswerResponse;

        if (!res.ok || json.success === false) {
          setResult({
            correct: false,
            message: json.message ?? 'Gagal memproses jawaban.',
            points: null,
          });
          closeScanner();
          return;
        }

        const d = json.data;
        const questionId = challenge.question.id;
        const challengeForQuestionCorrect =
          d?.session?.challenges?.some(
            (c) =>
              c.status === 'answered_correctly' && c.question.id === questionId
          ) === true;

        // Backend may omit `correct` and use `session_completed` / `points_earned` / challenge status;
        // message e.g. "Semua tantangan selesai." (not "sesi selesai").
        const successMessageSuggestsCorrect =
          /benar|correct|tantangan selesai|sesi selesai|sudah selesai/i.test(
            json.message ?? ''
          );

        const correct =
          d?.correct === true ||
          d?.session_completed === true ||
          challengeForQuestionCorrect ||
          successMessageSuggestsCorrect;

        const points: number | null = correct
          ? typeof d?.points_earned === 'number'
            ? d.points_earned
            : typeof d?.reward_points === 'number'
              ? d.reward_points
              : typeof d?.points_awarded === 'number'
                ? d.points_awarded
                : (challenge.question.reward_points ?? null)
          : null;

        setResult({
          correct,
          message:
            json.message ??
            (correct ? 'Jawaban benar!' : 'Jawaban belum tepat.'),
          points,
        });
        closeScanner();
        await fetchSession(true);
      } catch {
        setScanError('Tidak dapat terhubung ke server.');
      } finally {
        setScanSubmitting(false);
      }
    },
    [closeScanner, fetchSession]
  );

  const submitManualAnswer = useCallback(() => {
    if (!scannerChallenge || scanSubmitting) return;
    const t = manualCode.trim();
    if (!t) {
      setScanError('Masukkan kode jawaban terlebih dahulu.');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(t)) {
      setScanError(
        'Kode hanya boleh huruf, angka, titik, strip, dan garis bawah.'
      );
      return;
    }
    void submitScan(t, scannerChallenge);
  }, [manualCode, scanSubmitting, scannerChallenge, submitScan]);

  const openScanner = useCallback(
    async (challenge: SessionChallenge) => {
      setScannerChallenge(challenge);
      setScannerOpen(true);
      setScanError(null);
      setCameraError(null);
      setManualCode('');

      await new Promise((r) => setTimeout(r, 100));

      if (!scannerRef.current) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scannerId = `activity-answer-qr-reader-${challenge.question.id}`;
        scannerRef.current.id = scannerId;

        const scanner = new Html5Qrcode(scannerId);
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => {});
            html5QrRef.current = null;
            void submitScan(decodedText, challenge);
          },
          () => {}
        );
      } catch {
        setCameraError(
          'Tidak dapat mengakses kamera. Berikan izin kamera lalu coba lagi.'
        );
        html5QrRef.current = null;
      }
    },
    [submitScan]
  );

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const pendingChallenges = useMemo(
    () => (session?.challenges ?? []).filter((c) => c.status === 'pending'),
    [session]
  );
  const totalChallenges = session?.challenges.length ?? 0;
  const solvedCount = useMemo(
    () =>
      (session?.challenges ?? []).filter(
        (c) => c.status === 'answered_correctly'
      ).length,
    [session]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (result) {
        setResult(null);
        return;
      }
      if (scannerOpen) {
        closeScanner();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [result, scannerOpen, closeScanner]);

  if (Number.isNaN(sessionId)) {
    return (
      <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4 text-black'>
        <p className='text-sm text-red-600'>Session ID tidak valid.</p>
        <Link
          href='/event/activity'
          className='mt-4 block text-sm font-bold text-rc-red'>
          Kembali ke Kuis & Aktivitas
        </Link>
      </main>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-lg flex-col px-4 py-2 pb-8 sm:px-6 md:py-4 text-black'>
      <div className='mb-4 text-center'>
        <h1 className='text-xl font-bold text-rc-red'>Kuis & Aktivitas</h1>
      </div>

      {loading && (
        <div className='flex flex-col items-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
          <p className='mt-2 text-sm text-gray-500'>Memuat sesi…</p>
        </div>
      )}

      {!loading && error && !session && (
        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
          <p className='text-sm text-amber-900'>{error}</p>
          <button
            type='button'
            onClick={() => void fetchSession()}
            className='mt-3 text-sm font-bold text-rc-red underline'>
            Coba lagi
          </button>
        </div>
      )}

      {!loading && session && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm'>
            <p className='mt-1 text-lg font-bold text-gray-900'>
              {session.activity.name}
            </p>
            <p className='mt-2 text-xs text-gray-500'>
              {solvedCount} dari {totalChallenges} pertanyaan terjawab
            </p>
          </div>

          {totalChallenges === 0 && (
            <p className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500'>
              Belum ada pertanyaan pada sesi ini.
            </p>
          )}

          <ul className='space-y-3'>
            {session.challenges
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((c) => {
                const badge = statusBadge(c.status);
                const canAnswer = c.status === 'pending';
                return (
                  <li
                    key={c.id ?? c.position}
                    className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-[11px] font-bold text-gray-500'>
                        Pertanyaan
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className='mt-3 text-sm leading-relaxed text-gray-900'>
                      {c.question.body}
                    </p>

                    <div className='mt-3 flex items-center justify-between text-[11px] text-gray-500'>
                      <span className='rounded-full bg-rc-red px-2 py-0.5 font-bold text-white'>
                        +{c.question.reward_points ?? 0} Skor
                      </span>
                      {typeof c.wrong_attempt_count === 'number' &&
                        c.wrong_attempt_count > 0 && (
                          <span>Salah: {c.wrong_attempt_count}×</span>
                        )}
                    </div>

                    {canAnswer && (
                      <button
                        type='button'
                        onClick={() => void openScanner(c)}
                        className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.99]'>
                        Jawab Pertanyaan
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>

          {pendingChallenges.length === 0 && totalChallenges > 0 && (
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center'>
              <p className='text-sm font-bold text-emerald-800'>
                Semua pertanyaan selesai!
              </p>
            </div>
          )}
          <Link
            href={`/event/activity/${session.activity.id}`}
            className='block w-full rounded-xl border-2 border-rc-red bg-rc-red/10 py-3.5 text-center text-sm font-bold text-rc-red transition hover:bg-rc-red/20'>
            Kembali
          </Link>
        </div>
      )}

      {scannerOpen && scannerChallenge && (
        <div className='fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={closeScanner}
          />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='quiz-scan-title'
            className='relative z-10 max-h-[min(92dvh,100%)] w-full max-w-lg touch-pan-y overflow-y-auto overscroll-y-contain rounded-t-2xl bg-white px-4 py-4 pb-[max(4rem,env(safe-area-inset-bottom,0px))] shadow-2xl [scrollbar-gutter:stable] sm:max-h-[min(90dvh,44rem)] sm:rounded-2xl sm:px-5 sm:py-5'
            style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className='mb-4 flex items-start justify-between gap-2'>
              <div className='min-w-0 pr-2'>
                <h3
                  id='quiz-scan-title'
                  className='text-lg font-bold text-gray-900'>
                  Scan QR — Jawaban
                </h3>
                <p className='mt-0.5 text-xs text-gray-500'>
                  Arahkan kamera ke QR Code jawaban yang benar
                </p>
              </div>
              <button
                type='button'
                onClick={closeScanner}
                disabled={scanSubmitting}
                className='flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>

            <div className='rounded-xl border border-gray-100 bg-gray-50 px-4 py-3'>
              <p className='text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                Pertanyaan
              </p>
              <p className='mt-1 line-clamp-3 text-xs leading-relaxed text-gray-700'>
                {scannerChallenge.question.body}
              </p>
            </div>

            <div className='relative mt-4 overflow-hidden rounded-xl bg-black'>
              <div ref={scannerRef} className='min-h-[220px] w-full' />
              {scanSubmitting && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-white'
                  />
                  <p className='mt-3 text-sm font-medium text-white'>
                    Memproses jawaban…
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <p className='mt-3 text-center text-xs text-amber-700'>
                {cameraError}
              </p>
            )}
            {scanError && (
              <p className='mt-3 text-center text-xs text-red-600'>
                {scanError}
              </p>
            )}

            <p className='mt-4 text-center text-xs leading-relaxed text-gray-500'>
              Pastikan QR Code terlihat jelas di dalam kotak pemindaian.
            </p>

            <div className='my-5 flex items-center gap-3'>
              <div className='h-px min-w-0 flex-1 bg-gray-200' />
              <span className='shrink-0 text-[11px] font-semibold text-gray-400'>
                atau
              </span>
              <div className='h-px min-w-0 flex-1 bg-gray-200' />
            </div>

            <div className='rounded-xl border border-gray-100 bg-slate-50/90 p-4'>
              <p className='text-xs font-bold text-gray-800'>
                Masukkan kode manual
              </p>
              <p className='mt-0.5 text-[11px] leading-relaxed text-gray-500'>
                Jika kamera tidak tersedia, izin ditolak, atau pemindaian gagal,
                ketik kode yang ada di bawah QR poster, lalu klik tombol kirim.
              </p>
              <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch'>
                <input
                  type='text'
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !scanSubmitting) {
                      e.preventDefault();
                      void submitManualAnswer();
                    }
                  }}
                  disabled={scanSubmitting}
                  autoComplete='off'
                  autoCapitalize='characters'
                  spellCheck={false}
                  placeholder='Contoh: DMY-SC-X01-OK'
                  className='min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-gray-900 shadow-inner outline-none transition focus:border-rc-red focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-100'
                />
                <button
                  type='button'
                  disabled={scanSubmitting}
                  onClick={() => void submitManualAnswer()}
                  className='shrink-0 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5'>
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-6'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setResult(null)}
          />
          <div className='relative w-full max-w-[320px] rounded-2xl bg-white p-7 text-center shadow-2xl'>
            {result.correct ? (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
                  <Icon icon='mdi:check-bold' className='h-8 w-8' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>
                  Jawaban Benar!
                </h3>
                {typeof result.points === 'number' && (
                  <div className='mt-2 w-[150px] mx-auto flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3'>
                    <Icon icon='twemoji:coin' className='h-8 w-8' />
                    <div>
                      <p className='text-2xl font-extrabold tabular-nums text-yellow-800'>
                        {result.points}
                      </p>
                    </div>
                  </div>
                )}
                <p className='mt-2 text-xs text-gray-500'>{result.message}</p>
                <button
                  type='button'
                  onClick={() => setResult(null)}
                  className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#b50015]'>
                  Lanjut
                </button>
              </>
            ) : (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
                  <Icon icon='mdi:close-thick' className='h-8 w-8' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>Belum Tepat</h3>
                <p className='mt-2 text-[12px] leading-relaxed text-gray-500'>
                  {result.message}
                </p>
                <button
                  type='button'
                  onClick={() => {
                    setResult(null);
                    if (scannerChallenge) void openScanner(scannerChallenge);
                    else if (pendingChallenges[0])
                      void openScanner(pendingChallenges[0]);
                  }}
                  className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b50015]'>
                  Coba Scan Ulang
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ActivityQuizPage() {
  return (
    <Suspense
      fallback={
        <main className='mx-auto flex w-full max-w-lg flex-col items-center justify-center px-4 py-12 text-black'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
        </main>
      }>
      <QuizContent />
    </Suspense>
  );
}
