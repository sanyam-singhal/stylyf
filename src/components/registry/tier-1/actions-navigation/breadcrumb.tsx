import { A } from "@solidjs/router";
import { ChevronRight, Ellipsis } from "lucide-solid";
import { children, mergeProps, splitProps } from "solid-js";
import type { JSX, ParentProps } from "solid-js";
import { cn } from "~/lib/cn";

function defaultBreadcrumbChildren() {
  return (
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Collapsed />
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/dashboard-sidebar-simple">App</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Current>Actions &amp; Navigation</Breadcrumb.Current>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  );
}

export type BreadcrumbProps = ParentProps<JSX.HTMLAttributes<HTMLElement> & { label?: string }>;

function BreadcrumbRoot(userProps: BreadcrumbProps) {
  const props = mergeProps({ label: "Breadcrumb" }, userProps);
  const [local, others] = splitProps(props, ["children", "class", "label"]);
  const resolvedChildren = children(() => local.children);

  return (
    <nav
      aria-label={local.label}
      class={cn("w-full text-sm text-muted-foreground", local.class)}
      {...others}
    >
      {resolvedChildren() ?? defaultBreadcrumbChildren()}
    </nav>
  );
}

function BreadcrumbList(props: ParentProps<JSX.HTMLAttributes<HTMLOListElement>>) {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <ol
      class={cn("flex flex-wrap items-center gap-1.5 text-sm", local.class)}
      {...others}
    >
      {local.children}
    </ol>
  );
}

function BreadcrumbItem(props: ParentProps<JSX.HTMLAttributes<HTMLLIElement>>) {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <li class={cn("inline-flex min-w-0 items-center gap-1.5", local.class)} {...others}>
      {local.children}
    </li>
  );
}

type BreadcrumbLinkProps = ParentProps<
  Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    current?: boolean;
    external?: boolean;
    href?: string;
  }
>;

function BreadcrumbLink(userProps: BreadcrumbLinkProps) {
  const props = mergeProps({ href: "/" }, userProps);
  const [local, others] = splitProps(props, ["children", "class", "current", "external", "href"]);
  const className = cn(
    "inline-flex min-w-0 items-center gap-1.5 rounded-[max(calc(var(--radius)-10px),0.45rem)] px-2.5 py-1.5 transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    local.current
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
    local.class,
  );

  if (!local.external && local.href.startsWith("/")) {
    return (
      <A href={local.href} class={className} aria-current={local.current ? "page" : undefined} {...others}>
        {local.children}
      </A>
    );
  }

  return (
    <a
      href={local.href}
      class={className}
      aria-current={local.current ? "page" : undefined}
      rel={local.external ? "noreferrer noopener" : others.rel}
      {...others}
    >
      {local.children}
    </a>
  );
}

function BreadcrumbCurrent(props: ParentProps<JSX.HTMLAttributes<HTMLSpanElement>>) {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <span
      class={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-[max(calc(var(--radius)-10px),0.45rem)] bg-accent px-2.5 py-1.5 font-semibold text-foreground",
        local.class,
      )}
      aria-current="page"
      {...others}
    >
      {local.children}
    </span>
  );
}

function BreadcrumbSeparator(props: JSX.HTMLAttributes<HTMLSpanElement>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <span class={cn("inline-flex items-center text-border", local.class)} aria-hidden="true" {...others}>
      <ChevronRight class="size-3.5" />
    </span>
  );
}

function BreadcrumbCollapsed(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <button
      type="button"
      class={cn(
        "inline-flex size-8 items-center justify-center rounded-[max(calc(var(--radius)-10px),0.45rem)] border border-input/80 bg-background text-muted-foreground transition",
        "hover:border-border hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        local.class,
      )}
      aria-label="Show collapsed breadcrumb items"
      {...others}
    >
      <Ellipsis class="size-4" />
    </button>
  );
}

export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  Collapsed: BreadcrumbCollapsed,
  Current: BreadcrumbCurrent,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  List: BreadcrumbList,
  Separator: BreadcrumbSeparator,
});
