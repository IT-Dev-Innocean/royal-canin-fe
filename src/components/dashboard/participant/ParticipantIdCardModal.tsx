'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import type { ParticipantDetail } from './types';
import { ParticipantIdCardView } from './ParticipantIdCardView';

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

const PRINT_STYLE_ID = 'participant-id-card-print-styles';

/** Ukuran kertas untuk cetak / Simpan ke PDF (bukan A4). */
const ID_CARD_PAGE_WIDTH = '5.4cm';
const ID_CARD_PAGE_HEIGHT = '8.6cm';

/** DIN Pro dari `public/fonts/dinpro/` — dipakai hanya saat @media print (nama + klinik). */
const DIN_PRO_FAMILY = "'DIN Pro', 'DINPro', ui-sans-serif, system-ui, sans-serif";

const DINPRO_WOFF2_BOLD = '/fonts/dinpro/dinpro-bold.woff2';
const DINPRO_WOFF_BOLD = '/fonts/dinpro/dinpro-bold.woff';
const DINPRO_WOFF2_MEDIUM = '/fonts/dinpro/dinpro-medium.woff2';
const DINPRO_WOFF_MEDIUM = '/fonts/dinpro/dinpro-medium.woff';

function injectPrintStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(PRINT_STYLE_ID)?.remove();
  const el = document.createElement('style');
  el.id = PRINT_STYLE_ID;
  el.textContent = `
    @font-face {
      font-family: 'DIN Pro';
      font-style: normal;
      font-weight: 700;
      font-display: block;
      src: url('${DINPRO_WOFF2_BOLD}') format('woff2'),
           url('${DINPRO_WOFF_BOLD}') format('woff');
    }
    @font-face {
      font-family: 'DIN Pro';
      font-style: normal;
      font-weight: 500;
      font-display: block;
      src: url('${DINPRO_WOFF2_MEDIUM}') format('woff2'),
           url('${DINPRO_WOFF_MEDIUM}') format('woff');
    }
    @media print {
      @page {
        size: ${ID_CARD_PAGE_WIDTH} ${ID_CARD_PAGE_HEIGHT};
        margin: 0;
      }
      /* Jangan kunci lebar html/body ke 5,4cm — di Chrome pratinjau sering jadi 0/putih. @page + kontainer yang sudah diset. */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        border-radius: 0 !important;
      }
      /* Modal di-portal ke <body>, jadi sembunyikan SEMUA anak body lain. */
      body > *:not([data-print-id-card-modal-layer]) {
        display: none !important;
      }
      /* Lepas overlay/positioning saat print supaya isi mengalir di lembar 5,4×8,6 cm. */
      [data-print-id-card-modal-layer],
      [data-print-id-card-modal-panel] {
        position: static !important;
        inset: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        border: 0 !important;
        max-width: none !important;
        max-height: none !important;
        width: ${ID_CARD_PAGE_WIDTH} !important;
        height: ${ID_CARD_PAGE_HEIGHT} !important;
        min-height: 0 !important;
        overflow: hidden !important;
        display: block !important;
        border-radius: 0 !important;
        -webkit-border-radius: 0 !important;
        --tw-ring-width: 0 !important;
        --tw-shadow: 0 0 #0000 !important;
        --tw-shadow-colored: 0 0 #0000 !important;
        clip-path: none !important;
        -webkit-mask: none !important;
        mask: none !important;
      }
      [data-print-id-card-content] {
        position: static !important;
        inset: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        width: ${ID_CARD_PAGE_WIDTH} !important;
        height: ${ID_CARD_PAGE_HEIGHT} !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
        display: block !important;
        border-radius: 0 !important;
        -webkit-border-radius: 0 !important;
        box-shadow: none !important;
        clip-path: none !important;
      }
      [data-print-id-card-modal-panel] > *:not([data-print-id-card-content]) {
        display: none !important;
      }
      #participant-id-card-print-root {
        position: static !important;
        inset: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        width: ${ID_CARD_PAGE_WIDTH} !important;
        height: ${ID_CARD_PAGE_HEIGHT} !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
        display: block !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
        background: transparent !important;
        border-radius: 0 !important;
        -webkit-border-radius: 0 !important;
      }
      #participant-id-card-print-root > * {
        margin: 0 !important;
      }
      #participant-id-card-print-root .id-card-outer {
        box-sizing: border-box !important;
        width: 100% !important;
        max-width: none !important;
        height: 100% !important;
        min-height: ${ID_CARD_PAGE_HEIGHT} !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        border-radius: 0 !important;
      }
      #participant-id-card-print-root .id-card-surface,
      #participant-id-card-print-root .id-card-face {
        box-sizing: border-box !important;
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        max-height: none !important;
        overflow: hidden !important;
        border-radius: 0 !important;
      }
      /* Timpa class Tailwind rounded-* (spesifitas: #id * mengalahkan .rounded-xl) */
      #participant-id-card-print-root * {
        border-radius: 0 !important;
        -webkit-border-radius: 0 !important;
        box-shadow: none !important;
      }
      [data-print-id-card] img,
      [data-print-id-card],
      [data-print-id-card] * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* DIN Pro hanya PDF/cetak: nama (bold) & klinik (medium) — lihat class di ParticipantIdCardView */
      [data-print-id-card] .id-card-print-name,
      #participant-id-card-print-root .id-card-print-name {
        font-family: ${DIN_PRO_FAMILY} !important;
        font-weight: 700 !important;
        -webkit-font-smoothing: antialiased;
      }
      [data-print-id-card] .id-card-print-clinic,
      #participant-id-card-print-root .id-card-print-clinic {
        font-family: ${DIN_PRO_FAMILY} !important;
        font-weight: 500 !important;
        -webkit-font-smoothing: antialiased;
      }
    }
  `;
  document.head.appendChild(el);
}

function removePrintStyles() {
  document.getElementById(PRINT_STYLE_ID)?.remove();
}

export interface ParticipantIdCardModalProps {
  open: boolean;
  onClose: () => void;
  detail: ParticipantDetail | null;
}

function buildQrSrc(d: ParticipantDetail | null): string | null {
  if (!d?.qr_code?.image_path) return null;
  return `${QR_STORAGE_BASE}${d.qr_code.image_path}`;
}

export function ParticipantIdCardModal({
  open,
  onClose,
  detail,
}: ParticipantIdCardModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      injectPrintStyles();
      if (typeof document !== 'undefined' && document.fonts?.load) {
        void Promise.all([
          document.fonts.load("700 12px 'DIN Pro'"),
          document.fonts.load("500 12px 'DIN Pro'"),
        ]).catch(() => {
          /* ignore: cetak masih jatuh kembali ke @font-face */
        });
      }
    }
    return () => {
      removePrintStyles();
    };
  }, [open]);

  if (!open || !detail || !mounted || typeof document === 'undefined') {
    return null;
  }

  const clinic = detail.detail?.clinic_name?.trim() || '—';
  const qrSrc = buildQrSrc(detail);

  const handlePrint = () => {
    window.print();
  };

  const node = (
    <div
      data-print-id-card-modal-layer
      className='fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden'
        onClick={onClose}
        aria-hidden
      />
      <div
        data-print-id-card-modal-panel
        className='relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:overflow-hidden print:rounded-none print:bg-transparent print:shadow-none print:ring-0'>
        <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5 print:hidden'>
          <h3 className='text-base font-bold text-gray-900 sm:text-lg'>
            ID Card
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 cursor-pointer'
            aria-label='Tutup'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <div
          data-print-id-card-content
          className='flex flex-1 flex-col items-center justify-center overflow-y-auto rounded-none px-4 py-4 sm:px-6 sm:py-5 print:overflow-hidden print:rounded-none print:px-0 print:py-0'>
          <div
            id='participant-id-card-print-root'
            className='flex w-full justify-center'>
            <ParticipantIdCardView
              name={detail.name}
              clinic={clinic}
              qrImageSrc={qrSrc}
              qrCodeLabel={
                detail.qr_code?.code
                  ? `QR ${detail.qr_code.code}`
                  : 'Kode peserta'
              }
            />
          </div>
        </div>

        <div className='flex flex-col gap-2 border-t border-gray-100 px-4 py-3 justify-center sm:px-5 print:hidden'>
          <div className='order-1 w-full space-y-1.5 sm:order-2'>
            <button
              type='button'
              onClick={handlePrint}
              className='mx-auto flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-rc-red bg-white py-2.5 text-sm font-bold text-rc-red transition hover:bg-red-50 sm:min-w-[160px]'>
              <Icon icon='mdi:printer' className='h-4 w-4' />
              Cetak ID Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
