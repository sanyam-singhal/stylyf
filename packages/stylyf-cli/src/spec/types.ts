export type AppKind = "internal-tool" | "cms-site" | "free-saas-tool";
export type BackendMode = "portable" | "hosted";
export type MediaMode = "none" | "basic" | "rich";
export type ActorKind = "public" | "user" | "member" | "admin" | "editor" | "owner";
export type FieldType =
  | "short-text"
  | "long-text"
  | "rich-text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "status"
  | "slug"
  | "json";
export type FlowKind = "crud" | "approval" | "publishing" | "onboarding" | "saved-results";
export type SurfaceKind =
  | "dashboard"
  | "list"
  | "detail"
  | "create"
  | "edit"
  | "settings"
  | "landing"
  | "content-index"
  | "content-detail"
  | "tool";

export type ActorSpec = {
  name: string;
  kind?: ActorKind;
  description?: string;
};

export type FieldSpec = {
  name: string;
  label?: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  options?: string[];
};

export type MediaAttachmentSpec = {
  name: string;
  kind?: "file" | "image" | "video" | "audio" | "document";
  multiple?: boolean;
  required?: boolean;
};

export type ObjectSpec = {
  name: string;
  label?: string;
  purpose?: string;
  ownership?: "none" | "user" | "workspace";
  visibility?: "private" | "public" | "mixed";
  fields?: FieldSpec[];
  media?: MediaAttachmentSpec[];
};

export type FlowSpec = {
  name: string;
  object: string;
  kind: FlowKind;
  states?: string[];
  transitions?: Array<{
    name: string;
    from: string | string[];
    to: string;
    actor?: string;
  }>;
};

export type SurfaceSpec = {
  name: string;
  kind: SurfaceKind;
  object?: string;
  path?: string;
  audience?: "public" | "user" | "admin" | "editor";
};

export type StylyfSpecV04 = {
  version: "0.4";
  app: {
    name: string;
    kind: AppKind;
    description?: string;
  };
  backend: {
    mode: BackendMode;
    portable?: {
      database?: "sqlite" | "postgres";
    };
  };
  media?: {
    mode: MediaMode;
  };
  experience?: {
    theme?: "amber" | "emerald" | "pearl" | "opal";
    mode?: "light" | "dark" | "system";
    density?: "compact" | "comfortable" | "relaxed";
    spacing?: "tight" | "balanced" | "airy";
    radius?: "edge" | "trim" | "soft" | "mellow";
  };
  actors?: ActorSpec[];
  objects?: ObjectSpec[];
  flows?: FlowSpec[];
  surfaces?: SurfaceSpec[];
};
