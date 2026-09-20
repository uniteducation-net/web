import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getResourceDocument,
  linkifyResourceWikilinks,
} from "@/lib/resources-graph";
import { MarkdownView } from "./_components/markdown-view";

// Full-document reader for one repo file, served from the same shared
// snapshot as the explorer (zero per-file API calls). Dynamic rendering —
// freshness comes from the snapshot's module cache, same as the explorer.

/** URL segments → repo path ("a/b/c" → "a/b/c.md"), or null to 404. */
function toRepoPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((s) => !s || s === "." || s === ".." || s.includes("\\")))
    return null;
  const joined = segments.join("/").replace(/^\/+/, "");
  if (!joined) return null;
  return joined.toLowerCase().endsWith(".md") ? joined : `${joined}.md`;
}

async function load(pathPromise: Promise<{ path: string[] }>) {
  const { path } = await pathPromise;
  const repoPath = toRepoPath(path);
  if (repoPath === null) return null;
  return getResourceDocument(repoPath);
}

export async function generateMetadata({
  params,
}: PageProps<"/resources/all/[...path]">): Promise<Metadata> {
  const doc = await load(params);
  if (!doc || doc.status !== "ready") return {}; // layout default
  return { title: doc.meta.title, description: doc.meta.excerpt };
}

export default async function ResourceDocPage({
  params,
}: PageProps<"/resources/all/[...path]">) {
  const doc = await load(params);

  // GitHub hiccup is not "page doesn't exist" — render a retryable notice
  // (a 404 here would be sticky-cached and outlive the outage).
  if (doc && doc.status === "unavailable") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="font-heading text-heading text-secondary">
          Resources are temporarily unavailable
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The resource library can&apos;t be reached right now — please try
          again shortly.
        </p>
        <Link
          href="/resources/all"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All resources
        </Link>
      </div>
    );
  }

  if (!doc || doc.status !== "ready") notFound();

  const linked = await linkifyResourceWikilinks(doc.content);
  const focusParam = encodeURIComponent(doc.meta.path);
  const crumbs = doc.meta.folder ? doc.meta.folder.split("/") : [];

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href={`/resources/all?focus=${focusParam}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All resources
      </Link>

      {crumbs.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {crumbs.join(" / ")}
        </p>
      )}
      <h1 className="mt-1 font-heading text-title text-secondary">
        {doc.meta.title}
      </h1>

      <article className="prose prose-neutral mt-6 max-w-none font-text dark:prose-invert">
        <MarkdownView content={linked} />
      </article>
    </div>
  );
}
