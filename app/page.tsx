import { SiteNav } from '@/components/site-nav';
import { Hero } from '@/components/hero';
import { DuoFinder } from '@/components/duo-finder';
import { HowItWorks } from '@/components/how-it-works';
import { SiteFooter } from '@/components/site-footer';
import { TipJar } from '@/components/tip-jar';

export default function Page() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <DuoFinder>
          <HowItWorks />
        </DuoFinder>
        <TipJar />
      </main>
      <SiteFooter />
    </>
  );
}
