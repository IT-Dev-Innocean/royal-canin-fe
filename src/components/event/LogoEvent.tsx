import Image from 'next/image';

export function LogoEvent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center ${className}`}
      aria-label='Royal Canin'>
      <Image
        src='/assets/logo-vs-center.png'
        alt='Vet Symposium 2026'
        width={1024}
        height={391}
        className='h-auto w-[min(450px,80vw)] object-contain'
        priority
        sizes='(max-width: 640px) 80vw, 450px'
      />
    </div>
  );
}
