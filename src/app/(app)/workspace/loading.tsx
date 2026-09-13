import { Loader } from "@/components/ai-elements/loader";

// Shown while the guard page's repo lookup (a GitHub network call) runs.
export default function WorkspaceLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Loader size={24} className="text-muted-foreground" />
    </div>
  );
}
