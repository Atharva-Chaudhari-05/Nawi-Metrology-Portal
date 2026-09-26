const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,40 Q30,10 50,40 T90,40 T130,30 T170,40" stroke="#0f172a" stroke-width="3" fill="none"/></svg>`;
console.log('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
