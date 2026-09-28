/**
 * Demo data: 1 ADMIN, 2 STUDENTS and 3 lessons (text; text + YouTube; text + YouTube + PDF),
 * each in Portuguese and Bengali. Fictitious content only. Safe to run more than once:
 * existing users (by e-mail) and lessons (by slug) are left untouched.
 *
 *   npm run db:seed
 */
import "./env";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lesson, lessonResource, lessonTranslation, user } from "@/db/schema";
import type { RichTextDoc, RichTextNode } from "@/lib/content/rich-text";
import type { Locale } from "@/lib/i18n/config";
import { createUserWithPassword } from "@/lib/users/credentials";
import { canonicalYouTubeUrl } from "@/lib/youtube";

// ---------------------------------------------------------------- content helpers

const text = (value: string): RichTextNode => ({ type: "text", text: value });
const bold = (value: string): RichTextNode => ({ type: "text", text: value, marks: [{ type: "bold" }] });
const p = (...children: Array<string | RichTextNode>): RichTextNode => ({
  type: "paragraph",
  content: children.map((child) => (typeof child === "string" ? text(child) : child)),
});
const h2 = (value: string): RichTextNode => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const list = (type: "bulletList" | "orderedList", items: string[]): RichTextNode => ({
  type,
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
const quote = (value: string): RichTextNode => ({ type: "blockquote", content: [p(value)] });
const doc = (...content: RichTextNode[]): RichTextDoc => ({ type: "doc", content });

type SeedLesson = {
  slug: string;
  order: number;
  youtubeId?: string;
  pdf?: boolean;
  translations: Record<Locale, { title: string; summary: string; content: RichTextDoc }>;
};

// Open movies from the Blender Foundation, used only as placeholder videos.
const lessons: SeedLesson[] = [
  {
    slug: "boas-vindas",
    order: 1,
    translations: {
      "pt-BR": {
        title: "Boas-vindas à mentoria",
        summary: "Como a mentoria funciona e como aproveitar melhor cada aula.",
        content: doc(
          p("Que bom ter você aqui! Esta área reúne todo o conteúdo da mentoria em um só lugar."),
          h2("O que você vai encontrar"),
          list("bulletList", ["Aulas em texto para ler no seu ritmo", "Vídeos curtos com exemplos", "Materiais em PDF para baixar"]),
          p(bold("Dica: "), "reserve um horário fixo na semana para estudar."),
        ),
      },
      "bn-BD": {
        title: "মেন্টরশিপে স্বাগতম",
        summary: "মেন্টরশিপ কীভাবে চলে এবং প্রতিটি ক্লাস থেকে কীভাবে সবচেয়ে বেশি শিখবেন।",
        content: doc(
          p("আপনাকে এখানে পেয়ে আমরা আনন্দিত! মেন্টরশিপের সব কনটেন্ট এক জায়গায় পাবেন।"),
          h2("আপনি যা পাবেন"),
          list("bulletList", ["নিজের গতিতে পড়ার জন্য লেখা পাঠ", "উদাহরণসহ ছোট ভিডিও", "ডাউনলোড করার জন্য পিডিএফ উপকরণ"]),
          p(bold("পরামর্শ: "), "প্রতি সপ্তাহে পড়াশোনার জন্য একটি নির্দিষ্ট সময় রাখুন।"),
        ),
      },
    },
  },
  {
    slug: "planejando-seu-conteudo",
    order: 2,
    youtubeId: "aqz-KE-bpKQ",
    translations: {
      "pt-BR": {
        title: "Planejando seu conteúdo",
        summary: "Um método simples para decidir o que publicar a cada semana.",
        content: doc(
          p("Antes de gravar, vale definir para quem é o conteúdo e qual problema ele resolve."),
          h2("Três perguntas antes de começar"),
          list("orderedList", ["Quem vai assistir?", "O que a pessoa aprende?", "Qual é o próximo passo dela?"]),
          quote("Constância vale mais do que perfeição."),
        ),
      },
      "bn-BD": {
        title: "আপনার কনটেন্ট পরিকল্পনা",
        summary: "প্রতি সপ্তাহে কী প্রকাশ করবেন তা ঠিক করার একটি সহজ পদ্ধতি।",
        content: doc(
          p("রেকর্ড করার আগে ঠিক করুন কনটেন্টটি কার জন্য এবং এটি কোন সমস্যার সমাধান করে।"),
          h2("শুরু করার আগে তিনটি প্রশ্ন"),
          list("orderedList", ["কে দেখবে?", "দর্শক কী শিখবে?", "তার পরবর্তী পদক্ষেপ কী?"]),
          quote("নিখুঁত হওয়ার চেয়ে নিয়মিত থাকা বেশি গুরুত্বপূর্ণ।"),
        ),
      },
    },
  },
  {
    slug: "rotina-de-gravacao",
    order: 3,
    youtubeId: "eRsGyueVLvQ",
    pdf: true,
    translations: {
      "pt-BR": {
        title: "Rotina de gravação",
        summary: "Organize a gravação em blocos e use o checklist em PDF.",
        content: doc(
          p("Gravar vários vídeos no mesmo dia economiza tempo de preparação."),
          h2("Checklist rápido"),
          list("bulletList", ["Luz de frente para o rosto", "Ambiente silencioso", "Roteiro em tópicos"]),
          p("Baixe o checklist completo nos materiais desta aula."),
        ),
      },
      "bn-BD": {
        title: "রেকর্ডিং রুটিন",
        summary: "রেকর্ডিংকে ভাগে ভাগে সাজান এবং পিডিএফ চেকলিস্ট ব্যবহার করুন।",
        content: doc(
          p("একই দিনে কয়েকটি ভিডিও রেকর্ড করলে প্রস্তুতির সময় বাঁচে।"),
          h2("দ্রুত চেকলিস্ট"),
          list("bulletList", ["মুখের সামনে আলো", "শান্ত পরিবেশ", "পয়েন্ট আকারে স্ক্রিপ্ট"]),
          p("এই ক্লাসের উপকরণ থেকে সম্পূর্ণ চেকলিস্টটি ডাউনলোড করুন।"),
        ),
      },
    },
  },
];

// ---------------------------------------------------------------- tiny PDF

/** Builds a valid one-page PDF (ASCII only) with a correct xref table. */
function buildPdf(lines: string[]): Buffer {
  const escape = (value: string) => value.replace(/[\\()]/g, (char) => `\\${char}`);
  const stream = ["BT", "/F1 16 Tf", "72 760 Td", "22 TL", ...lines.map((line) => `(${escape(line)}) Tj T*`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "ascii");
}

// ---------------------------------------------------------------- seeding

async function ensureUser(input: Parameters<typeof createUserWithPassword>[1]) {
  const email = input.email.toLowerCase();
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    console.log(`  = ${input.role.padEnd(7)} ${email} (já existe)`);
    return existing.id;
  }
  const id = await createUserWithPassword(db, input);
  console.log(`  + ${input.role.padEnd(7)} ${email}`);
  return id;
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("Defina SEED_ADMIN_PASSWORD (mínimo 8 caracteres) em .env.local antes de rodar o seed.");
  }
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "aluno-demo-123";

  console.log("Usuários");
  const adminId = await ensureUser({
    name: process.env.SEED_ADMIN_NAME || "Administrador",
    email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
    password: adminPassword,
    role: "ADMIN",
    preferredLocale: "pt-BR",
  });
  await ensureUser({
    name: "Aluno Demonstração",
    email: "aluno.pt@example.com",
    password: studentPassword,
    role: "STUDENT",
    preferredLocale: "pt-BR",
  });
  await ensureUser({
    name: "Rahim Demo",
    email: "aluno.bn@example.com",
    password: studentPassword,
    role: "STUDENT",
    preferredLocale: "bn-BD",
  });

  console.log("Aulas");
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  for (const item of lessons) {
    const [existing] = await db.select({ id: lesson.id }).from(lesson).where(eq(lesson.slug, item.slug)).limit(1);
    if (existing) {
      console.log(`  = ${item.slug} (já existe)`);
      continue;
    }

    const lessonId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(lesson)
        .values({
          slug: item.slug,
          order: item.order,
          status: "PUBLISHED",
          publishedAt: new Date(),
          youtubeUrl: item.youtubeId ? canonicalYouTubeUrl(item.youtubeId) : null,
          createdBy: adminId,
        })
        .returning({ id: lesson.id });
      await tx.insert(lessonTranslation).values(
        (Object.entries(item.translations) as Array<[Locale, SeedLesson["translations"][Locale]]>).map(
          ([locale, translation]) => ({ lessonId: created.id, locale, ...translation }),
        ),
      );
      return created.id;
    });
    console.log(`  + ${item.slug}`);

    if (!item.pdf) continue;
    if (!blobToken) {
      console.warn("    ! BLOB_READ_WRITE_TOKEN ausente: PDF de exemplo não enviado.");
      continue;
    }
    const file = buildPdf(["Creator Academy", "Checklist de gravacao / Recording checklist", "", "[ ] Luz / Light", "[ ] Som / Sound", "[ ] Roteiro / Script"]);
    const blob = await put(`lessons/${lessonId}/checklist.pdf`, file, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
    });
    await db.insert(lessonResource).values({
      lessonId,
      locale: null,
      name: "checklist-gravacao.pdf",
      blobPath: blob.pathname,
      mimeType: "application/pdf",
      size: file.byteLength,
    });
    console.log("    + PDF compartilhado enviado ao Blob privado");
  }

  console.log("\nPronto. Senha dos alunos de demonstração:", studentPassword);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
