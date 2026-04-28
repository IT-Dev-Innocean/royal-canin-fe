'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getToken, logoutParticipantHard } from '@/lib/auth';

interface ProfileDetail {
  phone: string;
  clinic_name: string;
  outlet_number: number | null;
  social_media_account: string;
  rc_club: boolean;
  pet: string;
  scrub_size: string;
  points: number;
}

interface ProfileQrCode {
  code: string;
  image_path: string;
  is_active: boolean;
}

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  detail: ProfileDetail;
  qr_code: ProfileQrCode | null;
  check_in: unknown;
}

interface EditForm {
  name: string;
  phone: string;
  clinic_name: string;
  outlet_number: string;
  social_media_account: string;
  rc_club: boolean;
  pet: string;
  scrub_size: string;
}

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

/** Poll GET /api/me saat check_in masih null; modal sukses hanya setelah polling mendeteksi check-in. */
const POLL_INTERVAL_MS = 3000;

const SCRUB_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const PET_OPTIONS = [
  { value: 'cat', label: 'Kucing' },
  { value: 'dog', label: 'Anjing' },
  { value: 'both', label: 'Kucing & Anjing' },
];

export default function UserInfoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    phone: '',
    clinic_name: '',
    outlet_number: '',
    social_media_account: '',
    rc_club: false,
    pet: '',
    scrub_size: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [showCheckInSuccessModal, setShowCheckInSuccessModal] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasCheckIn = profile?.check_in != null;

  const fetchProfile = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      const token = getToken();
      if (!token) {
        if (!silent) router.replace('/login');
        return null;
      }

      try {
        const res = await fetch('/api/me', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          if (res.status === 401) {
            logoutParticipantHard();
            return null;
          }
          if (!silent) setError(json.message ?? 'Gagal memuat profil.');
          return null;
        }

        setProfile(json.data);
        return json.data as ProfileData;
      } catch {
        if (!silent) setError('Tidak dapat terhubung ke server.');
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [router]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const updated = await fetchProfile({ silent: true });
      if (updated && updated.check_in !== null) {
        stopPolling();
        setShowCheckInSuccessModal(true);
      }
    }, POLL_INTERVAL_MS);
  }, [fetchProfile, stopPolling]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  /** Sama seperti home event: poll /me jika belum check-in; henti saat check_in ada. */
  useEffect(() => {
    if (loading || !profile) return;
    if (hasCheckIn) {
      stopPolling();
      return;
    }
    startPolling();
    return () => stopPolling();
  }, [loading, profile?.id, hasCheckIn, startPolling, stopPolling]);

  function openEditModal() {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      phone: profile.detail.phone,
      clinic_name: profile.detail.clinic_name ?? '',
      outlet_number: profile.detail.outlet_number?.toString() ?? '',
      social_media_account: profile.detail.social_media_account ?? '',
      rc_club: profile.detail.rc_club ?? false,
      pet: profile.detail.pet ?? '',
      scrub_size: profile.detail.scrub_size ?? '',
    });
    setIsEditing(false);
    setShowEditModal(true);
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSaveProfile() {
    const token = getToken();
    if (!token) return;

    setSaving(true);

    const payload: Record<string, unknown> = {
      name: editForm.name,
      phone: editForm.phone,
      clinic_name: editForm.clinic_name,
      social_media_account: editForm.social_media_account,
      rc_club: editForm.rc_club,
      pet: editForm.pet,
      scrub_size: editForm.scrub_size,
    };

    if (editForm.outlet_number.trim() !== '') {
      payload.outlet_number = parseInt(editForm.outlet_number, 10);
    }

    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        showToast('error', json.message ?? 'Gagal memperbarui profil.');
        return;
      }

      await fetchProfile();

      setShowEditModal(false);
      setIsEditing(false);
      showToast('success', json.message ?? 'Profil berhasil diperbarui.');
    } catch {
      showToast('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logoutParticipantHard();
  }

  function dismissCheckInSuccessModal() {
    setShowCheckInSuccessModal(false);
  }

  if (loading) {
    return (
      <main className='flex items-center justify-center min-h-screen'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-rc-red border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Memuat profil...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className='flex items-center justify-center min-h-screen p-6'>
        <div className='text-center space-y-4'>
          <p className='text-sm text-red-500 font-medium'>
            {error ?? 'Data profil tidak ditemukan.'}
          </p>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='px-6 py-2.5 bg-rc-red text-white text-sm rounded-xl font-bold'>
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  const { name, email, detail, qr_code } = profile;

  const hasCheckedIn = profile.check_in !== null;

  return (
    <main className='relative flex flex-col items-center p-6 min-h-screen text-black overflow-hidden'>
      {!hasCheckedIn && (
        <div className='mt-0 mb-8 w-full max-w-lg flex flex-col items-center relative z-10'>
          <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-4'>
            Pindai QR saat Registrasi
          </p>

          <div className='relative bg-white p-4 rounded-3xl border-2 border-red-50'>
            <div className='absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-rc-red rounded-tl-3xl -translate-x-1 -translate-y-1'></div>
            <div className='absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-rc-red rounded-tr-3xl translate-x-1 -translate-y-1'></div>
            <div className='absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-rc-red rounded-bl-3xl -translate-x-1 translate-y-1'></div>
            <div className='absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-rc-red rounded-br-3xl translate-x-1 translate-y-1'></div>

            {qr_code?.image_path ? (
              <img
                src={`${QR_STORAGE_BASE}${qr_code.image_path}`}
                alt={`QR Code ${qr_code.code}`}
                className='w-40 h-40 rounded-2xl object-contain'
              />
            ) : (
              <div className='w-40 h-40 bg-gray-50 flex items-center justify-center rounded-2xl border border-dashed border-gray-200'>
                <span className='text-xs text-gray-400 font-mono tracking-widest'>
                  [QR CODE]
                </span>
              </div>
            )}
          </div>

          <p className='mt-5 text-sm text-gray-500 font-medium text-center max-w-[280px] leading-relaxed'>
            Scan QR Code di lokasi acara untuk bergabung di acara Vet Symposium
            2026.
          </p>
        </div>
      )}

      {hasCheckedIn && (
        <div className='mt-0 mb-8 pb-8 w-full max-w-lg flex flex-col items-center relative z-10'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-rc-red/10'>
            <Icon icon='mdi:check-circle' className='h-12 w-12 text-rc-red' />
          </div>
          <h3 className='mt-3 text-base font-extrabold text-gray-900'>
            Check-in Berhasil
          </h3>
          <p className='mt-1 text-sm text-gray-500 text-center'>
            Anda sudah terdaftar hadir di acara ini.
          </p>
        </div>
      )}

      <div
        className={`w-full max-w-lg relative z-10 ${hasCheckedIn ? 'mt-0' : 'mt-8'}`}>
        <div className='absolute -top-6 inset-x-6 bg-linear-to-br from-[#d4001a] to-[#8b0012] rounded-2xl p-4 text-white shadow-lg shadow-red-200 z-20 flex justify-between items-center'>
          <div>
            <p className='text-xs font-medium opacity-80 uppercase tracking-wider mb-0.5'>
              Total Skor Anda
            </p>
            <p className='text-2xl font-black tracking-tight leading-none'>
              {(detail.points ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className='w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center'>
            <svg
              className='w-5 h-5 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        </div>

        <div className='bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-5 md:p-7 pt-16 md:pt-20 w-full relative z-10'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='qlementine-icons:user-24'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  Nama Peserta
                </p>
                <p className='font-bold text-xs md:text-sm leading-snug text-rc-red'>
                  {name}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='mage:email'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  Email
                </p>
                <p className='text-xs md:text-sm font-semibold text-gray-800'>
                  {email}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='fluent:phone-person-24-regular'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  No. Telepon
                </p>
                <p className='text-xs md:text-sm font-semibold text-gray-800'>
                  {detail.phone}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='fa7-regular:hospital'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400 mb-0.5'>
                  Klinik
                </p>
                <p className='text-xs md:text-sm font-bold text-gray-800 line-clamp-1'>
                  {detail.clinic_name || '-'}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='hugeicons:identity-card'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400 mb-0.5'>
                  NIO
                </p>
                <p className='text-xs md:text-sm font-bold text-gray-800'>
                  {detail.outlet_number ?? '-'}
                </p>
              </div>
            </div>

            <div className='w-full max-w-lg'>
              <button
                type='button'
                onClick={openEditModal}
                className='cursor-pointer flex items-center justify-center gap-2 w-full py-3 bg-white text-rc-red text-center text-sm rounded-2xl font-bold border-2 border-rc-red shadow-sm transition-all duration-300 ease-out hover:bg-red-50 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-[0.98]'>
                Lihat Profil Selengkapnya
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full max-w-lg mt-auto pt-10 pb-6 space-y-3 relative z-10'>
        <button
          type='button'
          onClick={handleLogout}
          className='block w-full py-4 bg-rc-red text-white text-center rounded-2xl font-bold shadow-lg shadow-red-200 transition-all duration-300 ease-out hover:bg-rc-red/80 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]'>
          Keluar
        </button>
      </div>

      {showCheckInSuccessModal && profile && (
        <div className='fixed inset-0 z-60 flex items-center justify-center p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={dismissCheckInSuccessModal}
          />

          <div className='relative z-10 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white px-6 py-8 shadow-2xl'>
            <button
              type='button'
              onClick={dismissCheckInSuccessModal}
              className='absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200'>
              <Icon icon='mdi:close' className='h-5 w-5' />
            </button>

            <div className='flex flex-col items-center py-4'>
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-rc-red/10'>
                <Icon
                  icon='mdi:check-circle'
                  className='h-12 w-12 text-rc-red'
                />
              </div>

              <h3 className='mt-5 text-lg font-extrabold text-gray-900'>
                Check-in Berhasil!
              </h3>
              <p className='mt-2 text-center text-sm text-gray-500'>
                Selamat datang <span className='font-bold'>{profile.name}</span>{' '}
                <br />
                di Acara Royal Canin Vet Symposium 2026
              </p>

              <div className='mt-5 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3'>
                <Icon icon='twemoji:coin' className='h-8 w-8' />
                <div>
                  <p className='text-xs font-medium text-yellow-700'>
                    Skor Anda
                  </p>
                  <p className='text-2xl font-extrabold tabular-nums text-yellow-800'>
                    {(profile.detail.points ?? 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={dismissCheckInSuccessModal}
                className='mt-6 w-full cursor-pointer rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className='fixed top-6 right-6 z-100 animate-slide-in-right'>
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm max-w-sm ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <Icon
              icon={
                toast.type === 'success'
                  ? 'mdi:check-circle'
                  : 'mdi:alert-circle'
              }
              width='20'
              height='20'
              className={`shrink-0 mt-0.5 ${
                toast.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            />
            <p className='text-sm font-medium leading-snug'>{toast.message}</p>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='shrink-0 ml-1 mt-0.5 text-gray-400 hover:text-gray-600 cursor-pointer'>
              <Icon icon='mdi:close' width='16' height='16' />
            </button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className='fixed inset-0 z-50 flex items-start justify-center p-4 animate-fadeIn'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => !saving && setShowEditModal(false)}
          />

          <div className='relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[88vh]'>
            <div className='flex items-center justify-between py-3 px-5 border-b border-gray-100'>
              <h2 className='text-lg font-bold text-gray-900'>
                {isEditing ? 'Ubah Data Peserta' : 'Profil Saya'}
              </h2>
              <button
                type='button'
                onClick={() => !saving && setShowEditModal(false)}
                className='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors cursor-pointer'>
                <Icon icon='mdi:close' width='18' height='18' />
              </button>
            </div>

            <div className='p-5 overflow-y-auto space-y-4'>
              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Nama Lengkap
                </label>
                <input
                  type='text'
                  value={editForm.name}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors ${
                    isEditing
                      ? 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red'
                      : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  No. Telepon
                </label>
                <input
                  type='tel'
                  value={editForm.phone}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors ${
                    isEditing
                      ? 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red'
                      : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Nama Klinik
                </label>
                <input
                  type='text'
                  value={editForm.clinic_name}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clinic_name: e.target.value })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors ${
                    isEditing
                      ? 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red'
                      : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Nomor Identification Outlet (NIO)
                </label>
                <input
                  type='number'
                  value={editForm.outlet_number}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, outlet_number: e.target.value })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors ${
                    isEditing
                      ? 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red'
                      : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Akun Media Sosial
                </label>
                <input
                  type='text'
                  value={editForm.social_media_account}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      social_media_account: e.target.value,
                    })
                  }
                  placeholder='@username'
                  className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors ${
                    isEditing
                      ? 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red'
                      : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Jenis Hewan Peliharaan
                </label>
                <div className='flex flex-wrap gap-2'>
                  {PET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      disabled={!isEditing}
                      onClick={() =>
                        setEditForm({ ...editForm, pet: opt.value })
                      }
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        editForm.pet === opt.value
                          ? 'bg-rc-red text-white border-rc-red shadow-sm'
                          : isEditing
                            ? 'bg-white text-gray-600 border-gray-200 hover:border-rc-red cursor-pointer'
                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className='text-xs font-bold text-gray-600 mb-1 block'>
                  Ukuran Scrub
                </label>
                <div className='flex flex-wrap gap-2'>
                  {SCRUB_SIZES.map((size) => (
                    <button
                      key={size}
                      type='button'
                      disabled={!isEditing}
                      onClick={() =>
                        setEditForm({ ...editForm, scrub_size: size })
                      }
                      className={`w-12 h-10 text-xs font-bold rounded-lg border transition-all ${
                        editForm.scrub_size === size
                          ? 'bg-rc-red text-white border-rc-red shadow-sm'
                          : isEditing
                            ? 'bg-white text-gray-600 border-gray-200 hover:border-rc-red cursor-pointer'
                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100'>
                <label className='text-xs font-bold text-gray-600'>
                  Anggota Royal Canin Club
                </label>
                <button
                  type='button'
                  disabled={!isEditing}
                  onClick={() =>
                    setEditForm({ ...editForm, rc_club: !editForm.rc_club })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    editForm.rc_club ? 'bg-rc-red' : 'bg-gray-300'
                  } ${!isEditing ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}>
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                      editForm.rc_club ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* <div className='p-5 border-t border-gray-100 flex flex-col md:flex-row gap-3'>
              {isEditing ? (
                <>
                  <button
                    type='button'
                    onClick={() => {
                      if (saving) return;
                      setIsEditing(false);
                      if (profile) {
                        setEditForm({
                          name: profile.name,
                          phone: profile.detail.phone,
                          clinic_name: profile.detail.clinic_name ?? '',
                          outlet_number:
                            profile.detail.outlet_number?.toString() ?? '',
                          social_media_account:
                            profile.detail.social_media_account ?? '',
                          rc_club: profile.detail.rc_club ?? false,
                          pet: profile.detail.pet ?? '',
                          scrub_size: profile.detail.scrub_size ?? '',
                        });
                      }
                    }}
                    disabled={saving}
                    className='flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer'>
                    Batal
                  </button>
                  <button
                    type='button'
                    onClick={handleSaveProfile}
                    disabled={saving || !editForm.name.trim()}
                    className='flex-1 py-3 bg-rc-red text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#b50015] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer'>
                    {saving ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => setIsEditing(true)}
                  className='flex-1 py-3 bg-rc-red text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#b50015] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer'>
                  <Icon icon='line-md:edit' width='20' height='20' />
                  Ubah Data Profil
                </button>
              )}
            </div> */}
          </div>
        </div>
      )}
    </main>
  );
}
