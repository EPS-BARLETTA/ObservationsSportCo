const C=require('../core.js'),assert=require('node:assert/strict');
for(let n=2;n<=8;n++){
 const s={teams:Array.from({length:n},(_,i)=>({id:'t'+i,name:'Équipe '+i})),matches:[]};
 C.ensurePool(s);assert.equal(s.matches.length,n*(n-1)/2);
 const pairs=new Set(s.matches.map(m=>[m.a,m.b].sort().join(':')));assert.equal(pairs.size,s.matches.length);
 assert(s.matches.every(m=>m.scoreA===null&&m.scoreB===null));assert(C.standings(s).every(r=>r.played===0));
 const first=s.matches[0];C.setScore(first,'a',0);C.setScore(first,'b',0);first.notes.test='Conserver';const ids=s.matches.map(m=>m.id);
 C.ensurePool(s);assert.deepEqual(s.matches.map(m=>m.id),ids);assert.equal(first.notes.test,'Conserver');assert.equal(C.standings(s).filter(r=>r.played===1&&r.points===1).length,2);
 s.teams.push({id:'extra',name:'Nouvelle équipe'});C.ensurePool(s);assert.equal(s.matches.length,n*(n+1)/2);assert.deepEqual(s.matches.slice(0,ids.length).map(m=>m.id),ids);
}
console.log('PASS: poules de 2 à 8 équipes, toutes les paires uniques, scores vides exclus, nul 0–0 compté, historique conservé et ajout d’équipe.');
for(let n=2;n<=9;n++){
 const s={teams:Array.from({length:n},(_,i)=>({id:'t'+i,name:'Équipe '+i})),matches:[]};
 const rounds=C.poolRotations(s),seen=new Set(),refCounts=new Map();
 assert.equal(rounds.length,n%2?n:n-1);
 for(const r of rounds){const busy=new Set();assert.equal(r.matches.length,Math.floor(n/2));for(const m of r.matches){assert(!busy.has(m.a)&&!busy.has(m.b));busy.add(m.a);busy.add(m.b);assert(!seen.has(m.id));seen.add(m.id)}for(const id of r.referees){assert(!busy.has(id));refCounts.set(id,(refCounts.get(id)||0)+1)}}
 assert.equal(seen.size,n*(n-1)/2);if(n%2)assert(s.teams.every(t=>refCounts.get(t.id)===1));
 const first=s.matches[0];first.scoreA=3;first.scoreB=1;first.notes.test='Gardé';C.addMatch(s,first.a,first.b);const all=C.poolRotations(s).flatMap(r=>r.matches);assert.equal(all.length,s.matches.length);assert.equal(new Set(all.map(m=>m.id)).size,all.length);assert.equal(first.notes.test,'Gardé');assert.equal(first.scoreA,3);
}
console.log('PASS: rotations sans conflit, toutes les rencontres, arbitrage équilibré et matchs supplémentaires conservés.');
