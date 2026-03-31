"use client";

import { useRegistrationForm } from "@/context/RegistrationFormContext";

export function PrivacySection() {
  const { form, setField } = useRegistrationForm();

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-4 py-5"
      aria-labelledby="privacy-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "repeating-radial-gradient(circle at 30% 20%, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 12px)",
        }}
      />
      <div className="relative">
        <h2
          id="privacy-heading"
          className="mb-4 text-center text-base font-bold text-[#e2001a]"
        >
          PERNYATAAN PRIVASI KAMI
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-800">
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              checked={form.agreedToPrivacy}
              onChange={(e) => setField("agreedToPrivacy", e.target.checked)}
              className="rc-checkbox mt-1"
            />
            <span>
              Saya menyetujui untuk memberikan informasi saya kepada Royal Canin
              Indonesia. Untuk perubahan data registrasi dapat menghubungi{" "}
              <a
                href="tel:+6281313141546"
                className="font-medium text-[#e2001a] underline"
              >
                +62-813-1314-1546
              </a>
              . Kebijakan privasi:{" "}
              <a
                href="https://www.mars.com/privacy-policy-indonesian"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#e2001a] underline"
              >
                www.mars.com/privacy-policy-indonesian
              </a>
              .
            </span>
          </label>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              checked={form.agreedToAdminOnly}
              onChange={(e) => setField("agreedToAdminOnly", e.target.checked)}
              className="rc-checkbox mt-1"
            />
            <span>
              Saya memahami bahwa data pribadi yang saya berikan hanya digunakan
              untuk keperluan administrasi acara ini.
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
