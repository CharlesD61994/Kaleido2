const fs = require("fs");

const files = [
  "README.md",
  "src/App.jsx",
  "src/AppPro.jsx",
  "src/ClientPage.jsx",
  "src/components/work/WorkProjectHeader.jsx",
  "src/services/mediaStore.js",
];

const cp1252 = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const suspectMarker = /[\u00c2\u00c3\u00c5\u00e2\u00f0]/;
const suspect = /[^\s<>"'`{}()[\];,]*[\u00c2\u00c3\u00c5\u00e2\u00f0][^\s<>"'`{}()[\];,]*/g;

function byteFor(char) {
  const code = char.codePointAt(0);
  if (code <= 0xff) return code;
  return cp1252.get(code);
}

function repairToken(token) {
  const bytes = [];
  for (const char of token) {
    const byte = byteFor(char);
    if (byte === undefined) return token;
    bytes.push(byte);
  }

  const repaired = Buffer.from(bytes).toString("utf8");
  return repaired.includes("\ufffd") ? token : repaired;
}

function repairLine(line) {
  if (!suspectMarker.test(line)) return line;

  let fixed = line;
  for (let start = 0; start < fixed.length; start += 1) {
    if (!suspectMarker.test(fixed[start])) continue;

    let left = start;
    while (left > 0 && !/[\s<>"'`{}()[\];,]/.test(fixed[left - 1])) left -= 1;

    let right = start + 1;
    while (right < fixed.length && !/[\s<>"'`{}()[\];,]/.test(fixed[right])) right += 1;

    const token = fixed.slice(left, right);
    const repaired = repairToken(token);
    if (repaired !== token) {
      fixed = fixed.slice(0, left) + repaired + fixed.slice(right);
      start = left + repaired.length - 1;
    }
  }

  return fixed.replace(suspect, repairToken);
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, "utf8");
  const fixed = original
    .split(/\r?\n/)
    .map(repairLine)
    .join("\n");
  if (fixed !== original) fs.writeFileSync(file, fixed, "utf8");
}
