'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import type { EventActivityQuestion, ScannableCode } from './types';

function parseResponseJson(
  res: Response,
  text: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  const t = text.trim();
  if (!t) {
    return {
      ok: false,
      message: res.ok
        ? 'Respons server kosong.'
        : `Gagal mengirim data (HTTP ${res.status}).`,
    };
  }
  try {
    return { ok: true, value: JSON.parse(t) as unknown };
  } catch {
    return {
      ok: false,
      message: `Gagal memproses respons (HTTP ${res.status}).`,
    };
  }
}

function sortQuestionsByOrder(
  list: EventActivityQuestion[]
): EventActivityQuestion[] {
  if (!list.length) return [];
  return [...list].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
}

function parseQuestionsFromListResponse(json: unknown): EventActivityQuestion[] {
  if (!json || typeof json !== 'object') return [];
  const j = json as Record<string, unknown>;
  if (j.success === false) return [];
  const d = j.data;
  if (Array.isArray(d)) return d as EventActivityQuestion[];
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const o = d as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as EventActivityQuestion[];
    if (Array.isArray(o.questions)) return o.questions as EventActivityQuestion[];
  }
  return [];
}

export interface EditScannableAnswerModalProps {
  open: boolean;
  activityId: number;
  /** Kode bertipe `answer_for_question` untuk di-edit. */
  code: ScannableCode | null;
  questions: EventActivityQuestion[];
  onClose: () => void;
  onSuccess?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

const CODE_KIND = 'answer_for_question' as const;

export function EditScannableAnswerModal({
  open,
  activityId,
  code,
  questions,
  onClose,
  onSuccess,
  onToast,
}: EditScannableAnswerModalProps) {
  const [activityQuestionId, setActivityQuestionId] = useState<string>('');
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(true);
  const [publicToken, setPublicToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [fetchedQuestions, setFetchedQuestions] = useState<
    EventActivityQuestion[]
  >([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const questionList = useMemo(() => {
    const raw = questions.length > 0 ? questions : fetchedQuestions;
    return sortQuestionsByOrder(raw);
  }, [questions, fetchedQuestions]);

  useEffect(() => {
    if (open && code && code.code_kind === CODE_KIND) {
      setPublicToken((code.public_token ?? '').trim());
      setIsCorrectAnswer(Boolean(code.is_correct_answer));
      setActivityQuestionId(
        code.activity_question_id != null &&
          !Number.isNaN(Number(code.activity_question_id))
          ? String(code.activity_question_id)
          : ''
      );
      setFieldErrors({});
    }
  }, [open, activityId, code?.id]);

  useEffect(() => {
    if (!open) {
      setFetchedQuestions([]);
      setQuestionsLoading(false);
      return;
    }
    if (questions.length > 0) {
      setFetchedQuestions([]);
      setQuestionsLoading(false);
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);

    (async () => {
      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }
      try {
        const res = await fetch(
          `/api/admin/event-activities/${activityId}/questions`,
          {
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 401) {
          logoutAdminHard();
          return;
        }
        const text = await res.text();
        const parsed = parseResponseJson(res, text);
        if (!parsed.ok) {
          if (!cancelled) {
            setFetchedQuestions([]);
            onToast?.('error', parsed.message);
          }
          return;
        }
        const list = sortQuestionsByOrder(
          parseQuestionsFromListResponse(parsed.value)
        );
        if (!cancelled) setFetchedQuestions(list);
      } catch {
        if (!cancelled) {
          setFetchedQuestions([]);
          onToast?.('error', 'Tidak dapat memuat daftar pertanyaan.');
        }
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, activityId, questions.length, onToast]);

  if (!open || !code || code.code_kind !== CODE_KIND) return null;

  const err = (k: string) => fieldErrors[k]?.[0];

  function handleClose() {
    if (!saving) onClose();
  }

  function handleRegenerate() {
    const n = Math.floor(100 + Math.random() * 900);
    if (!saving) setPublicToken(`DEMO-ANSWER-OK-${n}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    if (!questionList.length) {
      onToast?.('error', 'Tambah pertanyaan terlebih dahulu.');
      return;
    }
    const qid = activityQuestionId.trim();
    if (!qid || Number.isNaN(Number(qid))) {
      onToast?.('error', 'Pilih pertanyaan yang terkait.');
      return;
    }
    const t = publicToken.trim();
    if (!t) {
      onToast?.('error', 'Public token wajib diisi.');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(t)) {
      onToast?.(
        'error',
        'Token hanya boleh huruf, angka, titik, strip, dan garis bawah.'
      );
      return;
    }

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/event-activities/${activityId}/scannable-codes/${code.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code_kind: CODE_KIND,
            activity_question_id: Number(qid),
            is_correct_answer: isCorrectAnswer,
            public_token: t,
          }),
        }
      );
      const text = await res.text();
      const parsed = parseResponseJson(res, text);
      if (!parsed.ok) {
        onToast?.('error', parsed.message);
        return;
      }
      const json = parsed.value as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (res.status === 401) {
        logoutAdminHard();
        return;
      }
      if (!res.ok || json.success === false) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.('error', json.message ?? 'Gagal memperbarui kode jawaban.');
        return;
      }
      onSuccess?.();
      onClose();
      onToast?.('success', json.message ?? 'Kode jawaban berhasil diperbarui.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='fixed inset-0 z-120 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/40 backdrop-blur-[1px]'
        onClick={handleClose}
      />
      <div className='relative z-10 flex max-h-[min(92vh,700px)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Ubah Answer</h3>
          <button
            type='button'
            disabled={saving}
            onClick={handleClose}
            className='cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4'>
            <div>
              <label
                htmlFor='edit-ans-code-kind'
                className='text-xs font-bold text-gray-600'>
                code_kind
              </label>
              <input
                id='edit-ans-code-kind'
                type='text'
                value={CODE_KIND}
                readOnly
                tabIndex={-1}
                className='mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-700'
              />
            </div>

            <div>
              <label
                id='edit-ans-question-label'
                htmlFor='edit-ans-question'
                className='text-xs font-bold text-gray-600'>
                Pilih Pertanyaan<span className='text-red-500'>*</span>
              </label>
              {questionsLoading && questions.length === 0 ? (
                <div className='mt-1 flex items-center gap-2 text-sm text-gray-600'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-5 w-5 text-rc-red'
                  />
                  Memuat daftar pertanyaan…
                </div>
              ) : questionList.length === 0 ? (
                <p className='mt-1 text-sm text-amber-700'>
                  Belum ada pertanyaan. Tambahkan lewat &quot;Tambah
                  Pertanyaan&quot; terlebih dahulu.
                </p>
              ) : (
                <Select.Root
                  value={activityQuestionId || undefined}
                  onValueChange={setActivityQuestionId}
                  disabled={saving}>
                  <Select.Trigger
                    id='edit-ans-question'
                    aria-labelledby='edit-ans-question-label'
                    className='mt-1 flex h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-rc-red focus:ring-2 focus:ring-rc-red/20 data-disabled:cursor-not-allowed data-disabled:bg-gray-50 data-disabled:opacity-70 [&>span]:min-w-0 [&>span]:truncate'>
                    <Select.Value placeholder='Pilih Pertanyaan' />
                    <Select.Icon className='shrink-0 text-gray-500' aria-hidden>
                      <Icon icon='mdi:chevron-down' className='h-5 w-5' />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className='z-200 max-h-[min(280px,var(--radix-select-content-available-height))] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg'
                      position='popper'
                      sideOffset={6}
                      align='start'
                      style={{ width: 'var(--radix-select-trigger-width)' }}>
                      <Select.Viewport className='p-0.5'>
                        {questionList.map((q) => (
                          <Select.Item
                            key={q.id}
                            value={String(q.id)}
                            className='relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-red-50 data-highlighted:text-red-900 data-[state=checked]:font-semibold data-[state=checked]:text-rc-red'>
                            <Select.ItemText>
                              {q.sort_order}. {q.body?.trim() ?? '—'}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              )}
              {err('activity_question_id') && (
                <p className='mt-1 text-xs text-red-600'>
                  {err('activity_question_id')}
                </p>
              )}
            </div>

            <div className='flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/80 px-4 py-3'>
              <div>
                <span className='text-sm font-bold text-gray-800'>
                  Jawaban (Benar/Salah)
                </span>
                <p className='text-[10px] text-gray-500'>
                  Aktifkan jika jawaban ini adalah jawaban benar.
                </p>
              </div>
              <button
                type='button'
                role='switch'
                aria-checked={isCorrectAnswer}
                disabled={saving}
                onClick={() => setIsCorrectAnswer((v) => !v)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  isCorrectAnswer ? 'bg-rc-red' : 'bg-gray-300'
                } ${saving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isCorrectAnswer ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <div className='flex items-center justify-between gap-2'>
                <label
                  htmlFor='edit-ans-token'
                  className='text-xs font-bold text-gray-600'>
                  public_token<span className='text-red-500'>*</span>
                </label>
                <button
                  type='button'
                  onClick={handleRegenerate}
                  disabled={saving}
                  className='text-[11px] font-bold text-rc-red underline-offset-2 hover:underline disabled:opacity-50'>
                  Acak ulang
                </button>
              </div>
              <input
                id='edit-ans-token'
                type='text'
                value={publicToken}
                onChange={(e) => setPublicToken(e.target.value.toUpperCase())}
                disabled={saving}
                autoComplete='off'
                className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                placeholder='DEMO-ANSWER-OK-011'
              />
              {err('public_token') && (
                <p className='mt-1 text-xs text-red-600'>
                  {err('public_token')}
                </p>
              )}
            </div>
          </div>

          <div className='flex gap-2 border-t border-gray-100 px-5 py-4'>
            <button
              type='button'
              disabled={saving}
              onClick={handleClose}
              className='flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50'>
              Batal
            </button>
            <button
              type='submit'
              disabled={
                saving ||
                questionsLoading ||
                questionList.length === 0 ||
                !activityQuestionId.trim()
              }
              className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b50015] disabled:opacity-60'>
              {saving ? (
                <Icon
                  icon='svg-spinners:ring-resize'
                  className='h-5 w-5 text-white'
                />
              ) : (
                <>
                  <Icon icon='mdi:content-save' className='h-5 w-5' />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
