import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targets = [
  path.resolve(__dirname, "../node_modules/@xyflow/react/dist/esm/index.js"),
  path.resolve(__dirname, "../node_modules/@xyflow/react/dist/esm/index.mjs"),
];

const TARGET_REPLACEMENT = 'jsx(MarkerDefinitions$1, { defaultColor: defaultMarkerColor, rfId: rfId }, "marker-definitions")';

const SEARCH_PATTERNS = [
  'jsx(MarkerDefinitions$1, { key: "marker-definitions", defaultColor: defaultMarkerColor, rfId: rfId })',
  'jsx(MarkerDefinitions$1, { defaultColor: defaultMarkerColor, rfId: rfId })',
];

let patchedCount = 0;

for (const targetPath of targets) {
  if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, "utf8");
    if (content.includes(TARGET_REPLACEMENT)) {
      console.log(`[patch-xyflow] Already properly patched ${path.basename(targetPath)}`);
      continue;
    }

    let modified = false;
    for (const search of SEARCH_PATTERNS) {
      if (content.includes(search)) {
        content = content.replace(search, TARGET_REPLACEMENT);
        modified = true;
        break;
      }
    }

    if (modified) {
      fs.writeFileSync(targetPath, content, "utf8");
      patchedCount++;
      console.log(`[patch-xyflow] Successfully patched ${path.basename(targetPath)}`);
    }
  }
}

if (patchedCount > 0) {
  console.log(`[patch-xyflow] React 19 EdgeRenderer key patch applied to ${patchedCount} file(s).`);
}
