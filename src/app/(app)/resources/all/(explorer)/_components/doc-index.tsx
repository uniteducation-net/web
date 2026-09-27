import Link from "next/link";
import type { ResourceDocMeta } from "@/lib/resources-graph";

/**
 * Server-rendered index of every resource doc, grouped by top-level folder.
 * The interactive explorer above keeps folders collapsed and previews files
 * in place, so this always-present link list is what gives crawlers and AI
 * agents a real anchor to every `/resources/all/<doc>` page. Rendered as a
 * disclosure so the visual explorer experience stays untouched.
 */
export function DocIndex({ docs }: { docs: ResourceDocMeta[] }) {
  const groups = new Map<string, ResourceDocMeta[]>();
  for (const doc of docs) {
    const group = groups.get(doc.topFolder);
    if (group) group.push(doc);
    else groups.set(doc.topFolder, [doc]);
  }
  const sorted = [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  return (
    <details className="container max-w-5xl py-10 font-text">
      <summary className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
        Index of all {docs.length} documents
      </summary>
      <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map(([folder, folderDocs]) => (
          <section key={folder}>
            <h2 className="font-heading text-lg text-secondary">
              {folder === "_root" ? "General" : folder}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {folderDocs.map((doc) => (
                <li key={doc.path}>
                  <Link
                    href={doc.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
