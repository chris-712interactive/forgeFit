import Link from "next/link";
import type { LegalLink, LegalSection } from "@/lib/legal/copy";

interface LegalDocumentProps {
  title: string;
  updated: string;
  sections: readonly LegalSection[];
}

function sectionAnchor(section: LegalSection): string {
  if (section.id) return section.id;
  return section.heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LegalDocument({ title, updated, sections }: LegalDocumentProps) {
  return (
    <div className="min-h-dvh bg-forge-surface px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-forge-steel">
          ← Back
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold text-forge-text">
          {title}
        </h1>
        <p className="mt-2 text-sm text-forge-muted">Last updated {updated}</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.heading} id={sectionAnchor(section)}>
              <h2 className="font-display text-lg font-semibold text-forge-text">
                {section.heading}
              </h2>
              <div className="mt-2 space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-forge-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.links && section.links.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {section.links.map((link: LegalLink) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-forge-steel hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <LegalFooter className="mt-10" />
      </div>
    </div>
  );
}

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-forge-muted ${className}`}>
      <Link href="/privacy" className="font-medium text-forge-steel hover:underline">
        Privacy Policy
      </Link>
      {" · "}
      <Link href="/terms" className="font-medium text-forge-steel hover:underline">
        Terms of Use
      </Link>
    </p>
  );
}
