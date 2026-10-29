import { TRACKER_REPO_URL } from '@/lib/duo';

export function SiteFooter() {
  return (
    <footer className="bg-secondary">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 border-t border-border px-5 py-8 text-xs leading-relaxed text-muted-foreground">
        <p>
          findmyduo is an independent project and is not affiliated with, endorsed by, or sponsored by Apple Inc.
          iPhone and Apple Store are trademarks of Apple Inc. Prices shown are Apple Canada list prices in CAD.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>findmyduo</p>
          <a href={TRACKER_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
            Open source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
