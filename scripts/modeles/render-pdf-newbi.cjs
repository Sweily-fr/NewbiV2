// Rend un modèle avec le VRAI gabarit Newbi, en pilotant le navigateur sur la
// page /pdf-generator/<type>/preview du serveur de développement local.
// La page lit window.__PREVIEW_DATA : on injecte les données d'exemple, puis
// on demande à Chrome son PDF vectoriel, exactement comme la route API.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = process.env.PREVIEW_BASE || "http://localhost:3000";
const OUT = process.argv[2];
const SPEC = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

(async () => {
  const exe = process.env.CHROME_PATH;
  if (!exe) throw new Error("CHROME_PATH absent");
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const m of SPEC.rendus) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((d) => {
      window.__PREVIEW_DATA = d;
    }, m.data);
    const url = `${BASE}/pdf-generator/${m.type}/preview?mode=print`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    // Laisse le rendu se stabiliser (polices, mise en page)
    await new Promise((r) => setTimeout(r, 2500));

    const buf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    const file = path.join(OUT, `${m.slug}.pdf`);
    fs.writeFileSync(file, buf);
    console.log(`${m.slug}.pdf : ${fs.statSync(file).size} o (gabarit ${m.type})`);
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error("ERREUR :", e.message);
  process.exit(1);
});
