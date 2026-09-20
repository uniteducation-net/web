import { Loader } from "@/components/ai-elements/loader";

// Shown while the repo snapshot builds (a cold tarball fetch takes ~1–3 s).
export default function ResourcesAllLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Loader size={24} className="text-muted-foreground" />
    </div>
  );
}
