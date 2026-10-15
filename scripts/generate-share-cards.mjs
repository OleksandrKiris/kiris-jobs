import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Rebuild every public brand graphic from the exact approved PrimServ avatar.
// Requires Inkscape and @napi-rs/canvas (or CANVAS_MODULE_PATH for that package).
// Inkscape renders SVG fonts and embedded raster marks consistently.
const root = fileURLToPath(new URL("../", import.meta.url));
const assets = path.join(root, "assets");
const require = createRequire(import.meta.url);
let renderer;
try { renderer = require("@napi-rs/canvas"); }
catch (error) {
  const fallback = process.env.CANVAS_MODULE_PATH || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
    ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, "@napi-rs", "canvas") : "");
  if (!fallback) throw new Error("Zainstaluj @napi-rs/canvas lub ustaw CANVAS_MODULE_PATH.", { cause: error });
  renderer = require(fallback);
}
const { createCanvas, loadImage } = renderer;
const avatar = await fs.readFile(path.join(assets, "primserv-avatar.jpg"));
const avatarSha = createHash("sha256").update(avatar).digest("hex");
if (avatarSha !== "da0f4b4d54bd8e04f8f68c003f9b3b61d26c1e4071bac9962ee8a9e57a015a71") {
  throw new Error("Avatar PrimServ różni się od zatwierdzonego oficjalnego pliku.");
}
const logo = `data:image/jpeg;base64,${avatar.toString("base64")}`;
const escapeXml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const svgStart = (title, description) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(description)}</desc>`;
const background = `<rect width="1200" height="630" fill="#f3f5f7"/><rect width="1200" height="12" fill="#ed1c24"/>`;

function shareSvg() {
  return `${svgStart("PrimServ | Praca w Europie", "Oferty pracy w Polsce, na Węgrzech i w Belgii. Warunki, zdjęcia zakwaterowania i kontakt z rekruterem.")}
    ${background}
    <rect x="52" y="62" width="424" height="506" rx="30" fill="#fff"/>
    <image xlink:href="${logo}" x="64" y="84" width="400" height="400" preserveAspectRatio="xMidYMid meet"/>
    <g font-family="Arial, sans-serif">
      <text x="264" y="530" text-anchor="middle" font-size="21" font-weight="700" fill="#526675">www.primserv.pl</text>
      <text x="536" y="121" font-size="17" font-weight="800" letter-spacing="2.5" fill="#c92332">OFERTY PRACY</text>
      <text x="536" y="220" font-size="66" font-weight="800" fill="#263c4b">Praca</text>
      <text x="536" y="296" font-size="66" font-weight="800" fill="#263c4b">w Europie</text>
      <text x="536" y="358" font-size="25" font-weight="700" fill="#526675">Polska · Węgry · Belgia</text>
      <text x="536" y="404" font-size="21" font-weight="500" fill="#526675">Warunki i zdjęcia zakwaterowania.</text>
      <text x="536" y="437" font-size="21" font-weight="500" fill="#526675">Wybierz ofertę i porozmawiaj z rekruterem.</text>
      <rect x="536" y="485" width="592" height="72" rx="18" fill="#263c4b"/>
      <text x="832" y="530" text-anchor="middle" font-size="23" font-weight="700" fill="#fff">t.me/KirisWorkPoland_bot</text>
    </g></svg>`;
}
async function pngFromSvg(svg) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "primserv-assets-"));
  try {
    const input = path.join(temp, "input.svg");
    const output = path.join(temp, "output.png");
    await fs.writeFile(input, svg);
    await promisify(execFile)(process.env.INKSCAPE_PATH || "inkscape", [input,
      "--export-type=png", `--export-filename=${output}`, "--export-width=1200", "--export-height=630"]);
    return await fs.readFile(output);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
const avatarImage = await loadImage(avatar);
for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  canvas.getContext("2d").drawImage(avatarImage, 0, 0, size, size);
  await fs.writeFile(path.join(assets, `icon-${size}.png`), canvas.toBuffer("image/png"));
}
await fs.writeFile(path.join(assets, "icon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img" aria-labelledby="title"><title id="title">PrimServ</title><rect width="512" height="512" fill="#fff"/><image xlink:href="${logo}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></svg>\n`);
const shared = shareSvg();
const sharedPng = await pngFromSvg(shared);
await fs.writeFile(path.join(assets, "share-card.svg"), `${shared}\n`);
await fs.writeFile(path.join(assets, "share-card.png"), sharedPng);
// The compatibility filename remains pixel- and byte-identical.
await fs.writeFile(path.join(assets, "share-card-v11.png"), sharedPng);
console.log(`PrimServ: 2 ikony i 2 identyczne wspólne podglądy. Avatar SHA-256: ${avatarSha}.`);
