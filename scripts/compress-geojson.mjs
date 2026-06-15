import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const exportsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/exports");

const files = (await readdir(exportsDir)).filter(
  (file) => file.endsWith(".geojson") && !file.endsWith(".geojson.gz")
);

for (const file of files) {
  const input = path.join(exportsDir, file);
  const output = `${input}.gz`;

  await pipeline(createReadStream(input), createGzip({ level: 9 }), createWriteStream(output));
  console.log(`Compressed ${file} -> ${file}.gz`);
}
