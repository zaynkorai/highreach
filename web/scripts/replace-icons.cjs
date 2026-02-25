const fs = require('fs');

const imageBuf = fs.readFileSync('public/highreach.png');
const base64Image = imageBuf.toString('base64');
const svgString = `<svg viewBox="0 0 836 838" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${base64Image}" width="836" height="838"/>
</svg>`;

fs.writeFileSync('public/icon.svg', svgString);
fs.writeFileSync('public/vercel.svg', svgString);

// Next.js favicon is typically an ICO, replacing with PNG image directly works for most modern browsers
// Alternatively, setting it as SVG or the raw image buffer.
fs.writeFileSync('src/app/favicon.ico', imageBuf);

console.log('Successfully generated SVG files and replaced Verel icons.');
