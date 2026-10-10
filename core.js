(function(root){
'use strict';
const colors=['#245de9','#d56c17','#168663','#8e54b5','#b83d65','#267d91','#766520','#595f6a'];
const uid=()=> 'id_'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now()).replace(/-/g,'');
const empty=()=>({version:1,classes:[],sessions:[],selectedClass:'',selectedSession:''});
function addClass(db,name,names){if(!name.trim())throw Error('Donne un nom à la classe.');const c={id:uid(),name:name.trim(),students:[]};db.classes.push(c);appendStudents(c,names);db.selectedClass=c.id;const s=newSession(db,c.id);return {c,s}}
function appendStudents(c,text){const seen=new Set(c.students.map(p=>p.name.toLocaleLowerCase('fr')));let count=0;for(const name of text.split(/\r?\n/).map(n=>n.trim()).filter(Boolean)){const key=name.toLocaleLowerCase('fr');if(!seen.has(key)){c.students.push({id:uid(),name});seen.add(key);count++}}return count}
function newSession(db,classId,previous){const s={id:uid(),classId,label:'Séance '+(db.sessions.filter(x=>x.classId===classId).length+1),date:new Date().toLocaleDateString('sv-SE'),sport:previous?.sport||'Basketball',teams:previous?structuredClone(previous.teams):[],criteria:previous?structuredClone(previous.criteria):[
{id:uid(),label:'Se démarquer',scope:'individual',type:'level',targets:null},
{id:uid(),label:'Réussir une passe',scope:'individual',type:'counter',targets:null},
{id:uid(),label:'Occuper la largeur',scope:'team',type:'level',targets:null}],absent:[],matches:[],observations:{},notes:{}};db.sessions.push(s);db.selectedSession=s.id;return s}
function putTeam(s,c,ids,name,color,id){if(ids.length<3||ids.length>6)throw Error('Sélectionne de 3 à 6 élèves.');if(new Set(ids).size!==ids.length||ids.some(x=>!c.students.some(p=>p.id===x)))throw Error('Sélection invalide.');if(s.teams.some(t=>t.id!==id&&t.members.some(x=>ids.includes(x))))throw Error('Un élève appartient déjà à une autre équipe.');const team={id:id||uid(),name:name.trim()||'Équipe '+(s.teams.length+1),color:colors.includes(color)?color:colors[s.teams.length%colors.length],members:ids.slice()};const at=s.teams.findIndex(t=>t.id===id);if(at<0)s.teams.push(team);else s.teams[at]=team;return team}
function moveStudent(s,c,pupilId,targetId){
 if(!c.students.some(p=>p.id===pupilId))throw Error('Élève inconnu.');
 const target=targetId?s.teams.find(t=>t.id===targetId):null;
 if(targetId&&!target)throw Error('Équipe inconnue.');
 if(target&&target.members.includes(pupilId))return;
 if(target&&target.members.length>=6)throw Error('Cette équipe compte déjà six élèves.');
 for(const t of s.teams)t.members=t.members.filter(id=>id!==pupilId);
 if(target)target.members.push(pupilId);
}
function addCriterion(s,label,scope,type,targets){if(!label.trim())throw Error('Écris ce que tu souhaites observer.');if(!['individual','team'].includes(scope)||!['level','binary','counter'].includes(type))throw Error('Critère invalide.');if(scope==='individual'&&Array.isArray(targets)&&!targets.length)throw Error('Sélectionne au moins un élève.');const criterion={id:uid(),label:label.trim(),scope,type,targets:scope==='team'?null:targets};s.criteria.push(criterion);return criterion}
function setObservation(s,matchId,subject,criterionId,value){const criterion=s.criteria.find(c=>c.id===criterionId);if(!criterion)throw Error('Critère inconnu.');if(value!==null&&(!Number.isInteger(value)||value<0||(criterion.type==='level'&&value>3)||(criterion.type==='binary'&&value>1)||(criterion.type==='counter'&&value>9999)))throw Error('Observation invalide.');const context=matchId?s.matches.find(m=>m.id===matchId):s;if(!context)throw Error('Match inconnu.');context.observations||={};context.observations[subject]||={};if(value===null)delete context.observations[subject][criterionId];else context.observations[subject][criterionId]=value}
function addMatch(s,a,b){if(a===b||![a,b].every(id=>s.teams.some(t=>t.id===id)))throw Error('Choisis deux équipes différentes.');const m={id:uid(),a,b,scoreA:null,scoreB:null,observations:{},notes:{}};s.matches.push(m);return m}
function setScore(m,side,value){if(!['a','b'].includes(side)||value!==null&&(!Number.isInteger(value)||value<0||value>9999))throw Error('Score invalide.');m[side==='a'?'scoreA':'scoreB']=value}
function standings(s){const rows=s.teams.map(t=>({team:t,played:0,w:0,d:0,l:0,for:0,against:0,points:0}));for(const m of s.matches){if(m.scoreA===null||m.scoreB===null)continue;const a=rows.find(r=>r.team.id===m.a),b=rows.find(r=>r.team.id===m.b);if(!a||!b)continue;a.played++;b.played++;a.for+=m.scoreA;a.against+=m.scoreB;b.for+=m.scoreB;b.against+=m.scoreA;if(m.scoreA===m.scoreB){a.d++;b.d++;a.points++;b.points++}else{const win=m.scoreA>m.scoreB?a:b,lose=win===a?b:a;win.w++;lose.l++;win.points+=3}}return rows.sort((a,b)=>b.points-a.points||(b.for-b.against)-(a.for-a.against)||b.for-a.for)}
function valuesFor(s,subject,criterion){return [s,...s.matches].map(x=>x.observations?.[subject]?.[criterion]).filter(v=>v!==undefined)}
function validate(db){
 if(!db||db.version!==1||!Array.isArray(db.classes)||!Array.isArray(db.sessions)||db.classes.length>200||db.sessions.length>2000)throw Error('Sauvegarde incompatible.');
 const ids=new Set(),id=x=>{if(typeof x!=='string'||!/^id_[a-zA-Z0-9]+$/.test(x)||ids.has(x))throw Error('Identifiant invalide.');ids.add(x)},str=x=>{if(typeof x!=='string'||x.length>1000)throw Error('Texte invalide.');};
 for(const c of db.classes){id(c.id);str(c.name);if(!Array.isArray(c.students)||c.students.length>1000)throw Error('Classe invalide.');for(const p of c.students){id(p.id);str(p.name)}}
 for(const s of db.sessions){id(s.id);const c=db.classes.find(c=>c.id===s.classId);if(!c)throw Error('Classe inconnue.');str(s.label);str(s.date);str(s.sport);if(!Array.isArray(s.teams)||!Array.isArray(s.criteria)||!Array.isArray(s.absent)||!Array.isArray(s.matches)||s.teams.length>200||s.criteria.length>50||s.matches.length>1000)throw Error('Séance invalide.');const pupilIds=new Set(c.students.map(p=>p.id)),teamIds=new Set(),members=new Set(),criteria=new Map();
 for(const t of s.teams){if(!/^id_[a-zA-Z0-9]+$/.test(t.id)||teamIds.has(t.id))throw Error('Équipe invalide.');teamIds.add(t.id);str(t.name);if(!colors.includes(t.color)||!Array.isArray(t.members)||t.members.length>6)throw Error('Équipe invalide.');for(const p of t.members){if(!pupilIds.has(p)||members.has(p))throw Error('Élève affecté deux fois.');members.add(p)}}
 for(const k of s.criteria){if(!/^id_[a-zA-Z0-9]+$/.test(k.id)||criteria.has(k.id))throw Error('Critère invalide.');str(k.label);if(!['individual','team'].includes(k.scope)||!['level','binary','counter'].includes(k.type)||!(k.targets===null||Array.isArray(k.targets)&&k.targets.every(x=>pupilIds.has(x))))throw Error('Critère invalide.');criteria.set(k.id,k)}
 if(s.absent.some(x=>!pupilIds.has(x)))throw Error('Présence invalide.');
 const checkContext=x=>{if(!x.observations||typeof x.observations!=='object'||Array.isArray(x.observations)||!x.notes||typeof x.notes!=='object'||Array.isArray(x.notes))throw Error('Observations invalides.');for(const [subject,obs] of Object.entries(x.observations)){if(!pupilIds.has(subject)&&!teamIds.has(subject)||!obs||typeof obs!=='object'||Array.isArray(obs))throw Error('Sujet invalide.');for(const [key,v] of Object.entries(obs)){const k=criteria.get(key);if(!k||!Number.isInteger(v)||v<0||v>(k.type==='level'?3:k.type==='binary'?1:9999))throw Error('Valeur invalide.');if(k.scope==='team'&&!teamIds.has(subject)||k.scope==='individual'&&!pupilIds.has(subject))throw Error('Observation incohérente.')}}for(const [subject,note] of Object.entries(x.notes)){if(!pupilIds.has(subject)&&!teamIds.has(subject))throw Error('Note inconnue.');str(note)}};
 checkContext(s);const matchIds=new Set();for(const m of s.matches){if(!/^id_[a-zA-Z0-9]+$/.test(m.id)||matchIds.has(m.id)||m.a===m.b||!teamIds.has(m.a)||!teamIds.has(m.b))throw Error('Match invalide.');matchIds.add(m.id);for(const score of [m.scoreA,m.scoreB])if(score!==null&&(!Number.isInteger(score)||score<0||score>9999))throw Error('Score invalide.');checkContext(m)}
 }
 if(typeof db.selectedClass!=='string'||typeof db.selectedSession!=='string')throw Error('Sélection invalide.');return db;
}
const API={colors,uid,empty,addClass,appendStudents,newSession,putTeam,moveStudent,addCriterion,setObservation,addMatch,setScore,standings,valuesFor,validate};if(typeof module!=='undefined')module.exports=API;else root.SportCo=API;
})(typeof window!=='undefined'?window:globalThis);

