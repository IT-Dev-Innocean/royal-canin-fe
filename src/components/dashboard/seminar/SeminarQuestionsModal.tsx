'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import type { SeminarQuestionEntry, SeminarSpeaker } from './types';

function formatQuestionTime(iso: string | null | undefined): string {
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

function escapeCsvCell(value: string): string {
  const s = String(value).replace(/\r\n/g, '\n');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function seminarQuestionsToCsv(rows: SeminarQuestionEntry[]): string {
  const header = ['ID', 'Pembicara', 'Pertanyaan', 'Dari', 'Waktu'];
  const lines = [header.map((h) => escapeCsvCell(h)).join(',')];

  for (const q of rows) {
    const waktu =
      q.created_at == null ||
      Number.isNaN(new Date(q.created_at).getTime())
        ? ''
        : formatQuestionTime(q.created_at).replace(/\u2014/g, '-');

    lines.push(
      [
        String(q.id),
        escapeCsvCell(q.speaker?.name ?? ''),
        escapeCsvCell(q.question ?? ''),
        escapeCsvCell(q.user?.name ?? ''),
        escapeCsvCell(waktu === '—' ? '' : waktu),
      ].join(',')
    );
  }

  return `\uFEFF${lines.join('\r\n')}`;
}

function triggerCsvDownload(content: string, filename: string) {
  const blob = new Blob([content], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface SeminarQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  /** ID seminar — dipakai untuk DELETE …/seminars/{id}/questions/{questionId} */
  seminarId: number;
  speakers: SeminarSpeaker[] | undefined;
  questionSpeakerFilter: string;
  onQuestionSpeakerFilterChange: (value: string) => void;
  questions: SeminarQuestionEntry[];
  questionsLoading: boolean;
  questionsError: string | null;
  /** Dipanggil setelah hapus sukses — parent boleh update daftar & refresh ringkasan. */
  onQuestionDeleted?: (questionId: number) => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function SeminarQuestionsModal({
  open,
  onClose,
  seminarId,
  speakers,
  questionSpeakerFilter,
  onQuestionSpeakerFilterChange,
  questions,
  questionsLoading,
  questionsError,
  onQuestionDeleted,
  onToast,
}: SeminarQuestionsModalProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleExportCsv = useCallback(() => {
    if (questionsLoading || questionsError || questions.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(
      seminarQuestionsToCsv(questions),
      `seminar-${seminarId}-pertanyaan-${dateStr}.csv`
    );
    onToast?.(
      'success',
      `CSV berhasil diunduh (${questions.length} pertanyaan).`
    );
  }, [
    questions,
    seminarId,
    questionsLoading,
    questionsError,
    onToast,
  ]);

  const handleDeleteQuestion = useCallback(
    async (q: SeminarQuestionEntry) => {
      if (
        !window.confirm(
          'Hapus pertanyaan ini? Tindakan tidak dapat dibatalkan.'
        )
      ) {
        return;
      }

      const token = getAdminToken();
      if (!token) return;

      setDeletingId(q.id);
      try {
        const res = await fetch(
          `/api/admin/seminars/${seminarId}/questions/${q.id}`,
          {
            method: 'DELETE',
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await res.text();
        let json: { success?: boolean; message?: string } = {};
        if (text.trim()) {
          try {
            json = JSON.parse(text) as typeof json;
          } catch {
            json = {};
          }
        }

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (!res.ok || json.success === false) {
          onToast?.('error', json.message ?? 'Gagal menghapus pertanyaan.');
          return;
        }

        onQuestionDeleted?.(q.id);
        onToast?.('success', json.message ?? 'Pertanyaan berhasil dihapus.');
      } catch {
        onToast?.('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setDeletingId(null);
      }
    },
    [seminarId, onQuestionDeleted, onToast]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const busy = deletingId != null;

  return (
    <div className='fixed inset-0 z-70 flex items-center justify-center p-4'>
      <button
        type='button'
        aria-label='Tutup overlay'
        className='absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm'
        onClick={() => !busy && onClose()}
      />
      <div
        className='relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'
        role='dialog'
        aria-modal='true'
        aria-labelledby='seminar-questions-modal-title'>
        <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5'>
          <h3
            id='seminar-questions-modal-title'
            className='text-base font-bold text-gray-900 sm:text-lg'>
            Daftar pertanyaan
          </h3>
          <div className='flex shrink-0 items-center gap-1'>
            <button
              type='button'
              title='Ekspor daftar pertanyaan yang tampil ke CSV'
              disabled={
                busy ||
                questionsLoading ||
                Boolean(questionsError) ||
                questions.length === 0
              }
              onClick={() => handleExportCsv()}
              className='flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:px-3 sm:text-xs'>
              <Icon
                icon='mdi:file-delimited-outline'
                className='h-4 w-4 shrink-0'
              />
              <span className='hidden sm:inline'>Export CSV</span>
            </button>
            <button
              type='button'
              disabled={busy}
              onClick={onClose}
              className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
              <Icon icon='mdi:close' className='h-5 w-5' />
            </button>
          </div>
        </div>
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5'>
          <label className='flex shrink-0 flex-col gap-1'>
            <span className='text-[10px] font-bold text-gray-500'>
              Filter pembicara
            </span>
            <select
              value={questionSpeakerFilter}
              disabled={busy}
              onChange={(e) => onQuestionSpeakerFilterChange(e.target.value)}
              className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:border-rc-red disabled:opacity-50'>
              <option value=''>Semua pembicara</option>
              {(speakers ?? [])
                .filter(
                  (s): s is SeminarSpeaker & { id: number } =>
                    typeof s.id === 'number'
                )
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <div className='mt-4 min-h-0 flex-1 overflow-hidden'>
            {questionsLoading && (
              <div className='flex justify-center py-10'>
                <Icon
                  icon='svg-spinners:ring-resize'
                  className='h-7 w-7 text-rc-red'
                />
              </div>
            )}
            {!questionsLoading && questionsError && (
              <p className='text-xs text-red-600' role='alert'>
                {questionsError}
              </p>
            )}
            {!questionsLoading && !questionsError && questions.length === 0 && (
              <p className='text-xs text-gray-500'>
                {questionSpeakerFilter
                  ? 'Tidak ada pertanyaan untuk pembicara ini.'
                  : 'Belum ada pertanyaan.'}
              </p>
            )}
            {!questionsLoading && !questionsError && questions.length > 0 && (
              <ul className='max-h-[min(52vh,480px)] space-y-2 overflow-y-auto pr-1'>
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className='rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 shadow-sm'>
                    <p className='text-[11px] font-bold tracking-wider text-gray-400'>
                      {q.speaker?.name ?? 'Pembicara'}
                    </p>
                    <p className='mt-1 text-xs whitespace-pre-wrap text-gray-900 sm:text-sm'>
                      {q.question}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100/80 pt-2'>
                      <div className='flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500'>
                        {q.user?.name && (
                          <span>
                            Dari:{' '}
                            <span className='font-medium'>{q.user.name}</span>
                          </span>
                        )}
                        <span>{formatQuestionTime(q.created_at)}</span>
                      </div>
                      <button
                        type='button'
                        disabled={busy}
                        onClick={() => void handleDeleteQuestion(q)}
                        className='inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'>
                        {deletingId === q.id ? (
                          <Icon
                            icon='svg-spinners:ring-resize'
                            className='h-3.5 w-3.5'
                          />
                        ) : (
                          <Icon
                            icon='mdi:delete-outline'
                            className='h-3.5 w-3.5'
                          />
                        )}
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
