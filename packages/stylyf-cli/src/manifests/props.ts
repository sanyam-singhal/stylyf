import type { LayoutNodeId } from "../compiler/generated-app.js";

export type CompositionPropType = "string" | "number" | "boolean" | "enum" | "jsx" | "json";

export type CompositionPropContract = {
  name: string;
  type: CompositionPropType;
  aliases?: string[];
  default?: string | number | boolean;
  description: string;
  example?: string | number | boolean;
  required?: boolean;
  values?: Array<string | number | boolean>;
};

export type CompositionContract = {
  id: string;
  kind: "layout" | "component";
  props: readonly CompositionPropContract[];
  requiredProps: readonly string[];
  compositionExamples: readonly string[];
};

type SourcePropContract = {
  type: CompositionPropType;
  required: boolean;
  values?: Array<string | number | boolean>;
};

const gapValues = ["tight", "comfortable", "loose"] as const;
const alignValues = ["start", "center", "stretch"] as const;

export const layoutPropContracts = {
  stack: {
    id: "stack",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized vertical spacing between children.",
        example: "comfortable",
      },
      {
        name: "align",
        type: "enum",
        values: [...alignValues],
        default: "stretch",
        description: "Cross-axis alignment for stacked children.",
        example: "stretch",
      },
    ],
    compositionExamples: ['{ "layout": "stack", "props": { "gap": "comfortable" }, "children": ["page-header"] }'],
  },
  row: {
    id: "row",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized horizontal spacing between children.",
        example: "tight",
      },
      {
        name: "align",
        type: "enum",
        values: ["start", "center", "end", "stretch"],
        default: "center",
        description: "Cross-axis alignment for row children.",
        example: "center",
      },
      {
        name: "justify",
        type: "enum",
        values: ["start", "center", "end", "between"],
        default: "start",
        description: "Main-axis distribution for row children.",
        example: "between",
      },
      {
        name: "wrap",
        type: "boolean",
        default: false,
        description: "Whether row children may wrap onto multiple lines.",
        example: true,
      },
    ],
    compositionExamples: ['{ "layout": "row", "props": { "gap": "tight", "justify": "between", "wrap": true }, "children": ["button"] }'],
  },
  column: {
    id: "column",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized vertical spacing inside the column.",
        example: "comfortable",
      },
      {
        name: "align",
        type: "enum",
        values: [...alignValues],
        default: "stretch",
        description: "Cross-axis alignment for column children.",
        example: "stretch",
      },
      {
        name: "width",
        type: "enum",
        values: ["auto", "full", "narrow", "prose"],
        default: "full",
        description: "Width constraint applied to the column wrapper.",
        example: "full",
      },
    ],
    compositionExamples: ['{ "layout": "column", "props": { "width": "prose" }, "children": ["text-field"] }'],
  },
  grid: {
    id: "grid",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "cols",
        aliases: ["columns"],
        type: "enum",
        values: [1, 2, 3, 4],
        default: 2,
        description: "Responsive column count. Use `cols`; `columns` is an explicit documented alias.",
        example: 2,
      },
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized spacing between grid cells.",
        example: "comfortable",
      },
      {
        name: "min",
        type: "enum",
        values: ["none", "panel", "card", "metric"],
        default: "none",
        description: "Auto-fit minimum cell recipe. When set, it takes precedence over `cols`.",
        example: "card",
      },
    ],
    compositionExamples: ['{ "layout": "grid", "props": { "cols": 3, "gap": "comfortable" }, "children": ["stat-card"] }'],
  },
  split: {
    id: "split",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "ratio",
        type: "enum",
        values: ["1:1", "2:1", "3:1"],
        default: "2:1",
        description: "Desktop column ratio between main and side content.",
        example: "2:1",
      },
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized spacing between split panes.",
        example: "comfortable",
      },
      {
        name: "side",
        type: "jsx",
        description: "Optional JSX side pane. Prefer generated route wrappers over raw JSON for complex side content.",
      },
    ],
    compositionExamples: ['{ "layout": "split", "props": { "ratio": "2:1" }, "children": ["data-table-shell"] }'],
  },
  panel: {
    id: "panel",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "as",
        type: "enum",
        values: ["div", "section"],
        default: "section",
        description: "Rendered HTML element.",
        example: "section",
      },
      {
        name: "padding",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Tokenized internal padding recipe.",
        example: "comfortable",
      },
      {
        name: "tone",
        type: "enum",
        values: ["default", "inset", "elevated"],
        default: "default",
        description: "Surface tone for the panel frame.",
        example: "default",
      },
    ],
    compositionExamples: ['{ "layout": "panel", "props": { "tone": "elevated" }, "children": ["section-header"] }'],
  },
  section: {
    id: "section",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "heading",
        type: "jsx",
        description: "Optional section heading content.",
        example: "Overview",
      },
      {
        name: "description",
        type: "jsx",
        description: "Optional supporting copy beneath the heading.",
        example: "Monitor the latest activity.",
      },
      {
        name: "gap",
        type: "enum",
        values: [...gapValues],
        default: "comfortable",
        description: "Vertical rhythm between section children.",
        example: "comfortable",
      },
    ],
    compositionExamples: ['{ "layout": "section", "props": { "heading": "Overview" }, "children": ["stat-grid"] }'],
  },
  toolbar: {
    id: "toolbar",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "align",
        type: "enum",
        values: ["start", "center", "end", "stretch"],
        default: "center",
        description: "Cross-axis alignment for toolbar controls.",
        example: "center",
      },
      {
        name: "sticky",
        type: "boolean",
        default: false,
        description: "Whether the toolbar sticks below the app header.",
        example: true,
      },
      {
        name: "wrap",
        type: "boolean",
        default: true,
        description: "Whether toolbar children may wrap.",
        example: true,
      },
    ],
    compositionExamples: ['{ "layout": "toolbar", "props": { "wrap": true }, "children": ["filter-toolbar"] }'],
  },
  "content-frame": {
    id: "content-frame",
    kind: "layout",
    requiredProps: [],
    props: [
      {
        name: "width",
        type: "enum",
        values: ["narrow", "prose", "wide", "full"],
        default: "wide",
        description: "Maximum content width recipe.",
        example: "wide",
      },
    ],
    compositionExamples: ['{ "layout": "content-frame", "props": { "width": "wide" }, "children": ["page-header"] }'],
  },
} as const satisfies Record<LayoutNodeId, CompositionContract>;

function normalizeParamName(value: string) {
  return value
    .replace(/\/.*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

function componentParamToPropContract(value: string, source: "style" | "state"): CompositionPropContract | null {
  const name = normalizeParamName(value);
  if (!name || name.length > 48) {
    return null;
  }

  return {
    name,
    type: source === "state" ? "boolean" : "string",
    description:
      source === "state"
        ? `State parameter surfaced by the source-owned registry inventory: ${value}.`
        : `Style parameter surfaced by the source-owned registry inventory: ${value}.`,
  };
}

function literalValuesFromSource(typeSource: string) {
  const values: Array<string | number | boolean> = [];
  const normalized = typeSource.trim();
  for (const match of normalized.matchAll(/"([^"]+)"|'([^']+)'|\b(true|false)\b|\b(-?\d+(?:\.\d+)?)\b/g)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (raw === undefined) continue;
    if (raw === "true" || raw === "false") {
      values.push(raw === "true");
    } else if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
      values.push(Number(raw));
    } else {
      values.push(raw);
    }
  }
  return values;
}

function propContractFromSource(typeSource: string, required: boolean): SourcePropContract {
  const normalized = typeSource.trim();
  const literalValues = literalValuesFromSource(normalized);
  const values = literalValues.length > 0 ? [...new Set(literalValues)] : undefined;
  if (/^(number|[0-9]+(?:\s*\|\s*[0-9]+)*)\b/.test(normalized)) return { type: "number", required, values };
  if (/^boolean\b/.test(normalized)) return { type: "boolean", required, values };
  if (/JSX\.Element|ParentProps|children/i.test(normalized)) return { type: "jsx", required };
  if (/^\{|\[\]|Array<|Record<|ReadonlyArray</.test(normalized)) return { type: "json", required };
  if (values && values.length > 0 && !normalized.includes("string")) return { type: "enum", required, values };
  return { type: "string", required };
}

function sourcePropTypes(source?: string) {
  const types = new Map<string, SourcePropContract>();
  if (!source) return types;

  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const match of withoutComments.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*(\?)?\s*:\s*([^;\n]+);/gm)) {
    const [, name, optionalMarker, typeSource] = match;
    if (!name || !typeSource || name === "class") continue;
    types.set(name, propContractFromSource(typeSource, optionalMarker !== "?"));
  }

  return types;
}

export function componentPropContractsFromInventory(item: {
  styleParams: string[];
  stateParams: string[];
}, source?: string): CompositionPropContract[] {
  const byName = new Map<string, CompositionPropContract>();
  const exactSourceTypes = sourcePropTypes(source);

  for (const param of item.styleParams) {
    const contract = componentParamToPropContract(param, "style");
    if (contract) {
      byName.set(contract.name, contract);
    }
  }

  for (const param of item.stateParams) {
    const contract = componentParamToPropContract(param, "state");
    if (contract) {
      byName.set(contract.name, contract);
    }
  }

  return [...byName.values()].map(contract => {
    const sourceContract = exactSourceTypes.get(contract.name);
    if (!sourceContract) return contract;
    return {
      ...contract,
      type: sourceContract.type,
      required: (contract.required ?? sourceContract.required) ? true : undefined,
      values: sourceContract.values ?? contract.values,
    };
  });
}
