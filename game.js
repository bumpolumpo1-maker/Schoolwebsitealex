'use strict';
/* =========================================================================
   KONTOR — Handelsimperium
   Ein Wirtschafts-Tycoon-Simulator. Reines Vanilla JS, keine Abhängigkeiten.
   ========================================================================= */

/* ---------------------------------------------------------------------
   1. SPIELDATEN
   --------------------------------------------------------------------- */

const INDUSTRIES = [
  { id:'farm', name:'Landwirtschaft', icon:'🌾',
    chain:[
      { id:'grain', name:'Getreide', icon:'🌾', bName:'Bauernhof', bIcon:'🚜',
        baseCost:50, costGrowth:1.14, baseRate:1, basePrice:4, cap:800 },
      { id:'bread', name:'Brot', icon:'🍞', bName:'Bäckerei', bIcon:'🥖',
        baseCost:750, costGrowth:1.15, baseRate:0.5, basePrice:15, cap:400,
        needs:'grain', ratio:2, research:'unlock_bread' },
      { id:'deli', name:'Delikatessen', icon:'🧀', bName:'Feinkosthandel', bIcon:'🏪',
        baseCost:12000, costGrowth:1.16, baseRate:0.28, basePrice:55, cap:200,
        needs:'bread', ratio:2, research:'unlock_deli' },
    ]},
  { id:'wood', name:'Forstwirtschaft', icon:'🌲', openResearch:'open_wood',
    chain:[
      { id:'timber', name:'Holz', icon:'🪵', bName:'Sägewerk', bIcon:'🪓',
        baseCost:140, costGrowth:1.145, baseRate:1, basePrice:6, cap:800 },
      { id:'furniture', name:'Möbel', icon:'🪑', bName:'Möbelfabrik', bIcon:'🔨',
        baseCost:1800, costGrowth:1.155, baseRate:0.45, basePrice:24, cap:400,
        needs:'timber', ratio:2, research:'unlock_furniture' },
      { id:'luxfurniture', name:'Designermöbel', icon:'🛋️', bName:'Designstudio', bIcon:'🎨',
        baseCost:28000, costGrowth:1.165, baseRate:0.24, basePrice:85, cap:200,
        needs:'furniture', ratio:2, research:'unlock_luxfurniture' },
    ]},
  { id:'mining', name:'Bergbau', icon:'⛏️', openResearch:'open_mining',
    chain:[
      { id:'ore', name:'Erz', icon:'🪨', bName:'Mine', bIcon:'⛏️',
        baseCost:400, costGrowth:1.15, baseRate:1, basePrice:10, cap:800 },
      { id:'steel', name:'Stahl', icon:'🔩', bName:'Stahlwerk', bIcon:'🏭',
        baseCost:6000, costGrowth:1.16, baseRate:0.4, basePrice:38, cap:400,
        needs:'ore', ratio:2, research:'unlock_steel' },
      { id:'machines', name:'Maschinen', icon:'⚙️', bName:'Maschinenbau', bIcon:'🛠️',
        baseCost:90000, costGrowth:1.17, baseRate:0.2, basePrice:135, cap:200,
        needs:'steel', ratio:2, research:'unlock_machines' },
    ]},
  { id:'textile', name:'Textilindustrie', icon:'🧵', openResearch:'open_textile',
    chain:[
      { id:'cotton', name:'Baumwolle', icon:'🌱', bName:'Baumwollfeld', bIcon:'🚜',
        baseCost:1200, costGrowth:1.155, baseRate:1, basePrice:16, cap:800 },
      { id:'clothing', name:'Kleidung', icon:'👕', bName:'Textilfabrik', bIcon:'🧵',
        baseCost:18000, costGrowth:1.165, baseRate:0.35, basePrice:58, cap:400,
        needs:'cotton', ratio:2, research:'unlock_clothing' },
      { id:'fashion', name:'Designermode', icon:'👗', bName:'Modehaus', bIcon:'✂️',
        baseCost:260000, costGrowth:1.175, baseRate:0.18, basePrice:190, cap:200,
        needs:'clothing', ratio:2, research:'unlock_fashion' },
    ]},
  { id:'energy', name:'Energie', icon:'🛢️', openResearch:'open_energy',
    chain:[
      { id:'oil', name:'Öl', icon:'🛢️', bName:'Ölfeld', bIcon:'🗼',
        baseCost:3800, costGrowth:1.16, baseRate:1, basePrice:22, cap:800 },
      { id:'fuel', name:'Kraftstoff', icon:'⛽', bName:'Raffinerie', bIcon:'🏭',
        baseCost:55000, costGrowth:1.17, baseRate:0.32, basePrice:78, cap:400,
        needs:'oil', ratio:2, research:'unlock_fuel' },
      { id:'chemicals', name:'Chemikalien', icon:'🧪', bName:'Chemiewerk', bIcon:'🔬',
        baseCost:780000, costGrowth:1.18, baseRate:0.16, basePrice:250, cap:200,
        needs:'fuel', ratio:2, research:'unlock_chemicals' },
    ]},
];

// Flache Lookup-Tabellen
const GOOD_BY_ID = {};
const BIZ_BY_ID = {};
INDUSTRIES.forEach((ind, ii) => {
  ind.chain.forEach((g, ti) => {
    g.industryIdx = ii; g.tierIdx = ti; g.industryId = ind.id;
    GOOD_BY_ID[g.id] = g; BIZ_BY_ID[g.id] = g;
  });
});

const RESEARCH = [
  // -- Branchenerschließung --
  { id:'open_wood', name:'Markteintritt: Forstwirtschaft', desc:'Erschließt die Forstwirtschaft.', cost:20, cat:'Expansion', prereq:[] },
  { id:'open_mining', name:'Markteintritt: Bergbau', desc:'Erschließt den Bergbau.', cost:90, cat:'Expansion', prereq:['open_wood'] },
  { id:'open_textile', name:'Markteintritt: Textilindustrie', desc:'Erschließt die Textilindustrie.', cost:260, cat:'Expansion', prereq:['open_mining'] },
  { id:'open_energy', name:'Markteintritt: Energie', desc:'Erschließt den Energiesektor.', cost:700, cat:'Expansion', prereq:['open_textile'] },
  // -- Produktionsketten --
  { id:'unlock_bread', name:'Bäckerei erschließen', desc:'Schaltet die Brotproduktion frei.', cost:15, cat:'Produktion', prereq:[] },
  { id:'unlock_deli', name:'Feinkosthandel erschließen', desc:'Schaltet Delikatessen frei.', cost:60, cat:'Produktion', prereq:['unlock_bread'] },
  { id:'unlock_furniture', name:'Möbelfabrik erschließen', desc:'Schaltet Möbelproduktion frei.', cost:35, cat:'Produktion', prereq:['open_wood'] },
  { id:'unlock_luxfurniture', name:'Designstudio erschließen', desc:'Schaltet Designermöbel frei.', cost:140, cat:'Produktion', prereq:['unlock_furniture'] },
  { id:'unlock_steel', name:'Stahlwerk erschließen', desc:'Schaltet Stahlproduktion frei.', cost:220, cat:'Produktion', prereq:['open_mining'] },
  { id:'unlock_machines', name:'Maschinenbau erschließen', desc:'Schaltet Maschinenbau frei.', cost:550, cat:'Produktion', prereq:['unlock_steel'] },
  { id:'unlock_clothing', name:'Textilfabrik erschließen', desc:'Schaltet Kleidungsproduktion frei.', cost:800, cat:'Produktion', prereq:['open_textile'] },
  { id:'unlock_fashion', name:'Modehaus erschließen', desc:'Schaltet Designermode frei.', cost:1800, cat:'Produktion', prereq:['unlock_clothing'] },
  { id:'unlock_fuel', name:'Raffinerie erschließen', desc:'Schaltet Kraftstoffproduktion frei.', cost:2600, cat:'Produktion', prereq:['open_energy'] },
  { id:'unlock_chemicals', name:'Chemiewerk erschließen', desc:'Schaltet Chemieproduktion frei.', cost:6000, cat:'Produktion', prereq:['unlock_fuel'] },
  // -- Infrastruktur --
  { id:'storage1', name:'Lagerausbau I', desc:'+100% Lagerkapazität für alle Güter.', cost:50, cat:'Infrastruktur', prereq:[] },
  { id:'storage2', name:'Lagerausbau II', desc:'Weitere +150% Lagerkapazität.', cost:400, cat:'Infrastruktur', prereq:['storage1'] },
  { id:'storage3', name:'Lagerausbau III', desc:'Weitere +200% Lagerkapazität.', cost:3000, cat:'Infrastruktur', prereq:['storage2'] },
  // -- Effizienz --
  { id:'eff1', name:'Effizienz I', desc:'+15% Produktion in allen Betrieben.', cost:150, cat:'Effizienz', prereq:[] },
  { id:'eff2', name:'Effizienz II', desc:'Weitere +20% Produktion.', cost:1200, cat:'Effizienz', prereq:['eff1'] },
  { id:'eff3', name:'Effizienz III', desc:'Weitere +25% Produktion.', cost:9000, cat:'Effizienz', prereq:['eff2'] },
  // -- Automatisierung --
  { id:'automation', name:'Automatisierung', desc:'Schaltet Auto-Verkauf für alle Güter frei.', cost:100, cat:'Automatisierung', prereq:['unlock_bread'] },
  { id:'marketanalyse', name:'Marktanalyse', desc:'Halbiert den Preisverfall beim Verkaufen.', cost:500, cat:'Automatisierung', prereq:['automation'] },
  { id:'offlineboost', name:'Fernsteuerung', desc:'Verdoppelt die Produktion während du offline bist.', cost:350, cat:'Automatisierung', prereq:['automation'] },
  { id:'fastresearch', name:'Innovationslabor', desc:'+1 Forschungspunkt pro Sekunde, passiv.', cost:700, cat:'Automatisierung', prereq:['eff1'] },
];
const RESEARCH_BY_ID = {};
RESEARCH.forEach(r => RESEARCH_BY_ID[r.id] = r);

const EMPLOYEES = [
  { id:'foreman', name:'Vorarbeiter', icon:'👷', desc:'+8% Produktion pro Stufe', baseCost:2000, growth:1.25 },
  { id:'buyer', name:'Einkäufer', icon:'🤝', desc:'-2% Baukosten pro Stufe (max. -60%)', baseCost:3000, growth:1.28 },
  { id:'logist', name:'Logistiker', icon:'🚚', desc:'+10% Lagerkapazität pro Stufe', baseCost:2500, growth:1.26 },
  { id:'analyst', name:'Analyst', icon:'📊', desc:'+2% Verkaufspreis pro Stufe (max. +40%)', baseCost:4000, growth:1.27 },
  { id:'researcher', name:'Forscher', icon:'🔬', desc:'+0,5 Forschungspunkte/Sek pro Stufe', baseCost:5000, growth:1.30 },
];
const EMPLOYEE_BY_ID = {};
EMPLOYEES.forEach(e => EMPLOYEE_BY_ID[e.id] = e);

const ACHIEVEMENTS = [
  { id:'first_building', name:'Erste Investition', icon:'🏗️', desc:'Kaufe deinen ersten Betrieb.', cond:s => totalLevels(s) >= 1, reward:{cash:100} },
  { id:'first_sale', name:'Erster Verkauf', icon:'🤝', desc:'Verkaufe zum ersten Mal Ware.', cond:s => s.stats.totalSales >= 1, reward:{cash:150} },
  { id:'level10', name:'Ausbaustufe 10', icon:'📐', desc:'Ein Betrieb erreicht Stufe 10.', cond:s => maxLevel(s) >= 10, reward:{cash:500} },
  { id:'level25', name:'Ausbaustufe 25', icon:'📐', desc:'Ein Betrieb erreicht Stufe 25.', cond:s => maxLevel(s) >= 25, reward:{cash:2000} },
  { id:'all_tier0', name:'Fünf Standbeine', icon:'🌍', desc:'Alle Rohstoff-Betriebe eröffnet.', cond:s => INDUSTRIES.every(ind => (s.biz[ind.chain[0].id]||0) >= 1), reward:{cash:3000} },
  { id:'all_open', name:'Vollständig diversifiziert', icon:'🗺️', desc:'Alle Branchen erschlossen.', cond:s => INDUSTRIES.every(ind => isIndustryOpen(s, ind)), reward:{cash:5000} },
  { id:'cash_10k', name:'Solide Basis', icon:'💰', desc:'Insgesamt €10.000 verdient.', cond:s => s.stats.lifetimeEarned >= 1e4, reward:{mult:0.01} },
  { id:'cash_100k', name:'Aufstrebend', icon:'💰', desc:'Insgesamt €100.000 verdient.', cond:s => s.stats.lifetimeEarned >= 1e5, reward:{mult:0.01} },
  { id:'cash_1m', name:'Millionär', icon:'💎', desc:'Insgesamt €1 Mio verdient.', cond:s => s.stats.lifetimeEarned >= 1e6, reward:{mult:0.02} },
  { id:'cash_10m', name:'Großindustrieller', icon:'💎', desc:'Insgesamt €10 Mio verdient.', cond:s => s.stats.lifetimeEarned >= 1e7, reward:{mult:0.02} },
  { id:'cash_100m', name:'Imperium', icon:'👑', desc:'Insgesamt €100 Mio verdient.', cond:s => s.stats.lifetimeEarned >= 1e8, reward:{mult:0.03} },
  { id:'employees5', name:'Kleines Team', icon:'👥', desc:'5 Mitarbeiterstufen eingestellt.', cond:s => totalEmployeeLevels(s) >= 5, reward:{cash:2000} },
  { id:'employees25', name:'Große Belegschaft', icon:'👥', desc:'25 Mitarbeiterstufen eingestellt.', cond:s => totalEmployeeLevels(s) >= 25, reward:{mult:0.01} },
  { id:'research10', name:'Erfinder', icon:'⚗️', desc:'10 Forschungen abgeschlossen.', cond:s => Object.keys(s.research).length >= 10, reward:{mult:0.01} },
  { id:'researchAll', name:'Vordenker', icon:'⚗️', desc:'Alle Forschungen abgeschlossen.', cond:s => Object.keys(s.research).length >= RESEARCH.length, reward:{mult:0.05} },
  { id:'prestige1', name:'Börsengang', icon:'📈', desc:'Erster Börsengang durchgeführt.', cond:s => s.stats.prestigeCount >= 1, reward:{mult:0.03} },
  { id:'prestige5', name:'Serienunternehmer', icon:'📈', desc:'5 Börsengänge durchgeführt.', cond:s => s.stats.prestigeCount >= 5, reward:{mult:0.05} },
];
const ACH_BY_ID = {};
ACHIEVEMENTS.forEach(a => ACH_BY_ID[a.id] = a);

/* ---------------------------------------------------------------------
   2. ZUSTAND
   --------------------------------------------------------------------- */

let state = null;
const SAVE_KEY = 'kontor_save_v1';

function freshState(name){
  const biz = {}, inv = {}, price = {}, auto = {};
  Object.keys(GOOD_BY_ID).forEach(id => { biz[id]=0; inv[id]=0; price[id]=GOOD_BY_ID[id].basePrice; auto[id]=false; });
  return {
    name: name || 'Mein Unternehmen',
    cash: 500,
    research: {},          // { researchId: true }
    researchPts: 0,
    biz,                   // { goodId: level }
    inv,                   // { goodId: amount }
    price,                 // { goodId: currentPrice }
    priceWave: Object.fromEntries(Object.keys(GOOD_BY_ID).map(id => [id, Math.random()*Math.PI*2])),
    auto,                  // { goodId: bool }
    employees: Object.fromEntries(EMPLOYEES.map(e => [e.id, 0])),
    shares: 0,
    achievements: {},      // { achId: true }
    achMultBonus: 0,
    day: 1,
    playSeconds: 0,
    lastTick: Date.now(),
    stats: { lifetimeEarned:0, totalSales:0, prestigeCount:0, sinceIpoEarned:0 },
    soundOn: true,
    uiOpen: { farm:true },
  };
}

/* ---------------------------------------------------------------------
   3. HILFSFUNKTIONEN
   --------------------------------------------------------------------- */

function fmt(n){
  const sign = n<0 ? '-' : '';
  n = Math.abs(n);
  if(n < 1000) return sign + (Math.round(n*10)/10).toLocaleString('de-DE');
  const units = [{v:1e12,s:'Bio'},{v:1e9,s:'Mrd'},{v:1e6,s:'Mio'},{v:1e3,s:'Tsd'}];
  for(const u of units){ if(n >= u.v) return sign + (n/u.v).toFixed(2).replace('.',',') + ' ' + u.s; }
  return sign + Math.round(n).toLocaleString('de-DE');
}
function fmtMoney(n){ return '€' + fmt(n); }

function totalLevels(s){ return Object.values(s.biz).reduce((a,b)=>a+b,0); }
function maxLevel(s){ return Object.values(s.biz).reduce((a,b)=>Math.max(a,b),0); }
function totalEmployeeLevels(s){ return Object.values(s.employees).reduce((a,b)=>a+b,0); }

function isIndustryOpen(s, ind){
  return !ind.openResearch || !!s.research[ind.openResearch];
}
function isGoodUnlocked(s, good){
  const ind = INDUSTRIES[good.industryIdx];
  if(!isIndustryOpen(s, ind)) return false;
  if(good.tierIdx === 0) return true;
  if(good.research && !s.research[good.research]) return false;
  const prevGood = ind.chain[good.tierIdx-1];
  return (s.biz[prevGood.id]||0) >= 3;
}

function buyerDiscount(s){
  return Math.max(0.4, 1 - 0.02*s.employees.buyer);
}
function costForLevel(good, level, s){
  return good.baseCost * Math.pow(good.costGrowth, level) * buyerDiscount(s);
}
function costForRange(good, fromLevel, count, s){
  const disc = buyerDiscount(s);
  const g = good.costGrowth;
  const base = good.baseCost * disc * Math.pow(g, fromLevel);
  if(Math.abs(g-1) < 1e-9) return base*count;
  return base * (Math.pow(g,count)-1) / (g-1);
}
function maxAffordable(good, fromLevel, cash, s){
  const disc = buyerDiscount(s);
  const g = good.costGrowth;
  const base = good.baseCost * disc * Math.pow(g, fromLevel);
  if(base > cash) return 0;
  let n = Math.floor(Math.log((cash*(g-1)/base) + 1) / Math.log(g));
  n = Math.max(0, n);
  while(costForRange(good, fromLevel, n+1, s) <= cash) n++;
  while(n > 0 && costForRange(good, fromLevel, n, s) > cash) n--;
  return n;
}

function storageMult(s){
  let m = 1;
  if(s.research.storage1) m += 1.0;
  if(s.research.storage2) m += 1.5;
  if(s.research.storage3) m += 2.0;
  m += 0.10 * s.employees.logist;
  return m;
}
function goodCap(s, good){ return good.cap * storageMult(s); }

function achievementMultTotal(s){
  let m = s.achMultBonus || 0;
  return m;
}
function prodMult(s){
  let m = 1;
  if(s.research.eff1) m += 0.15;
  if(s.research.eff2) m += 0.20;
  if(s.research.eff3) m += 0.25;
  m += 0.08 * s.employees.foreman;
  m += 0.02 * s.shares;
  m += achievementMultTotal(s);
  return m;
}
function sellPriceMult(s){
  let m = 1 + Math.min(0.40, 0.02*s.employees.analyst);
  return m;
}

/* ---------------------------------------------------------------------
   4. SIMULATION
   --------------------------------------------------------------------- */

// Führt genau 1 Sekunde Produktion + Marktbewegung aus.
function simTick(s, dtSeconds, offlineFactor){
  const mult = prodMult(s) * (offlineFactor === undefined ? 1 : offlineFactor);
  INDUSTRIES.forEach(ind => {
    ind.chain.forEach(good => {
      const level = s.biz[good.id] || 0;
      if(level <= 0) return;
      const cap = goodCap(s, good);
      if(!good.needs){
        const produced = good.baseRate * level * mult * dtSeconds;
        s.inv[good.id] = Math.min(cap, s.inv[good.id] + produced);
      } else {
        const wantOut = good.baseRate * level * mult * dtSeconds;
        const needIn = wantOut * good.ratio;
        const haveIn = s.inv[good.needs] || 0;
        const actualOut = haveIn >= needIn ? wantOut : (haveIn / good.ratio);
        if(actualOut > 0){
          s.inv[good.needs] = Math.max(0, s.inv[good.needs] - actualOut*good.ratio);
          s.inv[good.id] = Math.min(cap, (s.inv[good.id]||0) + actualOut);
        }
      }
    });
  });
  // Marktpreise: Sinuswelle + kleines Rauschen, driften zurück zur Basis
  Object.keys(GOOD_BY_ID).forEach(id => {
    s.priceWave[id] += dtSeconds * 0.05;
    const good = GOOD_BY_ID[id];
    const wave = Math.sin(s.priceWave[id]) * 0.18;
    const noise = (Math.random()-0.5) * 0.02;
    const target = good.basePrice * (1 + wave);
    s.price[id] += (target - s.price[id]) * Math.min(1, dtSeconds*0.15) + noise*good.basePrice;
    if(s.price[id] < good.basePrice*0.35) s.price[id] = good.basePrice*0.35;
  });
  // Auto-Verkauf
  if(s.research.automation){
    Object.keys(GOOD_BY_ID).forEach(id => {
      if(s.auto[id] && s.inv[id] > 0) sellGood(s, id, s.inv[id], true);
    });
  }
  // Forscher: passive Forschungspunkte
  s.researchPts += 0.5 * s.employees.researcher * dtSeconds;
  if(s.research.fastresearch) s.researchPts += 1 * dtSeconds;

  s.playSeconds += dtSeconds;
  s.day = 1 + Math.floor(s.playSeconds / 300); // 1 Spieltag ≈ 5 Minuten
}

function sellGood(s, id, amount, silent){
  amount = Math.min(amount, s.inv[id]);
  if(amount <= 0) return 0;
  const good = GOOD_BY_ID[id];
  const impactDampen = s.research.marketanalyse ? 0.5 : 1;
  const price = s.price[id] * sellPriceMult(s);
  const revenue = amount * price;
  s.inv[id] -= amount;
  s.cash += revenue;
  s.stats.lifetimeEarned += revenue;
  s.stats.sinceIpoEarned += revenue;
  s.stats.totalSales += 1;
  // Preis-Impact: großer Verkauf drückt Preis kurzzeitig
  const impact = Math.min(0.25, (amount/Math.max(1,good.cap)) * 0.3) * impactDampen;
  s.price[id] *= (1-impact);
  if(!silent) floatGain('+' + fmtMoney(revenue));
  return revenue;
}

/* ---------------------------------------------------------------------
   5. AKTIONEN
   --------------------------------------------------------------------- */

function buyBusiness(id, amount){
  const good = GOOD_BY_ID[id];
  if(!isGoodUnlocked(state, good)) return;
  const level = state.biz[id] || 0;
  let n = amount === 'max' ? maxAffordable(good, level, state.cash, state) : amount;
  n = Math.min(n, 9999);
  if(n <= 0) return;
  const cost = costForRange(good, level, n, state);
  if(cost > state.cash + 0.001) return;
  state.cash -= cost;
  state.biz[id] = level + n;
  checkAchievements();
  renderAll();
  playBeep(440, 0.05);
}

function unlockResearch(id){
  const node = RESEARCH_BY_ID[id];
  if(!node || state.research[id]) return;
  if(node.prereq.some(p => !state.research[p])) return;
  if(state.researchPts < node.cost) return;
  state.researchPts -= node.cost;
  state.research[id] = true;
  checkAchievements();
  renderAll();
  playBeep(660, 0.08);
  showToast('⚗ Forschung abgeschlossen: ' + node.name);
}

function hireEmployee(id){
  const emp = EMPLOYEE_BY_ID[id];
  const level = state.employees[id] || 0;
  const cost = Math.round(emp.baseCost * Math.pow(emp.growth, level));
  if(state.cash < cost) return;
  state.cash -= cost;
  state.employees[id] = level + 1;
  checkAchievements();
  renderAll();
  playBeep(520, 0.06);
}

function toggleAuto(id){
  if(!state.research.automation) return;
  state.auto[id] = !state.auto[id];
  renderAll();
}

function checkAchievements(){
  ACHIEVEMENTS.forEach(a => {
    if(!state.achievements[a.id] && a.cond(state)){
      state.achievements[a.id] = true;
      if(a.reward.cash) state.cash += a.reward.cash;
      if(a.reward.mult) state.achMultBonus = (state.achMultBonus||0) + a.reward.mult;
      showToast('🏆 Erfolg freigeschaltet: ' + a.name);
    }
  });
}

function prestigeThreshold(s){ return 500000 * Math.pow(4, s.stats.prestigeCount); }
function prestigeSharesPreview(s){ return Math.floor(Math.sqrt(s.stats.sinceIpoEarned/50000)); }

function doPrestige(){
  const gained = prestigeSharesPreview(state);
  if(gained <= 0) return;
  state.shares += gained;
  state.stats.prestigeCount += 1;
  state.stats.sinceIpoEarned = 0;
  state.cash = 500;
  Object.keys(state.biz).forEach(id => state.biz[id] = 0);
  Object.keys(state.inv).forEach(id => state.inv[id] = 0);
  Object.keys(GOOD_BY_ID).forEach(id => state.price[id] = GOOD_BY_ID[id].basePrice);
  checkAchievements();
  closeModal('modalPrestige');
  renderAll();
  showToast('📈 Börsengang abgeschlossen: +' + gained + ' Aktien');
}

/* ---------------------------------------------------------------------
   6. OFFLINE-FORTSCHRITT
   --------------------------------------------------------------------- */

function applyOfflineProgress(){
  const now = Date.now();
  let elapsed = (now - state.lastTick) / 1000;
  if(elapsed < 45){ state.lastTick = now; return; }
  const maxOffline = 12*3600;
  elapsed = Math.min(elapsed, maxOffline);
  const offlineFactor = state.research.offlineboost ? 1.0 : 0.5;
  const before = { cash: state.cash, inv: Object.assign({}, state.inv) };
  const step = 60;
  let remaining = elapsed;
  while(remaining > 0){
    const dt = Math.min(step, remaining);
    simTick(state, dt, offlineFactor);
    remaining -= dt;
  }
  const earned = state.cash - before.cash;
  const goodsGained = {};
  Object.keys(before.inv).forEach(id => {
    const diff = state.inv[id] - before.inv[id];
    if(diff > 0.5) goodsGained[id] = diff;
  });
  state.lastTick = now;
  const h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60);
  let timeStr = h > 0 ? `${h} Std ${m} Min` : `${m} Min`;
  let goodsStr = Object.entries(goodsGained)
    .sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([id,amt]) => `${GOOD_BY_ID[id].icon} ${fmt(amt)} ${GOOD_BY_ID[id].name}`).join(', ');
  let text = `Während du ${timeStr} weg warst, hat dein Unternehmen `;
  text += earned > 0 ? `<strong>${fmtMoney(earned)}</strong> erwirtschaftet.` : `weiterproduziert.`;
  if(goodsStr) text += `<br><br>Produziert: ${goodsStr}`;
  document.getElementById('offlineText').innerHTML = text;
  openModal('modalOffline');
}

/* ---------------------------------------------------------------------
   7. SPEICHERN / LADEN
   --------------------------------------------------------------------- */

function saveGame(){
  state.lastTick = Date.now();
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){ console.warn('Speichern fehlgeschlagen', e); }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    const loaded = JSON.parse(raw);
    const fresh = freshState(loaded.name);
    return Object.assign(fresh, loaded,
      { biz: Object.assign(fresh.biz, loaded.biz),
        inv: Object.assign(fresh.inv, loaded.inv),
        price: Object.assign(fresh.price, loaded.price),
        priceWave: Object.assign(fresh.priceWave, loaded.priceWave),
        auto: Object.assign(fresh.auto, loaded.auto),
        employees: Object.assign(fresh.employees, loaded.employees),
        stats: Object.assign(fresh.stats, loaded.stats) });
  }catch(e){ console.warn('Laden fehlgeschlagen', e); return null; }
}
function exportSave(){
  saveGame();
  const blob = new Blob([JSON.stringify(state)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'kontor-spielstand.json'; a.click();
  URL.revokeObjectURL(url);
}
function importSaveFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const loaded = JSON.parse(reader.result);
      const fresh = freshState(loaded.name);
      state = Object.assign(fresh, loaded);
      applyOfflineProgress();
      saveGame();
      renderAll();
      closeModal('modalSettings');
      showToast('Spielstand importiert');
    }catch(e){ alert('Diese Datei konnte nicht gelesen werden.'); }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------------
   8. UI: TOASTS / FLOAT-TEXT / SOUND
   --------------------------------------------------------------------- */

function showToast(msg){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3700);
}
function floatGain(text){
  const el = document.createElement('div');
  el.className = 'float-gain';
  el.textContent = text;
  el.style.left = (40 + Math.random()*40) + '%';
  el.style.top = '120px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
let audioCtx = null;
function playBeep(freq, dur){
  if(!state || !state.soundOn) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  }catch(e){}
}

/* ---------------------------------------------------------------------
   9. RENDERING
   --------------------------------------------------------------------- */

let activeTab = 'overview';

function renderHeader(){
  document.getElementById('companyName').textContent = state.name;
  document.getElementById('hCash').textContent = fmtMoney(state.cash);
  document.getElementById('hResearch').textContent = fmt(state.researchPts);
  document.getElementById('hShares').textContent = fmt(state.shares);
  document.getElementById('hDay').textContent = state.day;
}

function renderTicker(){
  const parts = [];
  Object.keys(GOOD_BY_ID).forEach(id => {
    const good = GOOD_BY_ID[id];
    if(!isGoodUnlocked(state, good)) return;
    const diff = state.price[id] - good.basePrice;
    const cls = diff >= 0 ? 'up' : 'down';
    const arrow = diff >= 0 ? '▲' : '▼';
    parts.push(`${good.icon} ${good.name} <span class="${cls}">${fmtMoney(state.price[id])} ${arrow}</span>`);
  });
  const news = [
    'Marktanalysten beobachten die Lieferketten aufmerksam.',
    'Neue Handelsrouten sorgen für Bewegung an den Rohstoffmärkten.',
    `${state.name} verzeichnet stabiles Wachstum.`,
    'Investoren richten den Blick auf innovative Betriebe.',
  ];
  parts.push(news[Math.floor(state.day) % news.length]);
  document.getElementById('tickerTrack').innerHTML = parts.join('<span class="ticker-sep">•</span>');
}

function renderOverview(){
  const el = document.getElementById('tab-overview');
  const netWorth = state.cash + Object.keys(state.inv).reduce((sum,id)=>sum + state.inv[id]*state.price[id], 0);
  const incomeRate = Object.keys(GOOD_BY_ID).reduce((sum,id) => {
    if(!state.auto[id]) return sum;
    const good = GOOD_BY_ID[id];
    const level = state.biz[id]||0;
    if(level<=0 || good.needs) return sum;
    return sum + good.baseRate*level*prodMult(state)*state.price[id];
  }, 0);
  const threshold = prestigeThreshold(state);
  const progress = Math.min(100, 100*state.stats.sinceIpoEarned/threshold);
  const sharesPreview = prestigeSharesPreview(state);

  let html = `<div class="section-title">Kennzahlen</div>
  <div class="card-grid">
    <div class="stat-card"><div class="k">Nettovermögen</div><div class="v gold">${fmtMoney(netWorth)}</div></div>
    <div class="stat-card"><div class="k">Einnahmen/Sek (Auto)</div><div class="v green">${fmtMoney(incomeRate)}</div></div>
    <div class="stat-card"><div class="k">Betriebe gesamt</div><div class="v">${totalLevels(state)}</div></div>
    <div class="stat-card"><div class="k">Aktien</div><div class="v">${fmt(state.shares)} <span style="font-size:11px;color:var(--text-faint)">(+${(state.shares*2)}% Prod.)</span></div></div>
  </div>`;

  html += `<div class="section-title">Branchen im Überblick</div><div class="card-grid">`;
  INDUSTRIES.forEach(ind => {
    const open = isIndustryOpen(state, ind);
    const lvl = ind.chain.reduce((sum,g)=>sum+(state.biz[g.id]||0),0);
    html += `<div class="stat-card"><div class="k">${ind.icon} ${ind.name}</div>
      <div class="v" style="font-size:15px">${open ? lvl + ' Stufen gesamt' : '🔒 gesperrt'}</div></div>`;
  });
  html += `</div>`;

  if(sharesPreview >= 1){
    html += `<div class="ipo-banner"><div><h3>Börsengang verfügbar</h3><p>Erhalte ${sharesPreview} Aktien (+${sharesPreview*2}% dauerhafte Produktion) im Tausch gegen einen Neustart deiner Betriebe.</p></div>
    <button class="btn green" data-action="openPrestige">Details</button></div>`;
  } else {
    html += `<div class="section-title">Nächster Börsengang</div>
    <div class="stat-card"><div class="k">Fortschritt (${fmtMoney(state.stats.sinceIpoEarned)} / ${fmtMoney(threshold)})</div>
    <div class="progress-outer"><div class="progress-inner" style="width:${progress}%"></div></div></div>`;
  }

  const unlocked = Object.keys(state.achievements);
  if(unlocked.length){
    html += `<div class="section-title">Zuletzt erreicht</div><div class="card-grid">`;
    unlocked.slice(-3).reverse().forEach(id => {
      const a = ACH_BY_ID[id];
      html += `<div class="stat-card"><div class="k">${a.icon} ${a.name}</div><div style="font-size:12px;color:var(--text-dim)">${a.desc}</div></div>`;
    });
    html += `</div>`;
  }

  el.innerHTML = html;
}

function renderBusinesses(){
  const el = document.getElementById('tab-businesses');
  let html = '';
  INDUSTRIES.forEach(ind => {
    const open = isIndustryOpen(state, ind);
    const isOpenUi = !!state.uiOpen[ind.id];
    const totalLvl = ind.chain.reduce((sum,g)=>sum+(state.biz[g.id]||0),0);
    html += `<div class="industry ${isOpenUi?'open':''}" data-industry="${ind.id}">
      <div class="industry-head" data-action="toggleIndustry" data-id="${ind.id}">
        <span class="icon">${ind.icon}</span>
        <div class="info"><div class="name">${ind.name}</div><div class="sub">${open? totalLvl+' Stufen gesamt' : 'Gesperrt — Forschung erforderlich'}</div></div>
        <span class="chev">›</span>
      </div>
      <div class="industry-body">`;
    if(!open){
      const reqNode = RESEARCH_BY_ID[ind.openResearch];
      html += `<div class="biz-locked">🔒 Erfordert Forschung: <strong>${reqNode.name}</strong> (${reqNode.cost} Forschungspunkte)</div>`;
    } else {
      ind.chain.forEach(good => {
        const unlocked = isGoodUnlocked(state, good);
        if(!unlocked){
          let reqTxt;
          if(good.research && !state.research[good.research]){
            reqTxt = 'Forschung: ' + RESEARCH_BY_ID[good.research].name;
          } else {
            reqTxt = ind.chain[good.tierIdx-1].bName + ' auf Stufe 3 bringen';
          }
          html += `<div class="biz"><div class="biz-top"><span class="biz-icon">🔒</span>
            <div><div class="biz-name">${good.bName}</div><div class="biz-meta">${reqTxt}</div></div></div></div>`;
          return;
        }
        const level = state.biz[good.id] || 0;
        const cost1 = costForLevel(good, level, state);
        const cost10 = costForRange(good, level, 10, state);
        const rate = good.baseRate*Math.max(level,0)*prodMult(state);
        const rateTxt = good.needs
          ? `${rate.toFixed(2)}/s ${good.name} (verbraucht ${(rate*good.ratio).toFixed(2)}/s ${GOOD_BY_ID[good.needs].name})`
          : `${rate.toFixed(2)}/s ${good.name}`;
        html += `<div class="biz">
          <div class="biz-top">
            <span class="biz-icon">${good.bIcon}</span>
            <div><div class="biz-name">${good.bName}</div><div class="biz-meta">${rateTxt}</div></div>
            <div class="biz-level">Stufe ${level}</div>
          </div>
          <div class="biz-buy-row">
            <button class="btn small" data-action="buy" data-id="${good.id}" data-amt="1" ${cost1>state.cash?'disabled':''}>+1 · ${fmtMoney(cost1)}</button>
            <button class="btn small" data-action="buy" data-id="${good.id}" data-amt="10" ${cost10>state.cash?'disabled':''}>+10 · ${fmtMoney(cost10)}</button>
            <button class="btn small primary" data-action="buy" data-id="${good.id}" data-amt="max">Max</button>
          </div>
        </div>`;
      });
    }
    html += `</div></div>`;
  });
  el.innerHTML = html;
}

function renderMarket(){
  const el = document.getElementById('tab-market');
  let html = '';
  let any = false;
  INDUSTRIES.forEach(ind => {
    ind.chain.forEach(good => {
      if(!isGoodUnlocked(state, good)) return;
      any = true;
      const amt = state.inv[good.id]||0;
      const cap = goodCap(state, good);
      const price = state.price[good.id];
      const diff = price - good.basePrice;
      const trendCls = diff>=0?'up':'down';
      const trendArrow = diff>=0?'▲':'▼';
      const canAuto = !!state.research.automation;
      html += `<div class="good-row">
        <span class="good-icon">${good.icon}</span>
        <div class="good-info">
          <div class="good-name">${good.name}</div>
          <div class="good-sub">${fmt(amt)} / ${fmt(cap)} auf Lager</div>
        </div>
        <div class="good-price">
          <div class="p">${fmtMoney(price)}</div>
          <div class="t ${trendCls}">${trendArrow} ${Math.abs(diff/good.basePrice*100).toFixed(0)}%</div>
        </div>
        <div class="good-actions">
          <button class="btn small" data-action="sell" data-id="${good.id}" ${amt<=0?'disabled':''}>Verkaufen</button>
          <div class="auto-toggle ${state.auto[good.id]&&canAuto?'on':''}" data-action="toggleAuto" data-id="${good.id}" style="${canAuto?'':'opacity:.35'}">
            ${state.auto[good.id]&&canAuto?'✓ Auto':'Auto'}
          </div>
        </div>
      </div>`;
    });
  });
  if(!any) html = `<div class="empty-note">Noch keine Güter verfügbar. Eröffne zunächst einen Bauernhof unter „Betriebe“.</div>`;
  el.innerHTML = html;
}

function renderResearch(){
  const el = document.getElementById('tab-research');
  const cats = ['Expansion','Produktion','Infrastruktur','Effizienz','Automatisierung'];
  let html = '';
  cats.forEach(cat => {
    const nodes = RESEARCH.filter(r => r.cat === cat);
    html += `<div class="section-title">${cat}</div><div class="rgrid">`;
    nodes.forEach(r => {
      const done = !!state.research[r.id];
      const locked = !done && r.prereq.some(p => !state.research[p]);
      html += `<div class="rnode ${done?'done':''} ${locked?'locked':''}">
        <div class="rname">${done?'✓ ':''}${r.name}</div>
        <div class="rdesc">${r.desc}</div>
        <div class="rfoot">
          <span class="rcost">${done?'Abgeschlossen':r.cost+' ⚗'}</span>
          ${!done ? `<button class="btn small ${locked?'':'primary'}" data-action="research" data-id="${r.id}" ${locked||state.researchPts<r.cost?'disabled':''}>${locked?'Gesperrt':'Erforschen'}</button>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

function renderTeam(){
  const el = document.getElementById('tab-team');
  let html = `<div class="section-title">Team</div>`;
  EMPLOYEES.forEach(emp => {
    const level = state.employees[emp.id]||0;
    const cost = Math.round(emp.baseCost * Math.pow(emp.growth, level));
    html += `<div class="emp-card">
      <span class="emp-icon">${emp.icon}</span>
      <div class="emp-info">
        <div class="emp-name">${emp.name}</div>
        <div class="emp-desc">${emp.desc}</div>
        <div class="emp-lvl">Stufe ${level}</div>
      </div>
      <button class="btn small primary" data-action="hire" data-id="${emp.id}" ${cost>state.cash?'disabled':''}>${fmtMoney(cost)}</button>
    </div>`;
  });
  el.innerHTML = html;
}

function renderAchievements(){
  const el = document.getElementById('tab-achievements');
  let html = `<div class="section-title">Erfolge (${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length})</div><div class="ach-grid">`;
  ACHIEVEMENTS.forEach(a => {
    const done = !!state.achievements[a.id];
    html += `<div class="ach ${done?'unlocked':''}">
      <div class="aicon">${done?a.icon:'❔'}</div>
      <div class="aname">${a.name}</div>
      <div class="adesc">${done ? a.desc : '???'}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function renderAll(){
  renderHeader();
  if(activeTab==='overview') renderOverview();
  else if(activeTab==='businesses') renderBusinesses();
  else if(activeTab==='market') renderMarket();
  else if(activeTab==='research') renderResearch();
  else if(activeTab==='team') renderTeam();
  else if(activeTab==='achievements') renderAchievements();
}

function switchTab(tab){
  activeTab = tab;
  document.querySelectorAll('.tabpane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  renderAll();
}

/* ---------------------------------------------------------------------
   10. MODALS
   --------------------------------------------------------------------- */
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }

/* ---------------------------------------------------------------------
   11. EVENT-HANDLING
   --------------------------------------------------------------------- */

function handleAction(target){
  const action = target.dataset.action;
  const id = target.dataset.id;
  if(action==='buy'){
    const amt = target.dataset.amt === 'max' ? 'max' : parseInt(target.dataset.amt,10);
    buyBusiness(id, amt);
  } else if(action==='sell'){
    const amount = state.inv[id]||0;
    if(amount>0){ sellGood(state, id, amount); renderAll(); }
  } else if(action==='toggleAuto'){
    toggleAuto(id);
  } else if(action==='research'){
    unlockResearch(id);
  } else if(action==='hire'){
    hireEmployee(id);
  } else if(action==='toggleIndustry'){
    state.uiOpen[id] = !state.uiOpen[id];
    renderBusinesses();
  } else if(action==='openPrestige'){
    const gained = prestigeSharesPreview(state);
    document.getElementById('prestigeText').innerHTML =
      `Du erhältst <strong>${gained} Aktien</strong> (dauerhaft +${gained*2}% Produktion in allen Betrieben).`;
    openModal('modalPrestige');
  }
}

function initEvents(){
  document.querySelectorAll('#tabbar button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('main .tabpane').forEach(pane => {
    pane.addEventListener('click', e => {
      const t = e.target.closest('[data-action]');
      if(t) handleAction(t);
    });
  });
  document.getElementById('gearBtn').addEventListener('click', () => {
    document.getElementById('renameInput').value = state.name;
    document.getElementById('soundBtn').textContent = state.soundOn ? '🔊 Sound: An' : '🔇 Sound: Aus';
    openModal('modalSettings');
  });
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    const newName = document.getElementById('renameInput').value.trim();
    if(newName) state.name = newName.slice(0,24);
    saveGame(); renderAll();
    closeModal('modalSettings');
  });
  document.getElementById('saveNowBtn').addEventListener('click', () => { saveGame(); showToast('Gespeichert'); });
  document.getElementById('exportBtn').addEventListener('click', exportSave);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e => {
    if(e.target.files[0]) importSaveFile(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('soundBtn').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    document.getElementById('soundBtn').textContent = state.soundOn ? '🔊 Sound: An' : '🔇 Sound: Aus';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm('Wirklich das gesamte Spiel zurücksetzen? Dies kann nicht rückgängig gemacht werden.')){
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  });
  document.getElementById('closeOfflineBtn').addEventListener('click', () => closeModal('modalOffline'));
  document.getElementById('cancelPrestigeBtn').addEventListener('click', () => closeModal('modalPrestige'));
  document.getElementById('confirmPrestigeBtn').addEventListener('click', doPrestige);
  document.getElementById('startGameBtn').addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim();
    state = freshState(name || 'Mein Unternehmen');
    saveGame();
    closeModal('modalWelcome');
    renderAll();
  });
}

/* ---------------------------------------------------------------------
   12. GAME LOOP & INIT
   --------------------------------------------------------------------- */

function tick(){
  const now = Date.now();
  let dt = (now - state.lastTick)/1000;
  dt = Math.min(dt, 5);
  state.lastTick = now;
  simTick(state, dt);
  renderHeader();
  renderTicker();
  if(activeTab==='overview') renderOverview();
  else if(activeTab==='businesses') renderBusinesses();
  else if(activeTab==='market') renderMarket();
}

let tickHandle = null, saveHandle = null, tickerRefreshHandle = null;

function init(){
  initEvents();
  const loaded = loadGame();
  if(loaded){
    state = loaded;
    applyOfflineProgress();
    renderAll();
    renderTicker();
  } else {
    state = freshState('Mein Unternehmen');
    openModal('modalWelcome');
    renderAll();
  }
  tickHandle = setInterval(tick, 1000);
  saveHandle = setInterval(saveGame, 15000);
  tickerRefreshHandle = setInterval(renderTicker, 9000);
  document.addEventListener('visibilitychange', () => { if(document.hidden) saveGame(); });
  window.addEventListener('pagehide', saveGame);
}

document.addEventListener('DOMContentLoaded', init);
