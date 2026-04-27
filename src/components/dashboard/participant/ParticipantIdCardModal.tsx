'use client';

import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { ParticipantDetail } from './types';
import { ParticipantIdCardView } from './ParticipantIdCardView';

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

const PRINT_STYLE_ID = 'participant-id-card-print-styles';

function injectPrintStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(PRINT_STYLE_ID)?.remove();
  const el = document.createElement('style');
  el.id = PRINT_STYLE_ID;
  el.textContent = `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      /*
        Satu halaman: min-h-screen (100vh) + visibility:hidden tetap memakan tinggi
        — paksa batas = tinggi A4, dan batalkan min-height anak.
      */
      html {
        height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        height: 297mm !important;
        min-height: 0 !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* Batalkan min-h-screen (100vh) agar layout tidak "menjulang" ke halaman 2 */
      body * {
        visibility: hidden !important;
        min-height: 0 !important;
      }
      #participant-id-card-print-root,
      #participant-id-card-print-root * {
        visibility: visible !important;
      }
      #participant-id-card-print-root {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 2.5mm 2mm !important;
        background: #fff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #participant-id-card-print-root .id-card-outer {
        box-sizing: border-box !important;
        margin-left: auto !important;
        margin-right: auto !important;
        max-width: 100% !important;
        /* aspect 2/3: h = 1.5w — w ≤ 2/3 × (297mm - padding) */
        max-height: calc(297mm - 4mm) !important;
        width: min(98%, calc((297mm - 4mm) * 2 / 3)) !important;
        flex-shrink: 1 !important;
        overflow: hidden !important;
        min-height: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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
  useEffect(() => {
    if (open) {
      injectPrintStyles();
    }
    return () => {
      removePrintStyles();
    };
  }, [open]);

  if (!open || !detail) {
    return null;
  }

  const clinic = detail.detail?.clinic_name?.trim() || '—';
  const nioRaw = detail.detail?.outlet_number;
  const nio = nioRaw != null ? String(nioRaw) : '—';
  const qrSrc = buildQrSrc(detail);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden'
        onClick={onClose}
        aria-hidden
      />
      <div className='relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:max-w-none print:overflow-visible print:rounded-none print:bg-transparent print:shadow-none'>
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

        <div className='flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 print:overflow-visible print:px-0 print:py-0'>
          <div
            id='participant-id-card-print-root'
            className='flex w-full justify-center print:items-stretch'>
            <ParticipantIdCardView
              name={detail.name}
              clinic={clinic}
              nio={nio}
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
}
