const fs = require('fs');

// programPdfService.js - add jump rope to warm-ups
let pdf = fs.readFileSync('services/programPdfService.js', 'utf8');
pdf = pdf.replace(
  "details: '8-12 min · Hip circles · Bodyweight squats · Walking lunges · Light skipping · Materials: floor, optional jump rope'",
  "details: '8-12 min · Hip circles · Bodyweight squats · Walking lunges · Jump rope or light skipping · Materials: floor, jump rope'"
);
pdf = pdf.replace(
  "details: '8-12 min · Jumping jacks · Arm swings · Light squats · Step-back burpees · Materials: floor'",
  "details: '8-12 min · Jump rope 1 min · Jumping jacks · Arm swings · Light squats · Step-back burpees · Materials: floor, jump rope'"
);
pdf = pdf.replace("materials: 'Floor. Optional: jump rope'", "materials: 'Floor, jump rope'");
pdf = pdf.replace("{ name: 'Light skipping or step jumps'", "{ name: 'Jump rope or light skipping'");
pdf = pdf.replace(
  "goal: 'Full-body, breathing rhythm, low-impact activation. Intensity must remain low.',\n    materials: 'Floor',\n    exercises: [\n      { name: 'Jumping jacks'",
  "goal: 'Full-body, breathing rhythm, low-impact activation. Intensity must remain low.',\n    materials: 'Floor, jump rope',\n    exercises: [\n      { name: 'Jump rope', prescription: '1 min, easy pace' },\n      { name: 'Jumping jacks'"
);
fs.writeFileSync('services/programPdfService.js', pdf);

// programGenerator6Week.js - add jump rope to Day 3 warm-up
let gen = fs.readFileSync('services/programGenerator6Week.js', 'utf8');
gen = gen.replace("sets: 'Easy jogging 3-5 min", "sets: 'Jump rope or easy jogging 3-5 min");
fs.writeFileSync('services/programGenerator6Week.js', gen);

console.log('All edits applied.');
