import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/gallery.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { galleryCollections, projectCollections, isGalleryImageAllowed } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
assert.equal(galleryCollections.length, 12);
assert.equal(projectCollections.filter((item) => item.slug.startsWith("quiet-luxury")).length, 1);
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
// Fixed SHA-256 fingerprints keep CI independent of the private archive.
const excludedHashes = new Set([
  "ae1655e12ae230d3849b6cadc0cd5150b81c176078f2fd8018c74a05d9deda80",
  "34b4504db8a71a7c0801b77f418112db617e38ef9b36293c274c486354202138",
  "7e002af8e795c195c48ecdb77dfb3f3af218f4c51c8144f08b551f0620701f27",
]);
function checkPublicFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    assert.equal(entry.isSymbolicLink(), false, file.pathname);
    if (entry.isDirectory()) checkPublicFiles(file);
    else assert.equal(excludedHashes.has(hash(file)), false, file.pathname);
  }
}
checkPublicFiles(new URL("../public/", import.meta.url));
for (const [slug, count] of [["quiet-luxury-room", 5], ["crafted-dining-space", 5], ["pvc-wall-panels", 11]]) {
  assert.equal(galleryCollections.find((item) => item.slug === slug).images.length, count);
}
for (const collection of galleryCollections) {
  for (const image of collection.images) {
    assert.ok(existsSync(new URL(`../public${image}`, import.meta.url)), image);
    assert.ok(isGalleryImageAllowed(image), image);
    assert.equal(excludedHashes.has(hash(new URL(`../public${image}`, import.meta.url))), false, image);
  }
}
for (const asset of ["quiet-luxury-room/05.webp", "crafted-dining-space/03.webp", "pvc-wall-panels/05.webp",
  ...Array.from({ length: 6 }, (_, i) => `quiet-luxury-room-set-two/0${i + 1}.webp`)]) {
  const image = `/media/sajivo-gallery/${asset}`;
  assert.equal(isGalleryImageAllowed(image), false);
  assert.equal(isGalleryImageAllowed(`https://example.com${image}?v=1`), false);
  assert.equal(existsSync(new URL(`../public${image}`, import.meta.url)), false);
}
assert.equal(existsSync(new URL("../archive/gallery-exclusions", import.meta.url)), false);
assert.ok(isGalleryImageAllowed("https://images.unsplash.com/photo-example"));
console.log("PASS: 12 collections, approved files exist, all 9 archived paths excluded.");
