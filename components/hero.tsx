import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export function Hero() {
  return (
    <section id="top" className="overflow-hidden bg-background pt-14 md:pt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center">
        <p className="rise text-lg font-semibold text-muted-foreground md:text-xl">iPhone Duo</p>
        <h1 className="rise mt-2 text-balance text-5xl font-semibold tracking-tight md:text-7xl [animation-delay:80ms]">
          Sold out? Found.
        </h1>
        <p className="rise mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl [animation-delay:160ms]">
          findmyduo watches every Apple Store near you and tells you the moment a Duo is ready for pickup or 2-hour
          delivery.
        </p>
        <div className="rise mt-7 flex flex-wrap items-center justify-center gap-6 [animation-delay:240ms]">
          <a
            href="#find"
            className="rounded-full bg-primary px-6 py-3 text-[17px] font-normal text-primary-foreground transition-opacity hover:opacity-90"
          >
            Find my Duo
          </a>
          <a href="#alerts" className="group flex items-center gap-0.5 text-[17px] text-primary">
            Get stock alerts
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
        <div className="rise relative mt-10 w-full max-w-3xl md:mt-12 [animation-delay:360ms]">
          <Image
            src="/images/duo-night-sky.png"
            alt="iPhone Duo in Night Sky, shown folded and unfolded"
            width={940}
            height={1112}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="-my-[12%] h-auto w-full"
          />
        </div>
        <p className="mb-16 text-sm text-muted-foreground md:mb-20">From {'$'}2,199. Star White and Night Sky.</p>
      </div>
    </section>
  );
}
