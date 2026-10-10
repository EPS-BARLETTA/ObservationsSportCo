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
