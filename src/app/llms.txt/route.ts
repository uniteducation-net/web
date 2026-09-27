import { getResourcesSnapshot } from "@/lib/resources-graph";
import { siteName, siteUrl } from "@/lib/site";

// Served from a route handler (not public/) so the resource list stays live
// with the repo snapshot; the proxy matcher skips paths with an extension,
// so /llms.txt never gets locale-redirected. Dynamic so a GitHub hiccup at
// build time can't freeze an empty doc list.
export const dynamic = "force-dynamic";

export async function GET() {
  const lines: string[] = [
    `# ${siteName}`,
    "",
    `> ${siteName} is a nonprofit building free training resources for educators — an open teaching-resources collection plus a personalized learning platform for people who teach without formal pedagogical training.`,
    "",
    "The site is available in English (/en) and German (/de — same paths, German content). All teaching resources are public and server-rendered under /resources/all/<path>.",
    "",
    "## Main site (English — German mirrors under /de)",
    "",
    `- [Home](${siteUrl}/en): Free training resources for educators.`,
    `- [About](${siteUrl}/en/about): What UnitEd is building and why it matters.`,
    `- [Team](${siteUrl}/en/team): The volunteer team behind UnitEd.`,
    `- [Updates](${siteUrl}/en/updates): News, recaps, and notes from the team.`,
    `- [Events](${siteUrl}/en/events): Upcoming and past community events.`,
    `- [Get involved](${siteUrl}/en/get-involved): Volunteer, partner, membership, donate, share knowledge.`,
    `- [Terms & policies](${siteUrl}/en/terms): Impressum, privacy, terms of service, licensing, community guidelines.`,
    "",
    "## Open teaching resources",
    "",
    `- [Resources overview](${siteUrl}/resources): Personalized advice for new teachers and the open resource graph.`,
    `- [All resources](${siteUrl}/resources/all): Explorer plus a full index linking every document.`,
  ];

  const snapshot = await getResourcesSnapshot();
  if (snapshot.status === "ready") {
    lines.push("", "### Documents", "");
    for (const doc of snapshot.data.docs) {
      const suffix = doc.excerpt ? `: ${doc.excerpt}` : "";
      lines.push(`- [${doc.title}](${siteUrl}${doc.href})${suffix}`);
    }
  }

  lines.push(
    "",
    "## Full content dump",
    "",
    `- [llms-full.txt](${siteUrl}/llms-full.txt): All site content (updates, team, events, terms, both locales) as markdown, plus the resource document index.`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
