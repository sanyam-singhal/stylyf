import { createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Accordion, type AccordionItem } from "~/components/registry/tier-1/disclosure-overlay/accordion";
import { SearchField } from "~/components/registry/tier-2/form-systems/search-field";
import { cn } from "~/lib/cn";

export type FAQListProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  defaultQuery?: string;
  items?: AccordionItem[];
};

const defaultItems: AccordionItem[] = [
  {
    value: "ownership",
    title: "Does Stylyf ship a package or source files?",
    description: "Distribution model",
    content: <p class="text-sm leading-6 text-muted-foreground">Source files. The registry is intended to be copied, owned, and themed in-repo.</p>,
  },
  {
    value: "theming",
    title: "Can the whole catalog be controlled by global theme tokens?",
    description: "Theming model",
    content: <p class="text-sm leading-6 text-muted-foreground">Yes. Tailwind v4 tokens and app-level presets govern the entire experience.</p>,
  },
  {
    value: "composition",
    title: "How opinionated are the larger compositions?",
    description: "Composition model",
    content: <p class="text-sm leading-6 text-muted-foreground">They stay reusable, but they can still lean into a clear purpose while composing upward from smaller components.</p>,
  },
];

export function FAQList(userProps: FAQListProps) {
  const props = mergeProps(
    {
      defaultQuery: "",
      items: defaultItems,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "defaultQuery", "items"]);
  const [query, setQuery] = createSignal(local.defaultQuery);
  const filteredItems = createMemo(() => {
    const value = query().trim().toLowerCase();
    if (!value) return local.items;

    return local.items.filter(item => {
      const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
      const description = typeof item.description === "string" ? item.description.toLowerCase() : "";
      return title.includes(value) || description.includes(value);
    });
  });

  return (
    <section class={cn("space-y-[var(--space-5)]", local.class)} {...others}>
      <SearchField
        value={query()}
        onValueChange={setQuery}
        placeholder="Search FAQ"
        shortcut="/"
        submitLabel="Filter"
      />
      <Accordion items={filteredItems()} multiple />
    </section>
  );
}
