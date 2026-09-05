const fs = require('fs');
let code = fs.readFileSync('app/api/leads/discover/route.ts', 'utf8');

code = code.replace(/businessName: b\.name,/g, 'businessName: b.businessName || "Unknown",');
code = code.replace(/category: b\.category,/g, 'category: b.category || category,');
code = code.replace(/niche: b\.niche,/g, 'niche: b.niche || "",');
code = code.replace(/city: b\.city,/g, 'city: b.city || city,');
code = code.replace(/country: b\.country,/g, 'country: b.country || country,');
code = code.replace(/websiteUrl: b\.website,/g, 'websiteUrl: b.websiteUrl || "",');

fs.writeFileSync('app/api/leads/discover/route.ts', code);
