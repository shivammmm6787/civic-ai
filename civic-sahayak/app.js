// ---------- Tabs ----------
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button").forEach(x => x.classList.remove("on"));
  document.querySelectorAll("section").forEach(x => x.classList.remove("on"));
  b.classList.add("on");
  document.getElementById(b.dataset.tab).classList.add("on");
});
document.querySelectorAll("[data-ex]").forEach(b => b.onclick = () => {
  document.getElementById("issue").value = b.dataset.ex;
});

// ---------- 1. Complaint classifier (offline, keyword-weighted, EN + HI + Hinglish) ----------
const CATS = [
  { id: "Roads & Potholes", dept: "Public Works Department (PWD) / Nagar Palika",
    kw: ["pothole","gaddha","gadda","गड्ढा","road","sadak","सड़क","crack","broken road","speed breaker","footpath","bridge","pul"] },
  { id: "Water Supply", dept: "Jal Nigam / Jal Sansthan",
    kw: ["water","paani","pani","पानी","pipeline","pipe","leak","tap","supply","borewell","handpump","hand pump","tanker","dirty water","gandha pani"] },
  { id: "Electricity", dept: "Electricity Distribution Company (DISCOM)",
    kw: ["electric","bijli","बिजली","power cut","outage","transformer","wire","tar","pole","khamba","voltage","meter","current","spark"] },
  { id: "Street Lighting", dept: "Municipal Corporation / Nagar Palika (Street Light Cell)",
    kw: ["street light","streetlight","light not","lamp","andhera","अंधेरा","dark","lane dark","street lamp"] },
  { id: "Sanitation & Garbage", dept: "Municipal Sanitation Department",
    kw: ["garbage","kachra","कचरा","waste","trash","dustbin","smell","badbu","drain","nali","नाली","sewer","sewage","overflow","mosquito","machhar","cleaning","safai","सफाई"] },
  { id: "Public Safety", dept: "Local Police Station",
    kw: ["theft","chori","चोरी","harass","eve teas","fight","danger","unsafe","drunk","gambling","stray dog attack","accident","robbery","threat"] },
  { id: "Health", dept: "Chief Medical Officer (CMO) / District Health Office",
    kw: ["hospital","doctor","dawai","medicine","dengue","malaria","epidemic","clinic","ambulance","health centre","phc","chc","vaccine"] },
  { id: "Education", dept: "Basic Shiksha Adhikari (BSA) / Education Department",
    kw: ["school","teacher","shiksha","स्कूल","mid day meal","midday","scholarship","classroom","college"] },
];

const URGENT = ["live wire","open wire","spark","sparks","fire","accident","injur","died","death","collapse","flood","sewage overflow","epidemic","dengue","gas leak","child","school","hospital","sharp","emergency","jaan","khatra","खतरा","girne","gir gayi","gir gaya"];
const MEDIUM = ["week","days","din","3 din","many days","not working","band","complaint again","no response","harassment","overflow","leak","dark"];

function classify(text) {
  const t = text.toLowerCase();
  const scores = CATS.map(c => ({
    c, s: c.kw.reduce((n, k) => n + (t.includes(k) ? (k.length > 5 ? 2 : 1) : 0), 0)
  })).sort((a, b) => b.s - a.s);
  const top = scores[0].s > 0 ? scores[0].c : { id: "General Grievance", dept: "District Magistrate Office / Janta Darshan" };
  const confidence = scores[0].s === 0 ? 0 : Math.min(98, 50 + scores[0].s * 12 - (scores[1].s ? scores[1].s * 4 : 0));
  const hits = u => u.filter(k => t.includes(k)).length;
  const u = hits(URGENT), m = hits(MEDIUM);
  const urgency = u >= 1 ? "High" : m >= 1 ? "Medium" : "Low";
  return { cat: top, confidence: Math.max(0, confidence), urgency, secondary: scores[1].s > 0 ? scores[1].c.id : null };
}

const SLA = { High: "Escalate immediately; expect action within 24-48 hours.", Medium: "Follow up if no response within 7 days.", Low: "Follow up if no response within 15 days." };

function esc(s){ return s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

document.getElementById("analyze").onclick = () => {
  const text = document.getElementById("issue").value.trim();
  const loc = document.getElementById("loc").value.trim() || "[location]";
  const nm = document.getElementById("nm").value.trim() || "[Your Name]";
  const out = document.getElementById("result");
  if (text.length < 8) { out.innerHTML = '<div class="card">Please describe the issue in a little more detail.</div>'; return; }
  const r = classify(text);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const letter =
`To,
The Officer In-Charge,
${r.cat.dept}

Date: ${date}
Subject: Complaint regarding ${r.cat.id.toLowerCase()} at ${loc}

Respected Sir/Madam,

I would like to bring the following problem to your kind attention:

${text}

Location: ${loc}

This issue is affecting residents and needs ${r.urgency === "High" ? "URGENT" : "prompt"} attention. I request you to inspect the site and take the necessary action at the earliest, and to share the status of this complaint with me.

Thank you.

Yours faithfully,
${nm}`;
  out.innerHTML = `
  <div class="card">
    <span class="tag t-cat">${esc(r.cat.id)}</span>
    <span class="tag t-${r.urgency === "High" ? "high" : r.urgency === "Medium" ? "med" : "low"}">${r.urgency} urgency</span>
    <span class="small">match confidence ~${r.confidence}%${r.secondary ? " · also related to " + esc(r.secondary) : ""}</span>
    <p><b>Route to:</b> ${esc(r.cat.dept)}</p>
    <p>${SLA[r.urgency]}</p>
    ${r.urgency === "High" ? '<p><b>⚠ If anyone is in danger right now, call 112 (emergency) or 108 (ambulance).</b></p>' : ""}
  </div>
  <div class="card">
    <b>Draft complaint letter</b>
    <pre id="letter">${esc(letter)}</pre>
    <button class="go alt" onclick="navigator.clipboard.writeText(document.getElementById('letter').innerText)">Copy letter</button>
  </div>
  <div class="card">
    <b>Where to file it</b>
    <ul>
      <li>Central: <a href="https://pgportal.gov.in" target="_blank" rel="noopener">CPGRAMS (pgportal.gov.in)</a></li>
      <li>Uttar Pradesh: <a href="https://jansunwai.up.nic.in" target="_blank" rel="noopener">IGRS Jansunwai (jansunwai.up.nic.in)</a></li>
      <li>Or submit the letter at the office of the department above and keep the receipt/complaint number.</li>
    </ul>
    <p class="small">Classification is rule-based and may be wrong. Review the category before sending.</p>
  </div>`;
};

// ---------- 2. Scheme matcher ----------
// Indicative rules for demo purposes; verify on the official site.
const SCHEMES = [
  { name: "PM-KISAN", what: "₹6,000/year income support in instalments to eligible farmer families.",
    url: "https://pmkisan.gov.in", ok: p => p.occ === "farmer" },
  { name: "Ayushman Bharat PM-JAY", what: "Health cover for hospitalisation for eligible low-income families.",
    url: "https://pmjay.gov.in", ok: p => p.inc !== null && p.inc <= 300000 },
  { name: "PM Ujjwala Yojana", what: "Support for LPG connection for eligible women from low-income households.",
    url: "https://www.pmuy.gov.in", ok: p => p.gen === "Female" && p.age >= 18 && p.inc !== null && p.inc <= 300000 },
  { name: "Sukanya Samriddhi Yojana", what: "Small savings account for the education and marriage expenses of a girl child (opened for girls under 10).",
    url: "https://www.indiapost.gov.in", ok: p => p.girl === "yes" },
  { name: "PM Awas Yojana", what: "Assistance for building or buying a house for eligible families (Gramin and Urban variants).",
    url: p => p.area === "urban" ? "https://pmaymis.gov.in" : "https://pmayg.nic.in", ok: p => p.inc !== null && p.inc <= 600000 },
  { name: "Atal Pension Yojana", what: "Guaranteed pension after 60 for unorganised-sector workers; join between ages 18 and 40.",
    url: "https://www.npscra.nsdl.co.in/scheme-details.php", ok: p => p.age >= 18 && p.age <= 40 && (p.occ === "worker" || p.occ === "entrepreneur" || p.occ === "homemaker") },
  { name: "PM Mudra Yojana", what: "Collateral-free loans for small businesses (Shishu, Kishor, Tarun categories).",
    url: "https://www.mudra.org.in", ok: p => p.occ === "entrepreneur" },
  { name: "PM Jan Dhan Yojana", what: "Zero-balance bank account with RuPay card and accident insurance.",
    url: "https://pmjdy.gov.in", ok: p => p.age >= 10 },
  { name: "PM Suraksha Bima Yojana", what: "Low-premium accidental death and disability insurance for ages 18-70 with a bank account.",
    url: "https://jansuraksha.gov.in", ok: p => p.age >= 18 && p.age <= 70 },
  { name: "National Scholarship Portal", what: "Central and state scholarships for students, based on category, merit and income.",
    url: "https://scholarships.gov.in", ok: p => p.occ === "student" },
  { name: "Skill India / PMKVY", what: "Free short-term skill training and certification.",
    url: "https://www.skillindiadigital.gov.in", ok: p => p.age >= 15 && p.age <= 45 && (p.occ === "student" || p.occ === "worker" || p.occ === "other") },
];

document.getElementById("match").onclick = () => {
  const v = id => document.getElementById(id).value;
  const p = { age: parseInt(v("age"), 10), inc: v("inc") === "" ? null : Number(v("inc")), gen: v("gen"), occ: v("occ"), area: v("area"), girl: v("girl") };
  const out = document.getElementById("schemeOut");
  if (isNaN(p.age)) { out.innerHTML = '<div class="card">Please enter your age.</div>'; return; }
  const hits = SCHEMES.filter(s => s.ok(p));
  out.innerHTML = hits.length
    ? hits.map(s => `<div class="card scheme"><h3>${esc(s.name)}</h3><p>${esc(s.what)}</p><a href="${typeof s.url === "function" ? s.url(p) : s.url}" target="_blank" rel="noopener">Official website →</a></div>`).join("")
    : '<div class="card">No obvious matches. Try adjusting the details.</div>';
};

// ---------- 3. Chat (Claude via /api/chat, with offline FAQ fallback) ----------
const FAQ = [
  { k: ["ration"], a: "Ration card: apply on your state food and civil supplies portal (in UP: fcs.up.gov.in) or at a Jan Seva Kendra. Usually needed: Aadhaar, address proof, family details, passport photo." },
  { k: ["aadhaar","aadhar"], a: "Aadhaar updates and enrolment: uidai.gov.in or a nearby Aadhaar centre. Book an appointment online and carry original documents." },
  { k: ["complaint","shikayat","grievance"], a: "Use the Report tab to draft a complaint, then file it on pgportal.gov.in (CPGRAMS) or jansunwai.up.nic.in (UP IGRS)." },
  { k: ["certificate","income","caste","domicile","niwas"], a: "In UP, income, caste and domicile certificates are applied for through the e-District portal (edistrict.up.gov.in) with ID and address proof." },
  { k: ["pension"], a: "For pension schemes, try the Scheme finder tab, and confirm eligibility on the official website." },
  { k: ["emergency","police","ambulance"], a: "Emergency: 112. Ambulance: 108." },
];
const log = document.getElementById("log");
const history = [];
function add(cls, text){ const d = document.createElement("div"); d.className = "msg " + cls; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }

async function ask() {
  const qEl = document.getElementById("q");
  const q = qEl.value.trim(); if (!q) return;
  qEl.value = ""; add("u", q); history.push({ role: "user", content: q });
  const wait = add("b", "…");
  try {
    const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
    if (!r.ok) throw new Error("no api");
    const { reply } = await r.json();
    wait.textContent = reply; history.push({ role: "assistant", content: reply });
  } catch {
    const t = q.toLowerCase();
    const f = FAQ.find(x => x.k.some(k => t.includes(k)));
    wait.textContent = f ? f.a : "The AI service isn't connected yet. Try the Report or Scheme finder tabs, or ask about ration card, Aadhaar, certificates or complaints.";
  }
}
document.getElementById("send").onclick = ask;
document.getElementById("q").addEventListener("keydown", e => { if (e.key === "Enter") ask(); });
