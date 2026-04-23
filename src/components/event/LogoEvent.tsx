import Image from 'next/image';

export function LogoEvent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex select-none flex-col items-center [-webkit-touch-callout:none] ${className}`}
      aria-label='Royal Canin'
      onContextMenu={(e) => e.preventDefault()}>
      <Image
        src='/assets/logo-vs-center.png'
        alt='Vet Symposium 2026'
        width={1024}
        height={391}
        className='h-auto w-[min(450px,80vw)] object-contain'
        priority
        sizes='(max-width: 640px) 80vw, 450px'
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
