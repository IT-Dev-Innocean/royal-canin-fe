'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { getToken } from '@/lib/auth';

const LIKERT_QUESTIONS = [
  {
    id: 'material_fit',
    label:
      'Apakah Narasumber memberikan materi yang sesuai dengan tema dan topik?',
  },
  {
    id: 'duration_presenter',
    label:
      'Apakah durasi presentasi dari masing-masing Narasumber sudah cukup?',
  },
  {
    id: 'duration_qna',
    label: 'Apakah durasi sesi Tanya Jawab sudah cukup?',
  },
  {
    id: 'qna_quality',
    label:
      'Apakah Narasumber memberikan jawaban yang sudah sesuai saat sesi Tanya Jawab?',
  },
  {
    id: 'overall_satisfaction',
    label: 'Secara umum, seberapa puaskah Dokter dengan acara ini?',
  },
  {
    id: 'recommend',
    label:
      'Seberapa besar Dokter ingin merekomendasikan acara ini kepada kolega?',
  },
] as const;

const LIKERT_LABELS: Record<number, string> = {
  1: 'Tidak setuju',
  2: 'Kurang setuju',
  3: 'Netral',
  4: 'Setuju',
  5: 'Sangat setuju',
};

const MOTIVATION_OPTIONS = [
  { id: 'narasumber', label: 'Narasumber' },
  { id: 'tema_topik', label: 'Tema & Topik' },
  { id: 'doorprize', label: 'Doorprize' },
  { id: 'lokasi', label: 'Lokasi' },
  { id: 'kolega', label: 'Kolega' },
  { id: 'other', label: 'Lainnya' },
] as const;

const ACTIVITY_OPTIONS = [
  'Gastrointestinal Facts',
  'Gastrointestinal Products',
  'Panduan Nutrisi Praktis',
  'Royal Canin Club',
  'Study Case Poster',
  'Voice Of Veterinarian',
  'Pawtography (Photo Booth)',
  'Maze Game',
] as const;

const EXPECTATION_ASPECTS = [
  'Topik & Tema',
  'Pembicara',
  'Aktivitas di Booth',
  'Venue',
  'Komunikasi Admin Whatsapp',
  'Apresiasi untuk peserta',
  'Informasi di Microsite',
] as const;

const EXPECTATION_SCALE = [
  'Tidak memenuhi ekspektasi saya',
  'Perlu ditingkatkan lagi',
  'Sesuai ekspektasi saya',
  'Melebihi ekspektasi saya',
  'Jauh melebihi ekspektasi saya',
] as const;

const SESSIONS = [
  'Peluncuran & Presentasi Produk',
  'Sesi Seminar Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM) — Tema: Fibre Forward: Unlocking The Power of Fibre in Managing GI Health',
  'Sesi Seminar Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM) — Tema: Dietary Fiber Aids in The Management of Cat and Dog Gastrointestinal Disease',
  'Sesi Seminar Prof. drh. Deni Noviana, Ph.D., DAiCVIM — Tema: Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs: Focus on Fibre-Related and Common Clinical Conditions',
  'Sesi Seminar drh. Luh Putu Listriani Wistawan — Tema: From Diagnosis to Therapy: Case-Based Insights and Nutritional Guidance for Fibre-Related GI Problems',
  'Sesi Tanya Jawab',
  'Aktivitas Booth & Networking',
] as const;

const RELEVANCE_OPTIONS = [
  'Tidak Relevan',
  'Relevan',
  'Sangat Relevan',
  'Tidak Hadir',
] as const;

const FIBRE_IMPACT_OPTIONS = [
  {
    id: 'protocol_update',
    label:
      'Sangat berdampak — Saya akan memperbarui protokol diet GI di klinik saya.',
  },
  {
    id: 'insight',
    label:
      'Memberikan wawasan baru yang memperkuat keputusan klinis saya selama ini.',
  },
  {
    id: 'refresh',
    label:
      'Menyegarkan kembali ilmu dasar, namun belum mengubah pendekatan praktik saya.',
  },
  {
    id: 'hard_apply',
    label: 'Sulit diaplikasikan pada demografi pasien saya.',
  },
  { id: 'other', label: 'Lainnya' },
] as const;

type FeedbackFormSnapshot = {
  likert: Record<string, string>;
  motivation: string[];
  motivationOther: string;
  activities: string[];
  expectation: Record<string, string>;
  sessionRelevance: Record<string, string>;
  fibreImpact: string;
  fibreOther: string;
  citySuggestion: string;
  improvementSuggestion: string;
};

function motivationLabelsFromIds(ids: readonly string[]): string {
  return ids
    .map((id) => MOTIVATION_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(', ');
}

function getFeedbackSummaryRows(
  s: FeedbackFormSnapshot
): { question: string; answer: string }[] {
  const rows: { question: string; answer: string }[] = [];

  for (const q of LIKERT_QUESTIONS) {
    const n = Number(s.likert[q.id]);
    rows.push({
      question: q.label,
      answer: `${n} — ${LIKERT_LABELS[n]}`,
    });
  }

  let motivationAnswer = motivationLabelsFromIds(s.motivation);
  if (s.motivation.includes('other') && s.motivationOther.trim()) {
    motivationAnswer += `. Lainnya: ${s.motivationOther.trim()}`;
  }
  rows.push({
    question: 'Pilih 3 hal yang memotivasi Dokter menghadiri acara hari ini',
    answer: motivationAnswer,
  });

  rows.push({
    question:
      'Manakah 3 aktivitas yang paling interaktif & menyenangkan untuk diikuti?',
    answer: s.activities.join(', '),
  });

  for (const aspect of EXPECTATION_ASPECTS) {
    rows.push({
      question: `Ekspektasi — ${aspect}`,
      answer: s.expectation[aspect] ?? '',
    });
  }

  SESSIONS.forEach((session, index) => {
    rows.push({
      question: `Relevansi materi — ${session}`,
      answer: s.sessionRelevance[`session_${index}`] ?? '',
    });
  });

  const fibreLabel =
    FIBRE_IMPACT_OPTIONS.find((o) => o.id === s.fibreImpact)?.label ?? '';
  const fibreAnswer =
    s.fibreImpact === 'other' && s.fibreOther.trim()
      ? `${fibreLabel} (${s.fibreOther.trim()})`
      : fibreLabel;
  rows.push({
    question:
      'Sejauh mana Vet Symposium hari ini mengubah perspektif atau pendekatan Dokter terhadap penggunaan serat (fibre) dalam manajemen kasus gastrointestinal?',
    answer: fibreAnswer,
  });

  rows.push({
    question:
      'Saran Dokter untuk kota penyelenggaraan Royal Canin Vet Symposium berikutnya',
    answer: s.citySuggestion.trim(),
  });

  rows.push({
    question:
      'Saran Dokter untuk perbaikan Royal Canin Vet Symposium berikutnya',
    answer: s.improvementSuggestion.trim(),
  });

  return rows;
}

function buildRawResponsesRequestBody(s: FeedbackFormSnapshot) {
  return {
    payload: {
      items: getFeedbackSummaryRows(s).map((row) => ({
        question: row.question,
        answer: row.answer,
      })),
    },
  };
}

function FieldCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className='text-sm font-bold text-gray-900 mb-3 leading-snug'>
      {children}
      {required ? (
        <span className='text-rc-red ml-0.5' aria-hidden>
          *
        </span>
      ) : null}
    </p>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [likert, setLikert] = useState<Record<string, string>>({});
  const [motivation, setMotivation] = useState<string[]>([]);
  const [motivationOther, setMotivationOther] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [expectation, setExpectation] = useState<Record<string, string>>({});
  const [sessionRelevance, setSessionRelevance] = useState<
    Record<string, string>
  >({});
  const [fibreImpact, setFibreImpact] = useState('');
  const [fibreOther, setFibreOther] = useState('');
  const [citySuggestion, setCitySuggestion] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');

  const setLikertValue = (id: string, value: string) => {
    setLikert((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMaxThree = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
    max: number
  ) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      return;
    }
    if (list.length >= max) return;
    setList([...list, id]);
  };

  const validate = (): boolean => {
    if (!LIKERT_QUESTIONS.every((q) => likert[q.id])) return false;

    if (motivation.length !== 3) return false;
    if (motivation.includes('other') && !motivationOther.trim()) return false;

    if (activities.length !== 3) return false;

    if (!EXPECTATION_ASPECTS.every((a) => expectation[a])) return false;

    if (!SESSIONS.every((_, i) => sessionRelevance[`session_${i}`]))
      return false;

    if (!fibreImpact) return false;
    if (fibreImpact === 'other' && !fibreOther.trim()) return false;

    if (!citySuggestion.trim() || !improvementSuggestion.trim()) return false;

    return true;
  };

  const formSnapshot = (): FeedbackFormSnapshot => ({
    likert,
    motivation,
    motivationOther,
    activities,
    expectation,
    sessionRelevance,
    fibreImpact,
    fibreOther,
    citySuggestion,
    improvementSuggestion,
  });

  const handleKirim = () => {
    if (!validate()) {
      setShowIncompleteModal(true);
      return;
    }
    setSubmitError(null);
    setShowConfirmModal(true);
  };

  const handleCloseConfirm = () => {
    if (isSubmitting) return;
    setShowConfirmModal(false);
    setSubmitError(null);
  };

  const handleConfirmSubmit = async () => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/seminars/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildRawResponsesRequestBody(formSnapshot())),
      });

      const json: {
        success?: boolean;
        message?: string;
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(json.message ?? 'Gagal mengirim tanggapan.');
        return;
      }
      if (json.success === false) {
        setSubmitError(json.message ?? 'Gagal mengirim tanggapan.');
        return;
      }

      setShowConfirmModal(false);
      router.push('/event/seminar/feedback/confirmation');
    } catch {
      setSubmitError('Tidak dapat terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='flex flex-col items-center px-4 py-6 pb-28 min-h-screen text-black'>
      <div className='w-full max-w-lg'>
        <div className='mb-6 text-center'>
          <h1 className='text-xl font-bold text-rc-red mt-0 mb-2'>
            Formulir Tanggapan
          </h1>
          {/* <p className='text-rc-red text-xs font-semibold'>
            Royal Canin Vet Symposium 2026
          </p> */}
        </div>

        <FieldCard className='mb-4 bg-slate-100/80 border-slate-200'>
          <p className='text-xs text-gray-700 leading-relaxed mb-0'>
            Terima kasih atas kehadiran dan partisipasi aktif Dokter di Royal
            Canin Vet Symposium 2026. Mohon luangkan waktu sejenak untuk mengisi
            survei singkat ini. Masukan Dokter sangat berarti bagi kami untuk
            terus menyempurnakan kualitas acara dan materi di masa mendatang.
          </p>
        </FieldCard>

        <p className='text-xs text-gray-600 mb-4 px-1'>
          Skala penilaian:{' '}
          <span className='font-semibold text-gray-800'>1 = Tidak setuju</span>{' '}
          |{' '}
          <span className='font-semibold text-gray-800'>5 = Sangat setuju</span>
        </p>

        <div className='space-y-4'>
          {LIKERT_QUESTIONS.map((q) => (
            <FieldCard key={q.id}>
              <SectionLabel required>{q.label}</SectionLabel>
              <div className='flex flex-col gap-2'>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <label
                    key={n}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                      likert[q.id] === String(n)
                        ? 'border-rc-red bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <input
                      type='radio'
                      name={q.id}
                      value={String(n)}
                      checked={likert[q.id] === String(n)}
                      onChange={() => setLikertValue(q.id, String(n))}
                      className='accent-rc-red shrink-0'
                    />
                    <span className='text-gray-800'>
                      <span className='font-semibold'>{n}</span>
                      <span className='text-gray-500'>
                        {' '}
                        — {LIKERT_LABELS[n]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </FieldCard>
          ))}

          <FieldCard>
            <SectionLabel required>
              Pilih 3 hal yang memotivasi Dokter menghadiri acara hari ini
            </SectionLabel>
            <p className='text-[11px] text-gray-500 mb-3'>
              Maksimal 3 pilihan ({motivation.length}/3)
            </p>
            <div className='flex flex-col gap-2'>
              {MOTIVATION_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm ${
                    motivation.includes(opt.id)
                      ? 'border-rc-red bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}>
                  <input
                    type='checkbox'
                    checked={motivation.includes(opt.id)}
                    onChange={() =>
                      toggleMaxThree(motivation, setMotivation, opt.id, 3)
                    }
                    className='accent-rc-red shrink-0'
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {motivation.includes('other') ? (
              <div className='mt-3'>
                <p className='text-xs font-medium text-gray-700 mb-1.5'>
                  Sebutkan (wajib jika memilih Lainnya)
                </p>
                <textarea
                  value={motivationOther}
                  onChange={(e) => setMotivationOther(e.target.value)}
                  placeholder='Tulis di sini…'
                  rows={3}
                  className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
                />
              </div>
            ) : null}
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Manakah 3 aktivitas yang paling interaktif & menyenangkan untuk
              diikuti?
            </SectionLabel>
            <p className='text-[11px] text-gray-500 mb-3'>
              Maksimal 3 pilihan ({activities.length}/3)
            </p>
            <div className='flex flex-col gap-2'>
              {ACTIVITY_OPTIONS.map((label) => (
                <label
                  key={label}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm ${
                    activities.includes(label)
                      ? 'border-rc-red bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}>
                  <input
                    type='checkbox'
                    checked={activities.includes(label)}
                    onChange={() =>
                      toggleMaxThree(activities, setActivities, label, 3)
                    }
                    className='accent-rc-red shrink-0 mt-0.5'
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Berdasarkan pengalaman Dokter, seberapa besar acara Vet Symposium
              hari ini memenuhi ekspektasi Dokter? (tiap aspek)
            </SectionLabel>
            <div className='flex flex-col gap-5'>
              {EXPECTATION_ASPECTS.map((aspect) => (
                <div key={aspect}>
                  <p className='text-xs font-semibold text-gray-800 mb-2'>
                    {aspect}
                  </p>
                  <div className='flex flex-col gap-2'>
                    {EXPECTATION_SCALE.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2 cursor-pointer text-xs leading-snug ${
                          expectation[aspect] === opt
                            ? 'border-rc-red bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}>
                        <input
                          type='radio'
                          name={`exp_${aspect}`}
                          checked={expectation[aspect] === opt}
                          onChange={() =>
                            setExpectation((p) => ({ ...p, [aspect]: opt }))
                          }
                          className='accent-rc-red shrink-0 mt-0.5'
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Sesi manakah yang materinya dirasa paling relevan dengan kebutuhan
              dan praktik keseharian Dokter?
            </SectionLabel>
            <div className='flex flex-col gap-5'>
              {SESSIONS.map((session, index) => {
                const key = `session_${index}`;
                return (
                  <div key={key}>
                    <p className='text-xs font-semibold text-gray-800 mb-2 leading-snug'>
                      {session}
                    </p>
                    <div className='flex flex-col gap-2'>
                      {RELEVANCE_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer text-xs ${
                            sessionRelevance[key] === opt
                              ? 'border-rc-red bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}>
                          <input
                            type='radio'
                            name={key}
                            checked={sessionRelevance[key] === opt}
                            onChange={() =>
                              setSessionRelevance((p) => ({
                                ...p,
                                [key]: opt,
                              }))
                            }
                            className='accent-rc-red shrink-0'
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Sejauh mana Vet Symposium hari ini mengubah perspektif atau
              pendekatan Dokter terhadap penggunaan serat (fibre) dalam
              manajemen kasus gastrointestinal?
            </SectionLabel>
            <div className='flex flex-col gap-2'>
              {FIBRE_IMPACT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm leading-snug ${
                    fibreImpact === opt.id
                      ? 'border-rc-red bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}>
                  <input
                    type='radio'
                    name='fibre_impact'
                    checked={fibreImpact === opt.id}
                    onChange={() => setFibreImpact(opt.id)}
                    className='accent-rc-red shrink-0 mt-1'
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {fibreImpact === 'other' ? (
              <div className='mt-3'>
                <p className='text-xs font-medium text-gray-700 mb-1.5'>
                  Jelaskan (wajib)
                </p>
                <textarea
                  value={fibreOther}
                  onChange={(e) => setFibreOther(e.target.value)}
                  placeholder='Tulis di sini…'
                  rows={3}
                  className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
                />
              </div>
            ) : null}
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Saran Dokter untuk kota penyelenggaraan Royal Canin Vet Symposium
              berikutnya
            </SectionLabel>
            <textarea
              value={citySuggestion}
              onChange={(e) => setCitySuggestion(e.target.value)}
              placeholder='Tulis jawaban Anda…'
              rows={4}
              className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
            />
          </FieldCard>

          <FieldCard>
            <SectionLabel required>
              Saran Dokter untuk perbaikan Royal Canin Vet Symposium berikutnya
            </SectionLabel>
            <textarea
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              placeholder='Tulis jawaban Anda…'
              rows={4}
              className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
            />
          </FieldCard>

          <div className='pt-2 pb-6'>
            <button
              type='button'
              onClick={handleKirim}
              className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] transition-all active:scale-[0.98] cursor-pointer'>
              Kirim Tanggapan
            </button>
          </div>
        </div>
      </div>

      {showIncompleteModal ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn'>
          <div
            role='presentation'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setShowIncompleteModal(false)}
          />

          <div className='relative bg-white rounded-2xl p-8 w-full max-w-[320px] text-center shadow-2xl scale-in-center'>
            <div className='w-16 h-16 bg-red-50 text-rc-red rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-bold text-gray-900 mb-2'>
              Belum Lengkap!
            </h3>
            <p className='text-xs text-gray-500 leading-relaxed mb-6'>
              Mohon lengkapi semua pertanyaan wajib: skala 1–5 (6 pertanyaan),
              pilih tepat 3 motivasi dan 3 aktivitas, penilaian ekspektasi tiap
              aspek, relevansi tiap sesi, dampak fibre, serta dua kolom saran.
            </p>
            <button
              type='button'
              onClick={() => setShowIncompleteModal(false)}
              className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md active:scale-95 transition-all cursor-pointer'>
              Siap, Lengkapi
            </button>
          </div>
        </div>
      ) : null}

      {showConfirmModal ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn'>
          <div
            role='presentation'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={handleCloseConfirm}
          />

          <div className='relative bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]'>
            <div className='shrink-0 px-6 pt-6 pb-2 text-center border-b border-gray-100'>
              <h2 className='text-lg font-bold text-rc-red mt-0 mb-2'>
                Konfirmasi
              </h2>
              <p className='text-xs text-gray-500 leading-relaxed mb-0'>
                Pastikan jawaban di bawah ini sudah benar sebelum mengirim
                tanggapan ke sistem.
              </p>
            </div>

            <div className='flex-1 min-h-0 overflow-y-auto px-4 py-4'>
              <div className='rounded-2xl border border-gray-200 bg-white p-4 space-y-4'>
                {getFeedbackSummaryRows(formSnapshot()).map((row, index) => (
                  <div
                    key={`${index}-${row.question.slice(0, 24)}`}
                    className='flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-gray-600 leading-snug mb-1.5 italic'>
                        {row.question}
                      </p>
                      <p className='text-xs font-bold leading-snug'>
                        {row.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {submitError ? (
              <p className='px-6 text-xs text-red-600 text-center -mt-1 mb-2'>
                {submitError}
              </p>
            ) : null}

            <div className='shrink-0 px-6 pb-6 pt-2 space-y-2'>
              <button
                type='button'
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer'>
                {isSubmitting ? 'Mengirim…' : 'Sudah Benar'}
              </button>
              <button
                type='button'
                disabled={isSubmitting}
                onClick={handleCloseConfirm}
                className='w-full py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer'>
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
