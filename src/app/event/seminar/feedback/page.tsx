'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

const LIKERT_QUESTIONS = [
  {
    id: 'material_fit',
    label: 'Narasumber memberikan materi yang sesuai dengan tema dan topik',
  },
  {
    id: 'duration_session_qna',
    label: 'Durasi sesi presentasi & tanya jawab dengan narasumber sudah cukup',
  },
  {
    id: 'qna_quality',
    label: 'Narasumber memberikan jawaban pertanyaan yang sesuai',
  },
  {
    id: 'recommend',
    label: 'Saya ingin merekomendasikan acara ini kepada kolega Saya',
  },
  {
    id: 'overall_satisfaction',
    label: 'Saya merasa puas dengan acara hari ini',
  },
] as const;

const LIKERT_LABELS: Record<number, string> = {
  1: 'Tidak Setuju',
  2: 'Kurang Setuju',
  3: 'Netral',
  4: 'Setuju',
  5: 'Sangat Setuju',
};

const MOTIVATION_OPTIONS = [
  { id: 'narasumber', label: 'Narasumber' },
  { id: 'tema_topik', label: 'Topik Pembicara' },
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
  'A. Topik & Tema',
  'B. Pembicara',
  'C. Aktivitas di Booth',
  'D. Venue',
  'E. Apresiasi untuk peserta',
] as const;

const EXPECTATION_SCALE = [
  'Tidak memenuhi ekspektasi saya',
  'Perlu ditingkatkan lagi',
  'Sesuai ekspektasi saya',
  'Melebihi ekspektasi saya',
] as const;

const SESSIONS = [
  'A. Peluncuran & Presentasi Produk',
  'B. Sesi Seminar Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM) - Tema: Fibre Forward: Unlocking The Power of Fibre in Managing GI Health',
  'C. Sesi Seminar Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM) - Tema: Dietary Fiber Aids in The Management of Cat and Dog Gastrointestinal Disease',
  'D. Sesi Seminar Prof. drh. Deni Noviana, Ph.D., DAICVIM - Tema: Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs: Focus on Fibre-Related and Common Clinical Conditions',
  'E. Sesi Seminar drh. Luh Putu Listriani Wistawan - Tema: From Diagnosis to Therapy: Case-Based Insights and Nutritional Guidance for Fibre-Related GI Problems',
  'F. Sesi Tanya Jawab',
  'G. Aktivitas Booth & Networking',
] as const;

const RELEVANCE_OPTIONS = [
  'Tidak Relevan',
  'Relevan',
  'Sangat Relevan',
] as const;

const FIBRE_IMPACT_OPTIONS = [
  {
    id: 'protocol_update',
    label:
      'Sangat berdampak – Saya akan memperbarui protokol diet GI di klinik saya.',
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
    id: 'theoretical',
    label:
      'Terlalu teoretis dan sulit diaplikasikan pada demografi pasien saya.',
  },
] as const;

const FIBRE_PERSPECTIVE_QUESTION =
  'Sejauh mana Vet Symposium hari ini mengubah perspektif atau pendekatan Dokter terhadap penggunaan serat (fibre) dalam manajemen kasus gastrointestinal?';

type FeedbackFormSnapshot = {
  likert: Record<string, string>;
  motivation: string[];
  motivationOther: string;
  activities: string[];
  expectation: Record<string, string>;
  sessionRelevance: Record<string, string>;
  fibreImpact: string[];
  citySuggestion: string;
  improvementSuggestion: string;
};

/** Satu layar per blok: 1–5, 6, 7, 8, 9, 10, lalu 11–12 bersama. */
const TOTAL_FEEDBACK_STEPS = 7;

const STEP_HEADINGS: readonly string[] = [
  'Penilaian skala',
  'Motivasi kehadiran',
  'Aktivitas interaktif',
  'Ekspektasi terhadap acara',
  'Relevansi materi tiap sesi',
  'Perspektif penggunaan serat / fibre',
  'Saran kota & perbaikan acara',
];

function validateFeedbackStep(
  stepIndex: number,
  s: FeedbackFormSnapshot
): string[] {
  const errors: string[] = [];
  switch (stepIndex) {
    case 0: {
      const missing = LIKERT_QUESTIONS.filter((q) => !s.likert[q.id]).length;
      if (missing > 0) {
        errors.push(
          `Masih ada ${missing} pertanyaan dari bagian 1–5 yang belum dijawab.`
        );
      }
      break;
    }
    case 1:
      if (s.motivation.length !== 3) {
        errors.push('Pilih tepat 3 hal yang memotivasi kehadiran Anda.');
      }
      if (s.motivation.includes('other') && !s.motivationOther.trim()) {
        errors.push('Isi kolom keterangan untuk opsi Lainnya.');
      }
      break;
    case 2:
      if (s.activities.length !== 3) {
        errors.push('Pilih tepat 3 aktivitas yang paling interaktif.');
      }
      break;
    case 3: {
      const missing = EXPECTATION_ASPECTS.filter(
        (a) => !s.expectation[a]
      ).length;
      if (missing > 0) {
        errors.push(
          `Masih ada ${missing} aspek ekspektasi yang belum dinilai (bagian 8).`
        );
      }
      break;
    }
    case 4: {
      const missing = SESSIONS.filter(
        (_, i) => !s.sessionRelevance[`session_${i}`]
      ).length;
      if (missing > 0) {
        errors.push(
          `Masih ada ${missing} sub-sesi yang tingkat relevansinya belum dipilih (bagian 9).`
        );
      }
      break;
    }
    case 5:
      if (s.fibreImpact.length < 1) {
        errors.push(
          'Pilih minimal satu opsi untuk dampak pada penggunaan serat (fibre).'
        );
      }
      break;
    case 6:
      if (!s.citySuggestion.trim()) {
        errors.push('Isi saran untuk kota penyelenggaraan berikutnya.');
      }
      if (!s.improvementSuggestion.trim()) {
        errors.push('Isi saran untuk perbaikan symposium berikutnya.');
      }
      break;
    default:
      break;
  }
  return errors;
}

/** Gulir ke sub-bagian pertama yang belum valid pada langkah terkini (setelah layout commit). */
function scrollToFirstIssueInStep(
  stepIndex: number,
  s: FeedbackFormSnapshot
): void {
  const run = () => {
    switch (stepIndex) {
      case 0: {
        const q = LIKERT_QUESTIONS.find((x) => !s.likert[x.id]);
        const id = q ? `feedback-likert-${q.id}` : null;
        document.getElementById(id ?? '')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        break;
      }
      case 1:
        document.getElementById('feedback-step-motivation')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        break;
      case 2:
        document.getElementById('feedback-step-activities')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        break;
      case 3: {
        const ix = EXPECTATION_ASPECTS.findIndex((a) => !s.expectation[a]);
        if (ix >= 0) {
          document
            .getElementById(`feedback-expect-${ix}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
      case 4: {
        const ix = SESSIONS.findIndex(
          (_, i) => !s.sessionRelevance[`session_${i}`]
        );
        if (ix >= 0) {
          document
            .getElementById(`feedback-session-${ix}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
      case 5:
        document.getElementById('feedback-step-fibre')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        break;
      case 6:
        if (!s.citySuggestion.trim()) {
          document.getElementById('feedback-saran-kota')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else if (!s.improvementSuggestion.trim()) {
          document.getElementById('feedback-saran-perbaikan')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
        break;
      default:
        break;
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

function motivationLabelsFromIds(ids: readonly string[]): string {
  return ids
    .map((id) => MOTIVATION_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(', ');
}

function getFeedbackSummaryRows(
  s: FeedbackFormSnapshot
): { question: string; answer: string }[] {
  const rows: { question: string; answer: string }[] = [];

  LIKERT_QUESTIONS.forEach((q, i) => {
    const n = Number(s.likert[q.id]);
    rows.push({
      question: `${i + 1}. ${q.label}`,
      answer: `${n} — ${LIKERT_LABELS[n]}`,
    });
  });

  let motivationAnswer = motivationLabelsFromIds(s.motivation);
  if (s.motivation.includes('other') && s.motivationOther.trim()) {
    motivationAnswer += `. Lainnya: ${s.motivationOther.trim()}`;
  }
  rows.push({
    question: '6. 3 hal yang memotivasi Dokter menghadiri acara hari ini',
    answer: motivationAnswer,
  });

  rows.push({
    question:
      '7. 3 aktivitas yang paling interaktif & menyenangkan untuk diikuti',
    answer: s.activities.join(', '),
  });

  for (const aspect of EXPECTATION_ASPECTS) {
    rows.push({
      question: `8. Ekspektasi — ${aspect}`,
      answer: s.expectation[aspect] ?? '',
    });
  }

  SESSIONS.forEach((session, index) => {
    rows.push({
      question: `9. Relevansi materi — ${session}`,
      answer: s.sessionRelevance[`session_${index}`] ?? '',
    });
  });

  const fibreAnswer = s.fibreImpact
    .map((id) => FIBRE_IMPACT_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join('; ');
  rows.push({
    question: `10. ${FIBRE_PERSPECTIVE_QUESTION}`,
    answer: fibreAnswer,
  });

  rows.push({
    question:
      '11. Saran Dokter untuk kota penyelenggaraan Royal Canin Vet Symposium berikutnya',
    answer: s.citySuggestion.trim(),
  });

  rows.push({
    question:
      '12. Saran Dokter untuk perbaikan Royal Canin Vet Symposium berikutnya',
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
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
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
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
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
  const [fibreImpact, setFibreImpact] = useState<string[]>([]);
  const [citySuggestion, setCitySuggestion] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');

  useEffect(() => {
    setStepErrors([]);
  }, [
    likert,
    motivation,
    motivationOther,
    activities,
    expectation,
    sessionRelevance,
    fibreImpact,
    citySuggestion,
    improvementSuggestion,
  ]);

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

  const toggleFibreImpact = (id: string) => {
    setFibreImpact((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formSnapshot = (): FeedbackFormSnapshot => ({
    likert,
    motivation,
    motivationOther,
    activities,
    expectation,
    sessionRelevance,
    fibreImpact,
    citySuggestion,
    improvementSuggestion,
  });

  useEffect(() => {
    if (stepErrors.length === 0) return;
    scrollToFirstIssueInStep(step, formSnapshot());
    // Scroll memakai snapshot terbaru; dipicu hanya saat langkah / daftar error validasi berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepErrors]);

  const progressPercent = Math.round(((step + 1) / TOTAL_FEEDBACK_STEPS) * 100);

  const goNext = () => {
    const snap = formSnapshot();
    const errs = validateFeedbackStep(step, snap);
    if (errs.length > 0) {
      setStepErrors(errs);
      return;
    }
    setStepErrors([]);
    setStep((s) => Math.min(TOTAL_FEEDBACK_STEPS - 1, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStepErrors([]);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKirim = () => {
    const snap = formSnapshot();
    for (let i = 0; i < TOTAL_FEEDBACK_STEPS; i++) {
      const errs = validateFeedbackStep(i, snap);
      if (errs.length > 0) {
        setStep(i);
        setStepErrors(errs);
        return;
      }
    }
    setStepErrors([]);
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
          <h1 className='text-xl font-bold text-black mt-0 mb-2'>
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
          <p className='text-xs mt-2 text-rc-red font-semibold'>
            Peserta wajib mengisi formulir tanggapan sebagai syarat untuk
            mengambil sertifikat
          </p>
        </FieldCard>

        <div className='mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
          <div className='flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-700'>
            <span className='font-semibold text-gray-900'>
              Langkah {step + 1} dari {TOTAL_FEEDBACK_STEPS}
            </span>
            <span className='font-bold tabular-nums text-rc-red'>
              Progres {progressPercent}%
            </span>
          </div>
          <p className='mt-1 mb-3 text-[11px] leading-snug text-gray-500'>
            {STEP_HEADINGS[step]}
            {step < TOTAL_FEEDBACK_STEPS - 1 ? (
              <>
                {' '}
                · Sekitar{' '}
                <span className='font-medium text-gray-700'>
                  {100 - progressPercent}%
                </span>{' '}
                lagi hingga formulir selesai
              </>
            ) : (
              <span className='font-medium text-gray-700'>
                {' '}
                · Langkah terakhir — tinjau jawaban lalu kirim
              </span>
            )}
          </p>
          <div className='h-2.5 overflow-hidden rounded-full bg-gray-200'>
            <div
              className='h-full rounded-full bg-rc-red transition-[width] duration-300 ease-out'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {stepErrors.length > 0 ? (
          <div
            role='alert'
            className='mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5'>
            <p className='mb-1.5 text-xs font-bold text-red-900'>
              Mohon lengkapi bagian ini:
            </p>
            <ul className='list-disc space-y-1 pl-4 text-xs text-red-800'>
              {stepErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className='space-y-4'>
          {step === 0 ? (
            <>
              <p className='px-1 text-xs text-gray-600'>
                Skala penilaian:{' '}
                <span className='font-semibold text-gray-800'>
                  1 = Tidak Setuju
                </span>{' '}
                |{' '}
                <span className='font-semibold text-gray-800'>
                  5 = Sangat Setuju
                </span>
              </p>
              {LIKERT_QUESTIONS.map((q, index) => {
                const likertMissing =
                  step === 0 && stepErrors.length > 0 && !likert[q.id];
                return (
                  <FieldCard
                    key={q.id}
                    id={`feedback-likert-${q.id}`}
                    className={
                      likertMissing
                        ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                        : ''
                    }>
                    <SectionLabel required>
                      {index + 1}. {q.label}
                    </SectionLabel>
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
                );
              })}
            </>
          ) : null}

          {step === 1 ? (
            <FieldCard
              id='feedback-step-motivation'
              className={
                stepErrors.length > 0 &&
                (motivation.length !== 3 ||
                  (motivation.includes('other') && !motivationOther.trim()))
                  ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                  : ''
              }>
              <SectionLabel required>
                6. 3 hal yang memotivasi Dokter menghadiri acara hari ini
              </SectionLabel>
              <p className='text-[11px] text-gray-500 mb-3'>
                <span className='font-semibold'>Wajib</span> - pilih tepat 3 hal
                yang memotivasi ({motivation.length}/3)
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
          ) : null}

          {step === 2 ? (
            <FieldCard
              id='feedback-step-activities'
              className={
                stepErrors.length > 0 && activities.length !== 3
                  ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                  : ''
              }>
              <SectionLabel required>
                7. 3 aktivitas yang paling interaktif & menyenangkan untuk
                diikuti
              </SectionLabel>
              <p className='text-[11px] text-gray-500 mb-3'>
                <span className='font-semibold'>Wajib</span> - pilih tepat 3 hal
                yang paling interaktif & menyenangkan ({activities.length}/3)
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
          ) : null}

          {step === 3 ? (
            <FieldCard>
              <SectionLabel required>
                8. Berdasarkan pengalaman Dokter, seberapa besar acara Vet
                Symposium hari ini memenuhi ekspektasi Dokter? (tiap aspek)
              </SectionLabel>
              <div className='flex flex-col gap-5'>
                {EXPECTATION_ASPECTS.map((aspect, expIndex) => {
                  const aspectMissing =
                    step === 3 && stepErrors.length > 0 && !expectation[aspect];
                  return (
                    <div
                      key={aspect}
                      id={`feedback-expect-${expIndex}`}
                      className={`rounded-xl p-1 sm:p-4 ${
                        aspectMissing
                          ? 'border-2 border-red-400 bg-red-50/90 shadow-[0_0_0_1px_rgba(248,113,113,0.45)]'
                          : ''
                      }`}>
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
                  );
                })}
              </div>
            </FieldCard>
          ) : null}

          {step === 4 ? (
            <FieldCard>
              <SectionLabel required>
                9. Sesi manakah yang materinya dirasa paling relevan dengan
                kebutuhan dan praktik keseharian Dokter?
              </SectionLabel>
              <div className='flex flex-col gap-5'>
                {SESSIONS.map((session, index) => {
                  const key = `session_${index}`;
                  const sessionMissing =
                    step === 4 &&
                    stepErrors.length > 0 &&
                    !sessionRelevance[key];
                  return (
                    <div
                      key={key}
                      id={`feedback-session-${index}`}
                      className={`rounded-xl p-1 sm:p-4 ${
                        sessionMissing
                          ? 'border-2 border-red-400 bg-red-50/90 shadow-[0_0_0_1px_rgba(248,113,113,0.45)]'
                          : ''
                      }`}>
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
          ) : null}

          {step === 5 ? (
            <FieldCard
              id='feedback-step-fibre'
              className={
                stepErrors.length > 0 && fibreImpact.length < 1
                  ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                  : ''
              }>
              <SectionLabel required>
                10. {FIBRE_PERSPECTIVE_QUESTION}
              </SectionLabel>
              <p className='text-[11px] text-gray-500 mb-3'>
                Boleh memilih lebih dari satu jawaban ({fibreImpact.length}{' '}
                dipilih)
              </p>
              <div className='flex flex-col gap-2'>
                {FIBRE_IMPACT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm leading-snug ${
                      fibreImpact.includes(opt.id)
                        ? 'border-rc-red bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                    <input
                      type='checkbox'
                      checked={fibreImpact.includes(opt.id)}
                      onChange={() => toggleFibreImpact(opt.id)}
                      className='accent-rc-red shrink-0 mt-1'
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </FieldCard>
          ) : null}

          {step === 6 ? (
            <>
              <FieldCard
                id='feedback-saran-kota'
                className={
                  stepErrors.length > 0 && !citySuggestion.trim()
                    ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                    : ''
                }>
                <SectionLabel required>
                  11. Saran Dokter untuk kota penyelenggaraan Royal Canin Vet
                  Symposium berikutnya
                </SectionLabel>
                <textarea
                  value={citySuggestion}
                  onChange={(e) => setCitySuggestion(e.target.value)}
                  placeholder='Tulis jawaban Anda…'
                  rows={4}
                  className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
                />
              </FieldCard>

              <FieldCard
                id='feedback-saran-perbaikan'
                className={
                  stepErrors.length > 0 && !improvementSuggestion.trim()
                    ? 'border-red-400 bg-red-50/90 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                    : ''
                }>
                <SectionLabel required>
                  12. Saran Dokter untuk perbaikan Royal Canin Vet Symposium
                  berikutnya
                </SectionLabel>
                <textarea
                  value={improvementSuggestion}
                  onChange={(e) => setImprovementSuggestion(e.target.value)}
                  placeholder='Tulis jawaban Anda…'
                  rows={4}
                  className='w-full border border-gray-200 bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rc-red'
                />
              </FieldCard>
            </>
          ) : null}

          <div className='flex gap-2 pt-2 pb-6'>
            {step > 0 ? (
              <button
                type='button'
                onClick={goPrev}
                className='flex-1 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.98] cursor-pointer'>
                Kembali
              </button>
            ) : null}
            <button
              type='button'
              onClick={step < TOTAL_FEEDBACK_STEPS - 1 ? goNext : handleKirim}
              className={`${step > 0 ? 'flex-1' : 'w-full'} rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98] cursor-pointer`}>
              {step < TOTAL_FEEDBACK_STEPS - 1 ? 'Lanjut' : 'Kirim Tanggapan'}
            </button>
          </div>
        </div>
      </div>

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
