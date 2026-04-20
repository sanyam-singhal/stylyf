import { Check, Copy } from "lucide-solid";
import { createSignal } from "solid-js";
import { cn } from "~/lib/cn";

type CopyButtonProps = {
  class?: string;
  value: string;
};

export function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(props.value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      class={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-panel px-3 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        props.class,
      )}
    >
      {copied() ? <Check class="size-3.5" /> : <Copy class="size-3.5" />}
      <span>{copied() ? "Copied" : "Copy source"}</span>
    </button>
  );
}
