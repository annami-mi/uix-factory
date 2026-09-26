// Сборка пакета mi-kit из исходников @uix/ui, @uix/charts, @uix/tokens (ADR-0004).
// 1) JS: три точки входа, зависимости наружу; CSS компонентов — одним файлом.
// 2) CSS: слои + токены + шрифт по умолчанию и шрифтовые пары, woff2 копируются в dist/assets.
// 3) Типы: vue-tsc, импорты @uix/* переписываются на относительные пути.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packages = resolve(root, "..");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

rmSync(dist, { recursive: true, force: true });

// Всё, что пакет ставит зависимостью или ждёт от приложения, в бандл не попадает
const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const isExternal = (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`));

// Всё, что импортируют исходники, должно быть зависимостью mi-kit — иначе Vite молча вшьёт пакет в бандл
const sourceDeps = ["ui", "charts"].flatMap((p) => Object.entries(JSON.parse(readFileSync(join(packages, p, "package.json"), "utf8")).dependencies));
for (const [dep, range] of sourceDeps) {
  if (dep.startsWith("@uix/") || dep.startsWith("@fontsource/")) continue; // свои пакеты — в бандле, шрифты — в dist/assets
  const own = pkg.dependencies[dep] ?? pkg.peerDependencies[dep];
  if (!own) throw new Error(`${dep} нет в зависимостях mi-kit (packages/kit/package.json)`);
  if (dep !== "vue" && own !== range) throw new Error(`${dep}: в mi-kit ${own}, в исходниках ${range}`);
}

await build({
  configFile: false,
  root,
  logLevel: "warn",
  plugins: [vue()],
  // Dev-предупреждения кита: в lib-режиме Vite подставил бы false, а так решает бандлер приложения (как у самого Vue)
  define: { "import.meta.env.DEV": 'process.env.NODE_ENV !== "production"' },
  build: {
    outDir: dist,
    emptyOutDir: false,
    lib: {
      entry: {
        index: join(packages, "ui/src/index.ts"),
        charts: join(packages, "charts/src/index.ts"),
        tokens: join(packages, "tokens/src/index.ts"),
      },
      formats: ["es"],
      cssFileName: "components",
    },
    rollupOptions: { external: isExternal, output: { chunkFileNames: "chunks/[name]-[hash].js" } },
    minify: false,
  },
});

const fontPairs = readdirSync(join(packages, "ui/src/styles/font-pairs")).filter((f) => f.endsWith(".css"));
const cssEntries = {
  base: join(packages, "ui/src/styles/layers.css"),
  ...Object.fromEntries(fontPairs.map((f) => [`font-pairs/${f.replace(/\.css$/, "")}`, join(packages, "ui/src/styles/font-pairs", f)])),
};

await build({
  configFile: false,
  root: join(packages, "ui"),
  base: "./",
  logLevel: "warn",
  build: {
    outDir: dist,
    emptyOutDir: false,
    assetsInlineLimit: 0,
    // относительные url() шрифтов: CSS лежит в node_modules приложения, а не в корне сайта
    cssCodeSplit: true,
    rollupOptions: {
      input: cssEntries,
      output: { assetFileNames: (a) => (a.names?.[0]?.endsWith(".css") ? "[name][extname]" : "assets/[name]-[hash][extname]") },
    },
  },
});

// styles.css = слои, токены, базовый шрифт + стили компонентов (они уже внутри @layer components)
const baseCss = readFileSync(join(dist, "base.css"), "utf8");
const componentsCss = readFileSync(join(dist, "components.css"), "utf8");
writeFileSync(join(dist, "styles.css"), `${baseCss}\n${componentsCss}`);
rmSync(join(dist, "base.css"));
rmSync(join(dist, "components.css"));
// CSS-входы Vite оставляет пустые JS-чанки — убрать
for (const f of readdirSync(dist)) if (/^base.*\.js$/.test(f)) rmSync(join(dist, f));
for (const f of readdirSync(join(dist, "font-pairs"))) if (f.endsWith(".js")) rmSync(join(dist, "font-pairs", f));
// Vite считает url() от корня dist, а пары лежат в font-pairs/ — на уровень выше
for (const f of readdirSync(join(dist, "font-pairs"))) {
  const file = join(dist, "font-pairs", f);
  writeFileSync(file, readFileSync(file, "utf8").replaceAll("url(./assets/", "url(../assets/"));
}

copyFileSync(join(packages, "tokens/dist/tokens.json"), join(dist, "tokens.json"));

execFileSync("vue-tsc", ["-p", "tsconfig.build.json"], { cwd: root, stdio: "inherit" });

const typesRoot = join(dist, "types");
const aliases = { "@uix/ui": join(typesRoot, "ui/src/index"), "@uix/tokens": join(typesRoot, "tokens/src/index") };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
for (const file of walk(typesRoot).filter((f) => f.endsWith(".d.ts"))) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(/(["'])(@uix\/(?:ui|tokens))\1/g, (_, q, spec) => {
    let rel = relative(dirname(file), aliases[spec]);
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return `${q}${rel}${q}`;
  });
  if (out !== src) writeFileSync(file, out);
}
if (!existsSync(join(typesRoot, "ui/src/index.d.ts"))) throw new Error("типы не собраны");
console.log("mi-kit собран →", relative(process.cwd(), dist));
