import type ptBR from "@/messages/pt-BR.json";

export type Messages = typeof ptBR;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Dotted path to any string in the dictionary, e.g. `"admin.students.created"`. */
export type MessageKey = Leaves<Messages>;

type Vars = Record<string, string | number>;

export function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function translate(messages: Messages, key: MessageKey, vars?: Vars): string {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    node = typeof node === "object" && node !== null ? (node as Record<string, unknown>)[part] : undefined;
  }
  return typeof node === "string" ? format(node, vars) : key;
}
