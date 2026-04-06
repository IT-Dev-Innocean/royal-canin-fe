import Image from 'next/image';

export function RoyalCaninLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center ${className}`}
      aria-label='Royal Canin'>
      <Image
        src='/assets/rc-logo.svg'
        alt='Royal Canin'
        width={1024}
        height={391}
        className='h-auto w-[min(200px,88vw)] object-contain'
        priority
        sizes='(max-width: 640px) 88vw, 200px'
      />
    </div>
  );
}
