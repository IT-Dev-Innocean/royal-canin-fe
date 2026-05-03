'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';

interface EligibleParticipant {
  id: number;
  name: string;
  email?: string;
  detail?: {
    phone?: string;
    clinic_name?: string;
    points?: number;
  };
}

interface DoorPrizeWinner {
  id: number;
  user_id: number;
  min_points?: number;
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    detail?: {
      clinic_name?: string;
      points?: number;
    };
  };
}

interface PaginationData<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}

interface EligiblePaginationData extends PaginationData<EligibleParticipant> {
  min_points?: number;
  min_points_config_default?: number;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

type RaffleStatus = 'idle' | 'rolling' | 'submitting' | 'done' | 'error';

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function winnerName(winner: DoorPrizeWinner): string {
  return winner.user?.name ?? `User #${winner.user_id}`;
}

function winnerClinic(winner: DoorPrizeWinner): string {
  return winner.user?.detail?.clinic_name?.trim() || '-';
}

function winnerPoints(winner: DoorPrizeWinner): string {
  const points = winner.user?.detail?.points;
  return points == null ? '-' : points.toLocaleString('id-ID');
}

export default function DoorprizePage() {
  const [eligibleParticipants, setEligibleParticipants] = useState<
    EligibleParticipant[]
  >([]);
  const [eligibleMeta, setEligibleMeta] =
    useState<EligiblePaginationData | null>(null);
  const [winners, setWinners] = useState<DoorPrizeWinner[]>([]);
  const [winnerMeta, setWinnerMeta] =
    useState<PaginationData<DoorPrizeWinner> | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [raffleOpen, setRaffleOpen] = useState(false);
  const [raffleStatus, setRaffleStatus] = useState<RaffleStatus>('idle');
  const [rollingName, setRollingName] = useState('Siap mengacak peserta');
  const [selectedParticipant, setSelectedParticipant] =
    useState<EligibleParticipant | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ type, message });
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    },
    []
  );

  const fetchAllEligibleParticipants = useCallback(async (token: string) => {
    const rows: EligibleParticipant[] = [];
    let meta: EligiblePaginationData | null = null;

    for (let page = 1; ; page++) {
      const res = await fetch(
        `/api/admin/door-prize/eligible-participants?page=${page}&per_page=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        logoutAdminHard();
        return null;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Gagal mengambil pool doorprize.');
      }

      const data = json.data as EligiblePaginationData;
      rows.push(...data.data);
      meta = data;

      if (page >= data.last_page) break;
    }

    return { rows, meta };
  }, []);

  const fetchAllWinners = useCallback(async (token: string) => {
    const rows: DoorPrizeWinner[] = [];
    let meta: PaginationData<DoorPrizeWinner> | null = null;

    for (let page = 1; ; page++) {
      const res = await fetch(
        `/api/admin/door-prize/winners?page=${page}&per_page=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        logoutAdminHard();
        return null;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Gagal mengambil daftar pemenang.');
      }

      const data = json.data as PaginationData<DoorPrizeWinner>;
      rows.push(...data.data);
      meta = data;

      if (page >= data.last_page) break;
    }

    return { rows, meta };
  }, []);

  const fetchDoorprizeData = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setLoading(true);
    try {
      const [eligibleResult, winnerResult] = await Promise.all([
        fetchAllEligibleParticipants(token),
        fetchAllWinners(token),
      ]);

      if (eligibleResult) {
        setEligibleParticipants(eligibleResult.rows);
        setEligibleMeta(eligibleResult.meta);
      }
      if (winnerResult) {
        setWinners(winnerResult.rows);
        setWinnerMeta(winnerResult.meta);
      }
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Tidak dapat memuat data doorprize.'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchAllEligibleParticipants, fetchAllWinners, showToast]);

  useEffect(() => {
    fetchDoorprizeData();
  }, [fetchDoorprizeData]);

  async function handleRunDoorprize() {
    if (eligibleParticipants.length === 0 || running) return;

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setRunning(true);
    setRaffleOpen(true);
    setRaffleStatus('rolling');
    setSelectedParticipant(null);

    let interval: ReturnType<typeof setInterval> | null = null;
    try {
      interval = setInterval(() => {
        const next =
          eligibleParticipants[
            Math.floor(Math.random() * eligibleParticipants.length)
          ];
        setRollingName(next.name);
      }, 75);

      await new Promise((resolve) => setTimeout(resolve, 3500));
      if (interval) clearInterval(interval);

      const winner =
        eligibleParticipants[
          Math.floor(Math.random() * eligibleParticipants.length)
        ];
      setRollingName(winner.name);
      setSelectedParticipant(winner);
      setRaffleStatus('submitting');

      const body: { user_id: number; min_points?: number } = {
        user_id: winner.id,
      };
      if (eligibleMeta?.min_points != null) {
        body.min_points = eligibleMeta.min_points;
      }

      const res = await fetch('/api/admin/door-prize/winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Gagal menandai pemenang.');
      }

      setRaffleStatus('done');
      showToast(
        'success',
        `${winner.name} berhasil ditandai sebagai pemenang.`
      );
      await fetchDoorprizeData();
    } catch (error) {
      if (interval) clearInterval(interval);
      setRaffleStatus('error');
      showToast(
        'error',
        error instanceof Error ? error.message : 'Doorprize gagal dijalankan.'
      );
    } finally {
      setRunning(false);
    }
  }

  async function handleDeleteWinner(winner: DoorPrizeWinner) {
    const ok = window.confirm(
      `Hapus ${winnerName(winner)} dari daftar pemenang doorprize?`
    );
    if (!ok) return;

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setDeletingId(winner.id);
    try {
      const res = await fetch(`/api/admin/door-prize/winners/${winner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Gagal menghapus pemenang.');
      }

      showToast('success', `${winnerName(winner)} dihapus dari pemenang.`);
      await fetchDoorprizeData();
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : 'Gagal menghapus pemenang.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const minPoints =
    eligibleMeta?.min_points ?? eligibleMeta?.min_points_config_default ?? 100;

  return (
    <div className='mx-auto max-w-2xl space-y-5 lg:max-w-6xl'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Doorprize</h2>
          <p className='text-sm text-gray-500'>
            Pool eligible dari peserta check-in dengan minimal{' '}
            {minPoints.toLocaleString('id-ID')} poin.
          </p>
        </div>
        <button
          type='button'
          disabled={loading || running || eligibleParticipants.length === 0}
          onClick={handleRunDoorprize}
          className='flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50'>
          {running ? (
            <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
          ) : (
            <Icon icon='mdi:gift-open-outline' className='h-5 w-5' />
          )}
          Run Doorprize
        </button>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Pool Eligible
          </p>
          <p className='mt-2 text-2xl font-black text-gray-900'>
            {loading
              ? '...'
              : eligibleParticipants.length.toLocaleString('id-ID')}
          </p>
        </div>
        <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Total Pemenang
          </p>
          <p className='mt-2 text-2xl font-black text-gray-900'>
            {loading ? '...' : (winnerMeta?.total ?? winners.length)}
          </p>
        </div>
        <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Minimum Poin
          </p>
          <p className='mt-2 text-2xl font-black text-gray-900'>
            {minPoints.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <section className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3'>
          <div>
            <h3 className='font-bold text-gray-900'>Pool Eligible</h3>
            <p className='text-xs text-gray-500'>
              Data peserta yang siap diacak.
            </p>
          </div>
          <button
            type='button'
            onClick={fetchDoorprizeData}
            disabled={loading || running}
            className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'>
            Refresh
          </button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-rc-red'>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  #
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  Nama
                </th>
                <th className='hidden whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white sm:table-cell'>
                  Klinik
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  Poin
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr>
                  <td colSpan={4} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : eligibleParticipants.length > 0 ? (
                eligibleParticipants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-gray-400 tabular-nums'>
                      {index + 1}
                    </td>
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-800'>
                        {participant.name}
                      </p>
                      <p className='text-xs text-gray-400 md:hidden'>
                        {participant.detail?.clinic_name ?? '-'}
                      </p>
                    </td>
                    <td className='hidden px-4 py-3 text-gray-500 sm:table-cell'>
                      {participant.detail?.clinic_name ?? '-'}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700'>
                        <Icon icon='mdi:star-four-points' className='h-3 w-3' />
                        {participant.detail?.points?.toLocaleString('id-ID') ??
                          '-'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada peserta yang eligible untuk doorprize.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='border-b border-gray-100 px-4 py-3'>
          <h3 className='font-bold text-gray-900'>Daftar Pemenang</h3>
          <p className='text-xs text-gray-500'>
            Pemenang yang sudah ditandai di backend.
          </p>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-rc-red'>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  #
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  Nama
                </th>
                <th className='hidden whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white sm:table-cell'>
                  Klinik
                </th>
                <th className='hidden whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white md:table-cell'>
                  Poin
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-white'>
                  Waktu
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : winners.length > 0 ? (
                winners.map((winner, index) => (
                  <tr
                    key={winner.id}
                    className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-gray-400 tabular-nums'>
                      {index + 1}
                    </td>
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-800'>
                        {winnerName(winner)}
                      </p>
                      <p className='text-xs text-gray-400 sm:hidden'>
                        {winnerClinic(winner)}
                      </p>
                    </td>
                    <td className='hidden px-4 py-3 text-gray-500 sm:table-cell'>
                      {winnerClinic(winner)}
                    </td>
                    <td className='hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell'>
                      {winnerPoints(winner)}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-gray-500'>
                      {formatDate(winner.created_at)}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-center'>
                      <button
                        type='button'
                        disabled={deletingId === winner.id}
                        onClick={() => handleDeleteWinner(winner)}
                        className='inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'>
                        {deletingId === winner.id ? (
                          <Icon
                            icon='svg-spinners:ring-resize'
                            className='h-3.5 w-3.5'
                          />
                        ) : (
                          <Icon
                            icon='mdi:trash-can-outline'
                            className='h-3.5 w-3.5'
                          />
                        )}
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada pemenang doorprize.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {raffleOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={() => {
              if (!running) setRaffleOpen(false);
            }}
          />
          <div className='relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl'>
            <div className='bg-rc-red px-6 py-5 text-white'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-[0.25em] text-white/70'>
                    Royal Canin
                  </p>
                  <h3 className='mt-1 text-2xl font-black'>
                    Doorprize Vet Symposium 2026
                  </h3>
                </div>
                <button
                  type='button'
                  disabled={running}
                  onClick={() => setRaffleOpen(false)}
                  className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40'>
                  <Icon icon='mdi:close' className='h-5 w-5' />
                </button>
              </div>
            </div>

            <div className='p-6 text-center'>
              <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rc-red/10'>
                {raffleStatus === 'rolling' ? (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-rc-red'
                  />
                ) : (
                  <Icon
                    icon='mdi:trophy-award'
                    className='h-10 w-10 text-rc-red'
                  />
                )}
              </div>

              <p className='mt-6 text-xs font-bold uppercase tracking-[0.2em] text-gray-400'>
                {raffleStatus === 'rolling'
                  ? 'Sedang mengacak...'
                  : raffleStatus === 'submitting'
                    ? 'Mengirim pemenang...'
                    : raffleStatus === 'done'
                      ? 'Pemenang terpilih'
                      : raffleStatus === 'error'
                        ? 'Gagal memproses'
                        : 'Siap'}
              </p>
              <div className='mt-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-8'>
                <p className='wrap-break-word text-3xl font-black leading-tight text-gray-900 sm:text-4xl'>
                  {rollingName}
                </p>
                {selectedParticipant && (
                  <p className='mt-3 text-sm font-medium text-gray-500'>
                    {selectedParticipant.detail?.clinic_name ?? '-'} ·{' '}
                    {selectedParticipant.detail?.points?.toLocaleString(
                      'id-ID'
                    ) ?? '-'}{' '}
                    poin
                  </p>
                )}
              </div>

              <div className='mt-6 flex justify-center'>
                <button
                  type='button'
                  disabled={running}
                  onClick={() => setRaffleOpen(false)}
                  className='rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-50'>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className='fixed right-6 bottom-6 z-60 animate-[slideUp_0.3s_ease-out]'>
          <div
            className={`flex max-w-sm min-w-[280px] items-start gap-3 rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                : 'border-red-200 bg-red-50/95 text-red-800'
            }`}>
            <Icon
              icon={
                toast.type === 'success'
                  ? 'mdi:check-circle'
                  : 'mdi:alert-circle'
              }
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                toast.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
            <p className='text-sm font-medium leading-snug'>{toast.message}</p>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='mt-0.5 ml-1 shrink-0 cursor-pointer text-gray-400 hover:text-gray-600'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
