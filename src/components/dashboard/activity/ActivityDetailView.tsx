'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import { nameToActivityCode } from './EventActivityFormCard';
import { AddQuestion } from './AddQuestion';
import { EditQuestion } from './EditQuestion';
import { AddAnswerModal } from './AddAnswerModal';
import { AddQRUsherModal } from './AddQRUsherModal';
import { EditQRUsherModal } from './EditQRUsherModal';
import { AddStartSessionModal } from './AddStartSessionModal';
import { EditScannableAnswerModal } from './EditScannableAnswerModal';
import { EditScannableStartSessionModal } from './EditScannableStartSessionModal';
import { ScannableCodeCard } from './ScannableCodeCard';
import type {
  EventActivityQuestion,
  EventActivityRow,
  ScannableCode,
} from './types';

function sortQuestionsByOrder(
  list: EventActivityRow['questions']
): NonNullable<EventActivityRow['questions']> {
  if (!list?.length) return [];
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function sortCodes(
  list: EventActivityRow['scannable_codes']
): NonNullable<EventActivityRow['scannable_codes']> {
  if (!list?.length) return [];
  return [...list].sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (so !== 0) return so;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function formatDt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface ActivityDetailViewProps {
  data: EventActivityRow | null;
  loading: boolean;
  error: string | null;
  /** Setelah soal berhasil ditambah (refresh list dari API). */
  onRefreshDetail?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function ActivityDetailView({
  data,
  loading,
  error,
  onRefreshDetail,
  onToast,
}: ActivityDetailViewProps) {
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<EventActivityQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(
    null
  );
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addAnswerOpen, setAddAnswerOpen] = useState(false);
  const [addQRUsherOpen, setAddQRUsherOpen] = useState(false);
  const [editingScannable, setEditingScannable] =
    useState<ScannableCode | null>(null);
  const [deletingScannableId, setDeletingScannableId] = useState<number | null>(
    null
  );

  const flowType = (data?.flow_type?.trim() ?? '').toLowerCase();
  const isUsherReward = flowType === 'usher_reward';
  const isSystemQa = flowType === 'system_qa';
  const showQuestionsSection = !isUsherReward;

  const questionsSorted = useMemo(() => {
    if (!data || !showQuestionsSection) return [];
    return sortQuestionsByOrder(data.questions);
  }, [data, showQuestionsSection]);

  const scannableCodes = useMemo(() => {
    if (!data) return [];
    return sortCodes(data.scannable_codes);
  }, [data]);

  const handleDeleteQuestion = useCallback(
    async (q: EventActivityQuestion) => {
      if (!data) return;

      if (
        !window.confirm(
          'Yakin ingin menghapus pertanyaan ini? Tindakan tidak dapat dibatalkan.'
        )
      ) {
        return;
      }

      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }

      setDeletingQuestionId(q.id);
      try {
        const res = await fetch(
          `/api/admin/event-activities/${data.id}/questions/${q.id}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
        };

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (!res.ok || json.success === false) {
          onToast?.('error', json.message ?? 'Gagal menghapus pertanyaan.');
          return;
        }

        onRefreshDetail?.();
        onToast?.('success', json.message ?? 'Pertanyaan berhasil dihapus.');
      } catch {
        onToast?.('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setDeletingQuestionId(null);
      }
    },
    [data, onRefreshDetail, onToast]
  );

  const handleDeleteScannable = useCallback(
    async (code: ScannableCode) => {
      if (!data) return;

      if (
        !window.confirm(
          'Yakin ingin menghapus kode QR ini? Token dan gambar terkait akan dihapus. Tindakan tidak dapat dibatalkan.'
        )
      ) {
        return;
      }

      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }

      setDeletingScannableId(code.id);
      try {
        const res = await fetch(
          `/api/admin/event-activities/${data.id}/scannable-codes/${code.id}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
        };

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (!res.ok || json.success === false) {
          onToast?.('error', json.message ?? 'Gagal menghapus kode.');
          return;
        }

        setEditingScannable((cur) =>
          cur?.id === code.id ? null : cur
        );
        onRefreshDetail?.();
        onToast?.('success', json.message ?? 'Kode berhasil dihapus.');
      } catch {
        onToast?.('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setDeletingScannableId(null);
      }
    },
    [data, onRefreshDetail, onToast]
  );

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Icon icon='svg-spinners:ring-resize' className='h-8 w-8 text-rc-red' />
      </div>
    );
  }

  if (error) {
    return <p className='text-sm text-red-600'>{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap gap-2'>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold ${
            data.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
          {data.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Nama
          </p>
          <p className='mt-1 text-sm font-semibold text-gray-900'>
            {data.name ?? '—'}
          </p>
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Kode
          </p>
          <p className='mt-1 font-mono text-sm text-gray-800'>
            {data.code?.trim() ||
              (data.name ? nameToActivityCode(data.name) : '') ||
              '—'}
          </p>
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Tipe Aktivitas
          </p>
          <p className='mt-1 text-sm text-gray-800'>{data.flow_type || '—'}</p>
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Soal per sesi
          </p>
          <p className='mt-1 text-sm tabular-nums text-gray-800'>
            {data.questions_per_session != null
              ? data.questions_per_session
              : '—'}
          </p>
        </div>
      </div>

      {data.order != null && (
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Urutan
          </p>
          <p className='mt-1 text-sm tabular-nums text-gray-800'>
            {data.order}
          </p>
        </div>
      )}

      <div>
        <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
          Deskripsi
        </p>
        <p className='mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800'>
          {data.description?.trim() ? data.description : '—'}
        </p>
      </div>

      <div>
        <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
          Reward poin (default)
        </p>
        <p className='mt-1 text-sm font-bold text-emerald-700'>
          {data.default_reward_points != null
            ? `${data.default_reward_points} poin`
            : '—'}
        </p>
      </div>

      {showQuestionsSection && (
        <div className='border-t-2 border-gray-100 pt-6'>
          <div className='mb-0 flex items-start justify-between gap-2'>
            <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
              Pertanyaan
            </p>
            <button
              type='button'
              onClick={() => setAddQuestionOpen(true)}
              className='-mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rc-red shadow-sm transition hover:border-rc-red/50 hover:bg-red-50 sm:text-xs'>
              <Icon icon='mdi:plus' className='h-3.5 w-3.5' />
              Tambah Pertanyaan
            </button>
          </div>
          {questionsSorted.length === 0 ? (
            <p className='mt-2 text-sm text-gray-500'>Belum ada pertanyaan.</p>
          ) : (
            <ol className='mt-2 list-none space-y-3'>
              {questionsSorted.map((q, index) => (
                <li
                  key={q.id}
                  className='rounded-xl border border-gray-100 bg-gray-50/80 p-4'>
                  <div className='flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-2'>
                    <span className='inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-rc-red/10 px-1.5 text-xs font-bold text-rc-red tabular-nums'>
                      {index + 1}
                    </span>
                    <div className='flex max-w-[calc(100%-2rem)] flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2'>
                      <button
                        type='button'
                        onClick={() => setEditingQuestion(q)}
                        disabled={deletingQuestionId === q.id}
                        className='inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-rc-red shadow-sm transition hover:border-rc-red/50 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1 sm:text-[11px]'>
                        <Icon
                          icon='mdi:pencil-outline'
                          className='h-3 w-3 sm:h-3.5 sm:w-3.5'
                        />
                        Ubah
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleDeleteQuestion(q)}
                        disabled={deletingQuestionId === q.id}
                        className='inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1 sm:text-[11px]'>
                        {deletingQuestionId === q.id ? (
                          <Icon
                            icon='svg-spinners:ring-resize'
                            className='h-3 w-3 sm:h-3.5 sm:w-3.5'
                          />
                        ) : (
                          <Icon
                            icon='mdi:delete-outline'
                            className='h-3 w-3 sm:h-3.5 sm:w-3.5'
                          />
                        )}
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className='flex gap-2 px-0 mt-3 mb-0'>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        q.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                      {q.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {q.reward_points != null ? (
                      <span className='inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800'>
                        {q.reward_points} poin
                      </span>
                    ) : (
                      <span className='text-[10px] text-gray-400'>Poin: —</span>
                    )}
                  </div>
                  <p className='mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800'>
                    {q.body?.trim() ? q.body : '—'}
                  </p>
                  <p className='mt-2 text-[10px] text-gray-400'>
                    Urutan tampil: {q.sort_order} · ID: {q.id}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {showQuestionsSection && (
        <AddQuestion
          key={`add-q-${data.id}`}
          open={addQuestionOpen}
          activityId={data.id}
          onClose={() => setAddQuestionOpen(false)}
          onSuccess={() => onRefreshDetail?.()}
          onToast={onToast}
        />
      )}

      {showQuestionsSection && (
        <EditQuestion
          key={`edit-q-${data.id}-${editingQuestion?.id ?? 'closed'}`}
          open={editingQuestion !== null}
          activityId={data.id}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => onRefreshDetail?.()}
          onToast={onToast}
        />
      )}

      {(isUsherReward || isSystemQa) && (
        <div className='border-t-2 border-gray-100 pt-6'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
              Scannable Codes
            </p>
            {(isSystemQa || isUsherReward) && (
              <div className='flex flex-wrap items-center justify-end gap-2'>
                {isSystemQa && (
                  <>
                    <button
                      type='button'
                      onClick={() => setAddSessionOpen(true)}
                      className='-mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rc-red shadow-sm transition hover:border-rc-red/50 hover:bg-red-50 sm:text-xs'>
                      <Icon icon='mdi:plus' className='h-3.5 w-3.5' />
                      Add Session
                    </button>
                    <button
                      type='button'
                      onClick={() => setAddAnswerOpen(true)}
                      className='-mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rc-red shadow-sm transition hover:border-rc-red/50 hover:bg-red-50 sm:text-xs'>
                      <Icon icon='mdi:plus' className='h-3.5 w-3.5' />
                      Add Answer
                    </button>
                  </>
                )}
                {isUsherReward && (
                  <button
                    type='button'
                    onClick={() => setAddQRUsherOpen(true)}
                    className='-mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rc-red shadow-sm transition hover:border-rc-red/50 hover:bg-red-50 sm:text-xs'>
                    <Icon icon='mdi:plus' className='h-3.5 w-3.5' />
                    Add QR Code
                  </button>
                )}
              </div>
            )}
          </div>
          {scannableCodes.length === 0 ? (
            <p className='mt-2 text-sm text-gray-500'>
              {isSystemQa
                ? 'Belum ada kode scannable. Gunakan Add Session atau Add Answer.'
                : isUsherReward
                  ? 'Belum ada kode scannable. Gunakan Add QR Code.'
                  : 'Belum ada kode scannable.'}
            </p>
          ) : (
            <ul className='mt-2 grid gap-3 sm:grid-cols-2'>
              {scannableCodes.map((c) => {
                const variantCard = isUsherReward ? 'usher_reward' : 'system_qa';
                const canEditCard =
                  (isUsherReward && c.code_kind === 'usher_reward') ||
                  (isSystemQa &&
                    (c.code_kind === 'answer_for_question' ||
                      c.code_kind === 'start_session'));

                return (
                  <ScannableCodeCard
                    key={c.id}
                    code={c}
                    variant={variantCard}
                    onEdit={
                      canEditCard
                        ? () => setEditingScannable(c)
                        : undefined
                    }
                    onDelete={() => void handleDeleteScannable(c)}
                    deleting={deletingScannableId === c.id}
                  />
                );
              })}
            </ul>
          )}

          {isSystemQa && (
            <>
              <AddStartSessionModal
                key={`add-ss-${data.id}`}
                open={addSessionOpen}
                activityId={data.id}
                onClose={() => setAddSessionOpen(false)}
                onSuccess={() => onRefreshDetail?.()}
                onToast={onToast}
              />
              <AddAnswerModal
                key={`add-ans-${data.id}`}
                open={addAnswerOpen}
                activityId={data.id}
                questions={questionsSorted}
                onClose={() => setAddAnswerOpen(false)}
                onSuccess={() => onRefreshDetail?.()}
                onToast={onToast}
              />
            </>
          )}

          {isUsherReward && (
            <AddQRUsherModal
              key={`add-usher-${data.id}`}
              open={addQRUsherOpen}
              activityId={data.id}
              defaultRewardPoints={data.default_reward_points}
              onClose={() => setAddQRUsherOpen(false)}
              onSuccess={() => onRefreshDetail?.()}
              onToast={onToast}
            />
          )}

          {isSystemQa && (
            <EditScannableAnswerModal
              key={`edit-ans-${data.id}-${editingScannable?.id ?? 'x'}`}
              open={
                editingScannable !== null &&
                editingScannable.code_kind === 'answer_for_question'
              }
              activityId={data.id}
              code={
                editingScannable?.code_kind === 'answer_for_question'
                  ? editingScannable
                  : null
              }
              questions={questionsSorted}
              onClose={() => setEditingScannable(null)}
              onSuccess={() => onRefreshDetail?.()}
              onToast={onToast}
            />
          )}

          {isSystemQa && (
            <EditScannableStartSessionModal
              key={`edit-ss-${data.id}-${editingScannable?.id ?? 'x'}`}
              open={
                editingScannable !== null &&
                editingScannable.code_kind === 'start_session'
              }
              activityId={data.id}
              code={
                editingScannable?.code_kind === 'start_session'
                  ? editingScannable
                  : null
              }
              onClose={() => setEditingScannable(null)}
              onSuccess={() => onRefreshDetail?.()}
              onToast={onToast}
            />
          )}

          {isUsherReward && (
            <EditQRUsherModal
              key={`edit-usher-${data.id}-${editingScannable?.id ?? 'x'}`}
              open={
                editingScannable !== null &&
                editingScannable.code_kind === 'usher_reward'
              }
              activityId={data.id}
              code={
                editingScannable?.code_kind === 'usher_reward'
                  ? editingScannable
                  : null
              }
              defaultRewardPoints={data.default_reward_points}
              onClose={() => setEditingScannable(null)}
              onSuccess={() => onRefreshDetail?.()}
              onToast={onToast}
            />
          )}
        </div>
      )}

      <div className='grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2'>
        <div>
          <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
            Dibuat
          </p>
          <p className='mt-0.5 text-xs text-gray-600'>
            {formatDt(data.created_at)}
          </p>
        </div>
        <div>
          <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
            Diperbarui
          </p>
          <p className='mt-0.5 text-xs text-gray-600'>
            {formatDt(data.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
