import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const walk = (dir) => {
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(rel);
    return rel;
  });
};

const sourceFiles = walk("src").filter((file) => /\.(js|jsx)$/.test(file));
for (const file of sourceFiles) {
  const text = read(file);
  if (/[Ãâð]/.test(text)) failures.push(`${file}: caracteres d'encodage suspects`);
}

const logoPath = path.join(root, "public", "kaleido-logo.jpg");
if (!fs.existsSync(logoPath) || fs.statSync(logoPath).size < 10_000) {
  failures.push("public/kaleido-logo.jpg: logo absent ou incomplet");
}

const appPro = read("src/AppPro.jsx");
if (!appPro.includes('padding: "0 20px"')) {
  failures.push("src/AppPro.jsx: la zone pro n'a pas le meme cadrage horizontal que le menu");
}

const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  if (/VITE_SUPABASE_URL=.*\/rest\/v1\/?/m.test(envText)) {
    failures.push(".env.local: VITE_SUPABASE_URL ne doit pas contenir /rest/v1/");
  }
}

const workScreens = read("src/components/app/WorkScreens.jsx");
for (const importName of ["CompteurRangsView", "PatronEditorView", "PdfViewerView", "ClientPage"]) {
  if (!workScreens.includes(`const ${importName} = lazy(`)) {
    failures.push(`src/components/app/WorkScreens.jsx: ${importName} n'est pas charge separement`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Smoke check OK");
