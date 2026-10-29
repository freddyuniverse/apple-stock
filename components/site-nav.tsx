const LINKS = [
  { href: '#find', label: 'Find' },
  { href: '#how', label: 'How it works' },
  { href: '#alerts', label: 'Alerts' },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <nav aria-label="Main" className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
        <a href="#top" className="text-[17px] font-semibold tracking-tight">
          findmyduo
        </a>
        <ul className="hidden items-center gap-8 text-xs text-foreground/80 sm:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#find"
          className="rounded-full bg-primary px-3.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Find yours
        </a>
      </nav>
    </header>
  );
}
