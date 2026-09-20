import type { Metadata } from "next";
import { getResourcesSnapshot } from "@/lib/resources-graph";
import { ResourcesExplorer } from "./_components/resources-explorer";

// The explorer renders from the shared repo snapshot. The page is dynamic
// (the snapshot's GitHub reads go through uncached/octokit fetch by design)
// but cheap: freshness is owned by the snapshot's module cache (5 min TTL,
// tarball re-downloaded only on real repo changes) — renders after the first
// hit are in-memory.

export const metadata: Metadata = {
  title: "All resources",
  description:
    "Every approved UnitEd teaching resource as an interactive graph — browse the tree, follow the links between resources.",
};

export default async function ResourcesAllPage() {
  const state = await getResourcesSnapshot();
  return <ResourcesExplorer state={state} />;
}
