'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { submitRegistration } from '@/lib/register-client';
import type {
  PetTypeOption,
  RegistrationRequestBody,
  RoyalCaninClubAnswer,
  ScrubSize,
} from '@/types/registration';

export const CONFIRMATION_STORAGE_KEY = 'vet_sym_2026_confirmation_v1';

export interface ConfirmationSnapshot {
  fullName: string;
  email: string;
  phone: string;
  clinicName: string;
  noi: string;
  registrationId: string;
  submittedAt: string;
}

const defaultForm: RegistrationRequestBody = {
  email: '',
  fullName: '',
  phone: '',
  clinicName: '',
  noi: '',
  socialMedia: '',
  royalCaninClub: 'ya',
  petTypes: 'kucing_anjing',
  scrubSize: 'M',
  agreedToPrivacy: false,
  agreedToAdminOnly: false,
};

type RegistrationFormContextValue = {
  form: RegistrationRequestBody;
  setForm: (patch: Partial<RegistrationRequestBody>) => void;
  setField: <K extends keyof RegistrationRequestBody>(
    key: K,
    value: RegistrationRequestBody[K]
  ) => void;
  submitting: boolean;
  submitError: string | null;
  submit: () => Promise<void>;
  reset: () => void;
};

const RegistrationFormContext = createContext<
  RegistrationFormContextValue | undefined
>(undefined);

export function RegistrationFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [form, setFormState] = useState<RegistrationRequestBody>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setForm = useCallback((patch: Partial<RegistrationRequestBody>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setField = useCallback(
    <K extends keyof RegistrationRequestBody>(
      key: K,
      value: RegistrationRequestBody[K]
    ) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setFormState(defaultForm);
    setSubmitError(null);
  }, []);

  const submit = useCallback(async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await submitRegistration(form);
      if (!res.success) {
        setSubmitError(res.message);
        return;
      }
      const snap: ConfirmationSnapshot = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        clinicName: form.clinicName,
        noi: form.noi,
        registrationId: res.data.registrationId,
        submittedAt: res.data.submittedAt,
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(snap));
      }
      router.push('/registration-form/confirmation');
    } catch {
      setSubmitError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  const value = useMemo(
    () => ({
      form,
      setForm,
      setField,
      submitting,
      submitError,
      submit,
      reset,
    }),
    [form, setForm, setField, submitting, submitError, submit, reset]
  );

  return (
    <RegistrationFormContext.Provider value={value}>
      {children}
    </RegistrationFormContext.Provider>
  );
}

export function useRegistrationForm() {
  const ctx = useContext(RegistrationFormContext);
  if (!ctx) {
    throw new Error(
      'useRegistrationForm must be used within RegistrationFormProvider'
    );
  }
  return ctx;
}
export type { RoyalCaninClubAnswer, PetTypeOption, ScrubSize };
