const assert=require('node:assert/strict'),C=require('../core.js');
const db=C.empty(),{c,s}=C.addClass(db,'4B',Array.from({length:14},(_,i)=>'Élève '+i).join('\n'));
const ids=c.students.map(p=>p.id),a=C.putTeam(s,c,ids.slice(0,4),'Bleus',C.colors[0]),b=C.putTeam(s,c,ids.slice(4,8),'Oranges',C.colors[1]);
assert.throws(()=>C.putTeam(s,c,ids.slice(0,3),'Duplicata',C.colors[2]));
assert.throws(()=>C.putTeam(s,c,ids.slice(8,10),'Deux',C.colors[2]));
assert.throws(()=>C.putTeam(s,c,ids.slice(0,7),'Sept',C.colors[2]));
const k=C.addCriterion(s,'Objectif personnel','individual','binary',[ids[0]]);
assert.deepEqual(k.targets,[ids[0]]);
C.setObservation(s,'',ids[0],k.id,0);assert.equal(s.observations[ids[0]][k.id],0);
C.setObservation(s,'',ids[0],k.id,null);assert.equal(s.observations[ids[0]][k.id],undefined);
const m=C.addMatch(s,a.id,b.id);C.setScore(m,'a',3);assert.equal(C.standings(s)[0].played,0);
C.setScore(m,'b',1);assert.equal(C.standings(s)[0].team.id,a.id);assert.equal(C.standings(s)[0].points,3);
C.setObservation(s,m.id,ids[0],k.id,1);C.setObservation(s,'',ids[0],k.id,0);assert.equal(m.observations[ids[0]][k.id],1);assert.equal(s.observations[ids[0]][k.id],0);
assert.throws(()=>C.setScore(m,'b',-1));assert.throws(()=>C.setScore(m,'b',1.2));assert.equal(m.scoreB,1);
assert.throws(()=>C.addMatch(s,a.id,a.id));
const prior=JSON.stringify(s),next=C.newSession(db,c.id,s);assert.equal(JSON.stringify(s),prior);assert.equal(next.matches.length,0);assert.deepEqual(next.observations,{});assert.deepEqual(next.teams,s.teams);assert.notEqual(next.teams,s.teams);next.teams[0].name='Renommée';assert.equal(s.teams[0].name,'Bleus');
assert.equal(C.appendStudents(c,'Élève 0\nNouvel élève'),1);
assert.deepEqual(C.validate(JSON.parse(JSON.stringify(db))),db);
for(const mutate of [d=>d.sessions[0].teams[1].members[0]=ids[0],d=>d.sessions[0].matches[0].b=a.id,d=>d.sessions[0].matches[0].scoreA=-1,d=>d.sessions[0].observations[ids[0]][k.id]=4,d=>d.sessions[0].teams[0].color='url(evil)',d=>d.sessions[0].criteria[0].targets=['unknown']]){const bad=structuredClone(db);mutate(bad);assert.throws(()=>C.validate(bad))}
console.log('PASS: équipes uniques et limites, cibles individuelles, zéro distinct du vide, contextes par match, classement, scores invalides, historique et import.');


const oldSession=JSON.stringify(s),mover=next.teams[0].members[0];
C.moveStudent(next,c,mover,next.teams[1].id);
assert(!next.teams[0].members.includes(mover));assert(next.teams[1].members.includes(mover));
assert.equal(JSON.stringify(s),oldSession);
C.moveStudent(next,c,next.teams[0].members[0],'');assert.equal(next.teams[0].members.length,2);
assert.doesNotThrow(()=>C.validate(db));
C.moveStudent(next,c,ids[12],next.teams[1].id);assert.equal(next.teams[1].members.length,6);
const beforeFailed=JSON.stringify(next);assert.throws(()=>C.moveStudent(next,c,ids[13],next.teams[1].id));assert.equal(JSON.stringify(next),beforeFailed);
console.log('PASS: déplacement unique, équipe réduite, capacité, historique conservé et import après déplacement.');

const roster='Nom;Prénom;Date de naissance;Sexe\nTEST;Alex;01/02/2013;Masculin;ANGLAIS\nDE TEST;Louise;03/04/2014;Féminin;ALLEMAND\nTEST Alex01/02/2013 Masculin';
assert.equal(C.cleanRoster(roster),'TEST Alex\nDE TEST Louise');
assert.equal(C.cleanRoster('D’EXEMPLE Jean-Pierre\nLE TEST Anaïs'),'D’EXEMPLE Jean-Pierre\nLE TEST Anaïs');
const deleted=C.empty(),one=C.addClass(deleted,'Classe à retirer','Fictif Un\nFictif Deux\nFictif Trois'),two=C.addClass(deleted,'Classe conservée','Fictif Autre');
C.newSession(deleted,one.c.id,one.s);deleted.selectedClass=one.c.id;
const kept=JSON.stringify(two);C.removeClass(deleted,one.c.id);
assert.equal(deleted.classes.length,1);assert(deleted.sessions.every(s=>s.classId===two.c.id));assert.equal(deleted.selectedClass,two.c.id);assert.equal(JSON.stringify(two),kept);assert.doesNotThrow(()=>C.validate(deleted));
C.removeClass(deleted,two.c.id);assert.equal(deleted.classes.length,0);assert.equal(deleted.sessions.length,0);assert.equal(deleted.selectedClass,'');assert.equal(deleted.selectedSession,'');assert.doesNotThrow(()=>C.validate(deleted));
assert.throws(()=>C.removeClass(deleted,'inconnue'));
console.log('PASS: nettoyage Pronote, noms composés, suppression ciblée, autres classes préservées et suppression de la dernière classe.');

const pronote='\uFEFFÉlèves;Encouragement/Valorisation;Né(e) le;Sexe;Adresse E-mail\r\n"TEST Alex";"Bravo";"01/01/2013";"Masculin";"autre@example.test"\r\n"DE TEST Anaïs";"Bravo;\nContinue";"02/02/2014";"Féminin";""';
assert.equal(C.cleanRoster(pronote),'TEST Alex\nDE TEST Anaïs');
assert.equal(C.cleanRoster('Prénom;Divers;Nom\nAnaïs;note;DE TEST'),'DE TEST Anaïs');
assert.equal(C.cleanRoster('Élèves Encouragement/Valorisation Né(e) le Sexe Adresse E-mail'),'');
const fixdb=C.empty(),fix=C.addClass(fixdb,'À nettoyer','Élèves Encouragement/Valorisation Né(e) le Sexe\nTEST Alex 01/01/2013 Masculin\nDE TEST Anaïs\nFICTIF Lou');
const fi=fix.c.students.map(p=>p.id);C.putTeam(fix.s,fix.c,fi.slice(1),'Bleus',C.colors[0]);C.setObservation(fix.s,'',fi[1],fix.s.criteria[0].id,2);
assert.deepEqual(C.repairClassRoster(fixdb,fix.c.id),{renamed:1,removed:1});assert.equal(fix.c.students[0].id,fi[1]);assert.equal(fix.c.students[0].name,'TEST Alex');assert.equal(fix.s.observations[fi[1]][fix.s.criteria[0].id],2);assert.doesNotThrow(()=>C.validate(fixdb));
console.log('PASS: colonne Élèves Pronote, titres exclus, noms séparés, guillemets CSV et réparation avec identifiants et observations conservés.');

const timed={};C.clockDuration(timed,60);C.clockStart(timed,1000);assert.equal(C.clockRemaining(timed,11000),50000);C.clockPause(timed,16000);assert.equal(C.clockRemaining(timed,90000),45000);C.clockStart(timed,100000);assert.equal(C.clockRemaining(timed,110000),35000);assert.equal(C.clockRemaining(timed,200000),0);C.clockPause(timed,200000);assert.throws(()=>C.clockStart(timed,210000));C.clockReset(timed);assert.equal(C.clockRemaining(timed),60000);C.clockStart(timed,1000);assert.throws(()=>C.clockDuration(timed,120));assert.throws(()=>C.clockDuration({},0));
const stored=JSON.parse(JSON.stringify(timed));assert.equal(C.clockRemaining(stored,11000),50000);console.log('PASS: chrono pause/reprise, échéance après fermeture, remise à zéro et durées invalides.');

C.clockReset(timed);assert.equal(timed.clock.running,false);assert.equal(C.clockRemaining(timed),60000);m.clock=structuredClone(timed.clock);assert.doesNotThrow(()=>C.validate(db));const badTimer=structuredClone(db);badTimer.sessions[0].matches[0].clock.durationMs=0;assert.throws(()=>C.validate(badTimer));

C.clockDuration(s,120);C.clockStart(s,1000);assert.equal(C.clockRemaining(s,31000),90000);assert.doesNotThrow(()=>C.validate(db));const savedSessionClock=JSON.parse(JSON.stringify(db));assert.equal(C.clockRemaining(savedSessionClock.sessions[0],31000),90000);const badSessionClock=structuredClone(db);badSessionClock.sessions[0].clock.durationMs=0;assert.throws(()=>C.validate(badSessionClock));assert.equal(next.clock,undefined);console.log('PASS: chrono libre sans match, sauvegarde et nouvelle séance indépendante.');

const fast=C.quickMatch(s,a.id,b.id,true);assert.equal(fast.scoreA,0);assert.equal(fast.scoreB,0);const nMatches=s.matches.length;assert.equal(C.quickMatch(s,b.id,a.id).id,fast.id);assert.equal(s.matches.length,nMatches);C.changeTeamScore(s,fast.id,b.id,1);assert.equal(fast.scoreB,1);C.changeTeamScore(s,fast.id,a.id,1);assert.equal(fast.scoreA,1);C.changeTeamScore(s,fast.id,a.id,-1);C.changeTeamScore(s,fast.id,a.id,-1);assert.equal(fast.scoreA,0);assert.throws(()=>C.changeTeamScore(s,fast.id,'inconnue',1));assert.throws(()=>C.quickMatch(s,a.id,a.id));const again=C.quickMatch(s,a.id,b.id,true);assert.notEqual(again.id,fast.id);assert.equal(fast.scoreB,1);assert.doesNotThrow(()=>C.validate(db));console.log('PASS: score rapide par équipe, sens inverse, reprise sans doublon et nouvelle rencontre indépendante.');
