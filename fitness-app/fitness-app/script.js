/* ==========================================================================
   FORM/ — storage shim
   Claude.ai's in-app HTML preview runs pages inside a sandbox that blocks
   real localStorage/sessionStorage. Opening the downloaded file directly in
   a normal browser tab does NOT have this restriction. Rather than break
   entirely in one of those two contexts, this shim probes for real storage
   at startup and transparently falls back to an in-memory store if it's
   unavailable — the rest of the app just calls localStorage/sessionStorage
   as normal; every reference in every function below resolves to whichever
   of the two this picks, since it's declared once at the top of the script.
   ========================================================================== */
let usingRealStorage = true;

function createMemoryStorage(){
  const store = {};
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[String(k)] = String(v); },
    removeItem: (k) => { delete store[String(k)]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

function getSafeStorage(kind){
  try{
    const s = window[kind];
    const testKey = '__form_storage_probe__';
    s.setItem(testKey, 'ok');
    const roundTripOk = s.getItem(testKey) === 'ok';
    s.removeItem(testKey);
    if(!roundTripOk) throw new Error('storage did not round-trip');
    return s;
  }catch(e){
    usingRealStorage = false;
    return createMemoryStorage();
  }
}

const localStorage = getSafeStorage('localStorage');
const sessionStorage = getSafeStorage('sessionStorage');

function showStorageFallbackNoticeIfNeeded(){
  if(usingRealStorage) return;
  const note = document.createElement('div');
  note.id = 'storageFallbackNotice';
  note.setAttribute('role', 'status');
  note.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:480px;margin:0 auto;background:#1c212b;color:#eef0ea;padding:12px 16px;border-radius:10px;font:600 13px/1.4 Inter,system-ui,sans-serif;z-index:500;box-shadow:0 12px 32px rgba(0,0,0,.35);display:flex;gap:10px;align-items:flex-start;';
  note.innerHTML = `<span style="flex:1;">This preview can't save data between reloads here — sign-in and everything you log will work, but resets if the page reloads. Download the file and open it in your browser to keep your data.</span>
    <button aria-label="Dismiss" style="background:none;border:none;color:#eef0ea;opacity:.7;cursor:pointer;font-size:16px;line-height:1;padding:2px;">×</button>`;
  note.querySelector('button').addEventListener('click', () => note.remove());
  document.body.appendChild(note);
}
/* ==========================================================================
   Mock catalog data — simulates a backend JSON API during development
   ========================================================================== */

const IMG = (seed,w=480,h=360)=>`https://picsum.photos/seed/${seed}/${w}/${h}`;

const EXERCISE_SEED = [
  // -------- No equipment --------
  { id:'ex01', name:'Bodyweight Squat', type:'Lower Body', target:'quads', equipment:'none', level:'beginner', gender:'all', duration:'8 min', img:IMG('squat1'), video:'https://www.youtube.com/embed/aclHkVaku9U', desc:'A foundational lower-body movement that builds quad, glute and core strength using only bodyweight.', steps:['Stand with feet shoulder-width apart.','Push hips back and bend knees to lower down.','Keep chest tall and knees tracking over toes.','Drive through heels to stand back up.'] },
  { id:'ex02', name:'Push-Up', type:'Upper Body', target:'chest', equipment:'none', level:'beginner', gender:'all', duration:'6 min', img:IMG('pushup1'), video:'https://www.youtube.com/embed/IODxDxX7oi4', desc:'Classic chest, shoulder and tricep builder that also engages the core.', steps:['Start in a high plank, hands under shoulders.','Lower chest toward the floor, elbows at 45°.','Keep body in a straight line.','Push back up to start.'] },
  { id:'ex03', name:'Plank Hold', type:'Core', target:'abs', equipment:'none', level:'beginner', gender:'all', duration:'5 min', img:IMG('plank1'), video:'https://www.youtube.com/embed/pSHjTRCQxIw', desc:'Isometric core stabilizer that also trains shoulders and glutes.', steps:['Forearms on the floor, elbows under shoulders.','Extend legs, balancing on toes.','Keep hips level, brace the core.','Hold, breathing steadily.'] },
  { id:'ex04', name:'Glute Bridge', type:'Lower Body', target:'glutes', equipment:'none', level:'beginner', gender:'female', duration:'6 min', img:IMG('bridge1'), video:'https://www.youtube.com/embed/OUgsJ8-Vi0E', desc:'Targets glutes and hamstrings, popular for posterior-chain activation.', steps:['Lie on your back, knees bent, feet flat.','Squeeze glutes and lift hips toward ceiling.','Pause at the top.','Lower with control.'] },
  { id:'ex05', name:'Mountain Climbers', type:'Cardio', target:'full body', equipment:'none', level:'intermediate', gender:'all', duration:'5 min', img:IMG('mc1'), video:'https://www.youtube.com/embed/nmwgirgXLYM', desc:'High-intensity cardio move that also hits the core and shoulders.', steps:['Start in a high plank.','Drive one knee toward your chest.','Switch legs quickly.','Keep hips low and steady.'] },
  { id:'ex06', name:'Standing Lunges', type:'Lower Body', target:'quads', equipment:'none', level:'beginner', gender:'all', duration:'7 min', img:IMG('lunge1'), video:'https://www.youtube.com/embed/QOVaHwm-Q6U', desc:'Unilateral leg exercise for strength and balance.', steps:['Step forward with one leg.','Lower until both knees hit ~90°.','Push back to standing.','Alternate legs.'] },
  { id:'ex07', name:'Tricep Dips (chair)', type:'Upper Body', target:'triceps', equipment:'everyday', level:'beginner', gender:'all', duration:'6 min', img:IMG('dip1'), video:'https://www.youtube.com/embed/0326dy_-CzM', desc:'Uses a sturdy chair or bench to isolate the triceps.', steps:['Hands on chair edge, legs extended.','Lower body by bending elbows.','Keep elbows pointed back.','Press up to start.'] },
  { id:'ex08', name:'Superman Hold', type:'Core', target:'lower back', equipment:'none', level:'beginner', gender:'all', duration:'4 min', img:IMG('superman1'), video:'https://www.youtube.com/embed/z6PJMT2y8GQ', desc:'Strengthens the posterior chain and improves posture.', steps:['Lie face down, arms extended.','Lift arms, chest and legs together.','Hold briefly.','Lower with control.'] },

  // -------- Everyday equipment (chairs, towels, water bottles, stairs, backpack) --------
  { id:'ex09', name:'Water-Jug Bicep Curl', type:'Upper Body', target:'biceps', equipment:'everyday', level:'beginner', gender:'all', duration:'6 min', img:IMG('jug1'), video:'https://www.youtube.com/embed/ykJmrZ5v0Oo', desc:'Household jugs make an improvised dumbbell for bicep work.', steps:['Hold a filled jug in each hand.','Curl up toward shoulders.','Squeeze at the top.','Lower slowly.'] },
  { id:'ex10', name:'Backpack-Loaded Squat', type:'Lower Body', target:'quads', equipment:'everyday', level:'intermediate', gender:'all', duration:'8 min', img:IMG('bp1'), video:'https://www.youtube.com/embed/xqvCmoLULNY', desc:'Add resistance to squats using a loaded backpack.', steps:['Wear a backpack loaded with books.','Squat down keeping chest tall.','Drive through heels to stand.','Repeat for reps.'] },
  { id:'ex11', name:'Stair Step-Ups', type:'Cardio', target:'glutes', equipment:'everyday', level:'beginner', gender:'all', duration:'6 min', img:IMG('stairs1'), video:'https://www.youtube.com/embed/9DZQ4a4bV4A', desc:'Uses a staircase or sturdy step for glutes and cardio.', steps:['Step one foot fully onto a stair.','Drive up until leg is straight.','Step back down with control.','Alternate legs.'] },
  { id:'ex12', name:'Towel Row', type:'Upper Body', target:'back', equipment:'everyday', level:'intermediate', gender:'all', duration:'6 min', img:IMG('towel1'), video:'https://www.youtube.com/embed/pYcpY20QaE8', desc:'A towel looped around a sturdy post creates resistance for rows.', steps:['Loop a towel around a fixed post.','Lean back, holding both ends.','Pull chest toward the post.','Return with control.'] },
  { id:'ex13', name:'Chair Step Cardio', type:'Cardio', target:'full body', equipment:'everyday', level:'beginner', gender:'all', duration:'10 min', img:IMG('chaircardio1'), video:'https://www.youtube.com/embed/2pLT-olgUJs', desc:'Low-impact cardio circuit using a stable chair.', steps:['Step up onto a sturdy chair.','Step back down.','Keep a steady rhythm.','Add arm swings for intensity.'] },

  // -------- Gym equipment --------
  { id:'ex14', name:'Barbell Bench Press', type:'Upper Body', target:'chest', equipment:'gym', level:'intermediate', gender:'all', duration:'10 min', img:IMG('bench1'), video:'https://www.youtube.com/embed/rT7DgCr-3pg', desc:'Primary compound lift for chest, shoulders and triceps.', steps:['Lie on the bench, grip bar slightly wider than shoulders.','Lower bar to mid-chest.','Press back up to full extension.','Keep feet planted throughout.'] },
  { id:'ex15', name:'Lat Pulldown', type:'Upper Body', target:'back', equipment:'gym', level:'beginner', gender:'all', duration:'8 min', img:IMG('lat1'), video:'https://www.youtube.com/embed/CAwf7n6Luuc', desc:'Builds width in the back using a cable machine.', steps:['Grip the bar wider than shoulders.','Pull down to upper chest.','Squeeze shoulder blades together.','Return with control.'] },
  { id:'ex16', name:'Leg Press', type:'Lower Body', target:'quads', equipment:'gym', level:'beginner', gender:'all', duration:'9 min', img:IMG('legpress1'), video:'https://www.youtube.com/embed/IZxyjW7MPJQ', desc:'Machine-based compound lift for the entire lower body.', steps:['Sit and place feet shoulder-width on plate.','Lower until knees reach ~90°.','Press through heels to extend.','Avoid locking knees fully.'] },
  { id:'ex17', name:'Cable Rope Tricep Pushdown', type:'Upper Body', target:'triceps', equipment:'gym', level:'beginner', gender:'all', duration:'6 min', img:IMG('tri1'), video:'https://www.youtube.com/embed/2-LAMcpzODU', desc:'Isolation move for the triceps using a cable stack.', steps:['Grip rope attachment, elbows tucked.','Push down until arms extend.','Squeeze at the bottom.','Return slowly.'] },
  { id:'ex18', name:'Dumbbell Romanian Deadlift', type:'Lower Body', target:'hamstrings', equipment:'gym', level:'intermediate', gender:'all', duration:'8 min', img:IMG('rdl1'), video:'https://www.youtube.com/embed/1uDiW5--rAE', desc:'Hip-hinge movement targeting hamstrings and glutes.', steps:['Hold dumbbells in front of thighs.','Hinge at hips, lowering weights along legs.','Feel a stretch in the hamstrings.','Drive hips forward to stand.'] },
  { id:'ex19', name:'Seated Cable Row', type:'Upper Body', target:'back', equipment:'gym', level:'beginner', gender:'all', duration:'7 min', img:IMG('row1'), video:'https://www.youtube.com/embed/GZbfZ033f74', desc:'Mid-back builder that also works the biceps and rear delts.', steps:['Sit tall, grip the handle.','Pull toward your torso.','Squeeze shoulder blades.','Extend arms with control.'] },
  { id:'ex20', name:'Smith Machine Hip Thrust', type:'Lower Body', target:'glutes', equipment:'gym', level:'intermediate', gender:'female', duration:'8 min', img:IMG('thrust1'), video:'https://www.youtube.com/embed/xDmFkJxPzeM', desc:'A gym staple for glute hypertrophy and strength.', steps:['Upper back against a bench, bar over hips.','Drive hips upward, squeezing glutes.','Pause at the top.','Lower with control.'] },
  { id:'ex21', name:'Kettlebell Swing', type:'Cardio', target:'full body', equipment:'gym', level:'intermediate', gender:'male', duration:'8 min', img:IMG('kb1'), video:'https://www.youtube.com/embed/YSxHifyI6s8', desc:'Explosive hip-hinge move blending strength and conditioning.', steps:['Hinge and grip the kettlebell.','Snap hips forward to swing it to chest height.','Let it swing back between legs.','Repeat with a steady rhythm.'] },
];

const FOOD_SEED = [
  { id:'f01', name:'Grilled Chicken Breast', portion:'100 g', kcal:165, protein:31, carbs:0, fat:3.6, tags:['high-protein','low-carb'] },
  { id:'f02', name:'Brown Rice (cooked)', portion:'1 cup', kcal:216, protein:5, carbs:45, fat:1.8, tags:['whole-grain'] },
  { id:'f03', name:'Avocado', portion:'1 medium', kcal:240, protein:3, carbs:12, fat:22, tags:['healthy-fat'] },
  { id:'f04', name:'Greek Yogurt (plain)', portion:'170 g', kcal:100, protein:17, carbs:6, fat:0.7, tags:['high-protein'] },
  { id:'f05', name:'Salmon Fillet', portion:'100 g', kcal:208, protein:20, carbs:0, fat:13, tags:['omega-3'] },
  { id:'f06', name:'Broccoli (steamed)', portion:'1 cup', kcal:55, protein:3.7, carbs:11, fat:0.6, tags:['low-cal','fiber'] },
  { id:'f07', name:'Oats (dry)', portion:'40 g', kcal:150, protein:5, carbs:27, fat:3, tags:['whole-grain','fiber'] },
  { id:'f08', name:'Almonds', portion:'28 g', kcal:164, protein:6, carbs:6, fat:14, tags:['healthy-fat'] },
  { id:'f09', name:'Banana', portion:'1 medium', kcal:105, protein:1.3, carbs:27, fat:0.4, tags:['fruit'] },
  { id:'f10', name:'Egg (whole)', portion:'1 large', kcal:78, protein:6, carbs:0.6, fat:5, tags:['high-protein'] },
  { id:'f11', name:'Sweet Potato (baked)', portion:'1 medium', kcal:112, protein:2, carbs:26, fat:0.1, tags:['whole-food'] },
  { id:'f12', name:'Whey Protein Scoop', portion:'30 g', kcal:120, protein:24, carbs:3, fat:1.5, tags:['high-protein','supplement'] },
];

const RECIPE_SEED = [
  { id:'r01', name:'High-Protein Chicken Bowl', kcal:520, protein:48, carbs:44, fat:14, ingredients:['Grilled chicken breast','Brown rice','Broccoli','Olive oil'], img:IMG('recipe1') },
  { id:'r02', name:'Post-Workout Oat Shake', kcal:410, protein:34, carbs:46, fat:9, ingredients:['Oats','Whey protein','Banana','Almond milk'], img:IMG('recipe2') },
  { id:'r03', name:'Salmon & Sweet Potato', kcal:560, protein:38, carbs:40, fat:22, ingredients:['Salmon fillet','Sweet potato','Asparagus','Lemon'], img:IMG('recipe3') },
  { id:'r04', name:'Greek Yogurt Parfait', kcal:310, protein:22, carbs:34, fat:8, ingredients:['Greek yogurt','Almonds','Banana','Honey'], img:IMG('recipe4') },
];

function seedDatabaseIfEmpty(){
  if(!localStorage.getItem('form_exercises')) localStorage.setItem('form_exercises', JSON.stringify(EXERCISE_SEED));
  if(!localStorage.getItem('form_foods')) localStorage.setItem('form_foods', JSON.stringify(FOOD_SEED));
  if(!localStorage.getItem('form_recipes')) localStorage.setItem('form_recipes', JSON.stringify(RECIPE_SEED));
}
/* ==========================================================================
   FORM/ — client-side "backend": auth + storage, all via localStorage
   ========================================================================== */
const DB = {
  users:'form_users',
  session:'form_session',      // persistent (remember me)
  sessionTmp:'form_session_tmp', // this-tab-only session
  weights:'form_weights_',
  foodlog:'form_foodlog_',
  calendar:'form_calendar_',
  comments:'form_comments',
  customPics:'form_custom_pics',
  goals:'form_goals_',
  theme:'form_theme',
};

function readJSON(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
function writeJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function getUsers(){ return readJSON(DB.users, []); }
function saveUsers(u){ writeJSON(DB.users, u); }

function findUserByEmail(email){
  return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

function signup(profile){
  const users = getUsers();
  if(findUserByEmail(profile.email)) return { ok:false, error:'An account with that email already exists.' };
  const user = {
    id:'u' + Date.now(),
    name: profile.name,
    email: profile.email,
    password: profile.password, // demo only — never store plaintext in a real backend
    gender: profile.gender || 'prefer-not',
    age: Number(profile.age) || null,
    heightCm: Number(profile.heightCm) || null,
    weightKg: Number(profile.weightKg) || null,
    fitnessLevel: profile.fitnessLevel || 'beginner',
    goal: profile.goal || 'general-fitness',
    medical: profile.medical || '',
    equipment: profile.equipment || 'none',
    frequency: Number(profile.frequency) || 3,
    targetWeight: Number(profile.targetWeight) || null,
    role: 'member',
    createdAt: new Date().toISOString(),
    avatar:'',
    streak:0,
    lastWorkout:null,
  };
  users.push(user);
  saveUsers(users);
  if(user.weightKg) logWeight(user.id, user.weightKg, user.createdAt);
  return { ok:true, user };
}

function login(email, password, remember){
  const user = findUserByEmail(email);
  if(!user || user.password !== password) return { ok:false, error:'Incorrect email or password.' };
  const sessionVal = JSON.stringify({ userId:user.id, at:Date.now() });
  if(remember){
    localStorage.setItem(DB.session, sessionVal);
    sessionStorage.removeItem(DB.sessionTmp);
  } else {
    sessionStorage.setItem(DB.sessionTmp, sessionVal);
    localStorage.removeItem(DB.session);
  }
  if(remember){
    writeJSON('form_remembered_email', email);
  }
  return { ok:true, user };
}

function logout(){
  localStorage.removeItem(DB.session);
  sessionStorage.removeItem(DB.sessionTmp);
  if(typeof exitToAuth === 'function') exitToAuth();
}

function getSession(){
  const persistent = localStorage.getItem(DB.session);
  const tmp = sessionStorage.getItem(DB.sessionTmp);
  const raw = persistent || tmp;
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}

function currentUser(){
  const s = getSession();
  if(!s) return null;
  return getUsers().find(u => u.id === s.userId) || null;
}

function updateCurrentUser(patch){
  const user = currentUser();
  if(!user) return null;
  const users = getUsers().map(u => u.id === user.id ? {...u, ...patch} : u);
  saveUsers(users);
  return users.find(u => u.id === user.id);
}

function requireAuth(){
  // In the single-page app, view switching is gated by enterApp()/exitToAuth()
  // rather than a page redirect — kept as a harmless no-op for compatibility.
  return !!currentUser();
}

function isAdmin(){
  const u = currentUser();
  return !!u && u.role === 'admin';
}

/* -------- weight tracking -------- */
function logWeight(userId, kg, dateISO){
  const key = DB.weights + userId;
  const log = readJSON(key, []);
  log.push({ date: dateISO || new Date().toISOString(), kg: Number(kg) });
  writeJSON(key, log);
  return log;
}
function getWeightLog(userId){ return readJSON(DB.weights + userId, []); }

/* -------- food log -------- */
function addFoodEntry(userId, entry){
  const key = DB.foodlog + userId;
  const log = readJSON(key, []);
  log.push({ ...entry, id:'fl'+Date.now(), date: entry.date || new Date().toISOString().slice(0,10) });
  writeJSON(key, log);
  return log;
}
function getFoodLog(userId){ return readJSON(DB.foodlog + userId, []); }
function removeFoodEntry(userId, entryId){
  const key = DB.foodlog + userId;
  writeJSON(key, readJSON(key, []).filter(e => e.id !== entryId));
}

/* -------- calendar / scheduled workouts -------- */
function getCalendar(userId){ return readJSON(DB.calendar + userId, {}); } // { 'YYYY-MM-DD': [{id,name,done}] }
function setCalendar(userId, data){ writeJSON(DB.calendar + userId, data); }

/* -------- goals -------- */
function getGoals(userId){ return readJSON(DB.goals + userId, { targetWeight:null, weeklyFrequency:3, strengthMilestone:'' }); }
function setGoals(userId, goals){ writeJSON(DB.goals + userId, goals); }

/* -------- comments / complaints / suggestions -------- */
function getComments(){ return readJSON(DB.comments, []); }
function addComment(c){
  const list = getComments();
  list.unshift({ ...c, id:'c'+Date.now(), date:new Date().toISOString(), replies:[] });
  writeJSON(DB.comments, list);
  return list;
}
function deleteComment(id){ writeJSON(DB.comments, getComments().filter(c=>c.id!==id)); }

/* -------- custom exercise pictures (user-updatable) -------- */
function getCustomPics(){ return readJSON(DB.customPics, {}); }
function setCustomPic(exId, dataUrl){
  const pics = getCustomPics();
  pics[exId] = dataUrl;
  writeJSON(DB.customPics, pics);
}

/* -------- exercises (admin editable) -------- */
function getExercises(){ return readJSON('form_exercises', []); }
function saveExercises(list){ writeJSON('form_exercises', list); }

/* -------- theme -------- */
function applyStoredTheme(){
  const t = localStorage.getItem(DB.theme) || 'light';
  document.documentElement.setAttribute('data-theme', t);
  return t;
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(DB.theme, next);
  return next;
}
function applyStoredFontScale(){
  document.documentElement.setAttribute('data-fontscale', localStorage.getItem('form_fontscale') || 'md');
}

const ADMIN_EMAIL = 'admin@form.app';
const ADMIN_PASSWORD = 'Admin123!';
function seedAdminIfEmpty(){
  if(getUsers().length) return;
  saveUsers([{
    id:'admin-seed', name:'Site Admin', email:ADMIN_EMAIL, password:ADMIN_PASSWORD,
    gender:'prefer-not', age:30, heightCm:170, weightKg:70, fitnessLevel:'intermediate',
    goal:'general-fitness', medical:'', equipment:'gym', frequency:4, targetWeight:null,
    role:'admin', createdAt:new Date().toISOString(), avatar:'', streak:3, lastWorkout:null,
  }]);
}

applyStoredTheme();
applyStoredFontScale();
seedDatabaseIfEmpty();
seedAdminIfEmpty();
/* ==========================================================================
   FORM/ — shared shell: sidenav, topbar, toasts, modal helpers
   ========================================================================== */

const NAV_ITEMS = [
  { group:'Overview', links:[
    { href:'#dashboard', icon:'◧', label:'Dashboard', page:'dashboard' },
    { href:'#calculator', icon:'∆', label:'BMI & Weight', page:'calculator' },
    { href:'#calendar', icon:'▦', label:'Calendar', page:'calendar' },
  ]},
  { group:'Train', links:[
    { href:'#exercises', icon:'✚', label:'Exercise Library', page:'exercises' },
    { href:'#builder', icon:'⌘', label:'Routine Builder', page:'builder' },
  ]},
  { group:'Eat', links:[
    { href:'#nutrition', icon:'●', label:'Nutrition', page:'nutrition' },
  ]},
  { group:'Community', links:[
    { href:'#community', icon:'◐', label:'Forums & Feedback', page:'community' },
  ]},
  { group:'Membership', links:[
    { href:'#pricing', icon:'♦', label:'Plans & Billing', page:'pricing' },
  ]},
  { group:'Account', links:[
    { href:'#settings', icon:'⚙', label:'Settings', page:'settings' },
    { href:'#admin', icon:'✎', label:'Admin / Edit Site', page:'admin', adminOnly:true },
  ]},
];

const PAGE_TITLES = {
  dashboard:'Dashboard', calculator:'BMI & Weight Tracker', calendar:'Workout Calendar',
  exercises:'Exercise Library', builder:'Routine Builder', nutrition:'Nutrition Tracker',
  community:'Forums & Feedback', settings:'Settings', admin:'Admin — Edit Site', pricing:'Plans & Billing',
};

function initShell(){
  const user = currentUser();
  if(!user) return;
  const page = (location.hash || '#dashboard').slice(1);

  const sidenavMount = document.getElementById('sidenav-mount');
  const topbarMount = document.getElementById('topbar-mount');
  if(!sidenavMount || !topbarMount) return;

  const initials = (user.name || 'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  let navHtml = `<div class="wordmark">FORM<span>/</span></div>`;
  NAV_ITEMS.forEach(group=>{
    const links = group.links.filter(l => !l.adminOnly || isAdmin());
    if(!links.length) return;
    navHtml += `<div class="nav-group"><div class="nav-label">${group.group}</div>`;
    links.forEach(l=>{
      navHtml += `<a class="nav-link ${l.page===page?'active':''}" data-view="${l.page}" href="${l.href}"><span class="ic">${l.icon}</span>${l.label}</a>`;
    });
    navHtml += `</div>`;
  });
  navHtml += `
    <div class="sidenav-foot">
      <a class="user-chip" data-view="settings" href="#settings">
        <span class="avatar">${user.avatar ? `<img src="${user.avatar}" alt="">` : initials}</span>
        <span>
          <div style="font-weight:700;font-size:.85rem;">${escapeHtml(user.name)}</div>
          <div style="font-size:.7rem;color:rgba(238,240,234,.55);text-transform:capitalize;">${user.role}</div>
        </span>
      </a>
      <button class="btn btn-ghost w-full" id="logoutBtn" style="color:rgba(238,240,234,.7);justify-content:flex-start;">↩ Log out</button>
    </div>`;
  sidenavMount.innerHTML = navHtml;
  sidenavMount.classList.add('sidenav');

  topbarMount.classList.add('topbar');
  topbarMount.innerHTML = `
    <button class="menu-btn" id="menuBtn" aria-label="Open menu">☰</button>
    <h1 id="topbarTitleText">${PAGE_TITLES[page] || ''}</h1>
    <div class="topbar-spacer"></div>
    <div class="topbar-tools">
      <span class="rep-tick" id="streakTick">🔥 ${user.streak || 0} day streak</span>
      <div class="fontscale-group" role="group" aria-label="Text size">
        <button data-scale="sm" aria-label="Small text">A</button>
        <button data-scale="md" aria-label="Medium text">A</button>
        <button data-scale="lg" aria-label="Large text">A</button>
        <button data-scale="xl" aria-label="Extra large text">A</button>
      </div>
      <button class="theme-switch" id="themeBtn" aria-label="Toggle dark mode"></button>
      <button class="btn-icon" id="notifBtn" title="Notifications" aria-label="Notifications">🔔</button>
    </div>`;

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  document.getElementById('notifBtn').addEventListener('click', ()=> toast('You\'re all caught up — no new notifications.', 'success'));

  const savedScale = localStorage.getItem('form_fontscale') || 'md';
  document.documentElement.setAttribute('data-fontscale', savedScale);
  const scaleBtns = topbarMount.querySelectorAll('[data-scale]');
  scaleBtns.forEach(b=>{
    b.classList.toggle('active', b.dataset.scale === savedScale);
    b.style.fontSize = { sm:'.68rem', md:'.78rem', lg:'.88rem', xl:'.98rem' }[b.dataset.scale];
    b.addEventListener('click', ()=>{
      document.documentElement.setAttribute('data-fontscale', b.dataset.scale);
      localStorage.setItem('form_fontscale', b.dataset.scale);
      scaleBtns.forEach(x=>x.classList.toggle('active', x===b));
    });
  });

  // mobile nav
  const existingScrim = document.getElementById('navScrim');
  if(existingScrim) existingScrim.remove();
  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  scrim.id = 'navScrim';
  document.body.appendChild(scrim);
  const openNav = ()=>{ sidenavMount.classList.add('open'); scrim.classList.add('open'); };
  const closeNav = ()=>{ sidenavMount.classList.remove('open'); scrim.classList.remove('open'); };
  document.getElementById('menuBtn').addEventListener('click', openNav);
  scrim.addEventListener('click', closeNav);
  sidenavMount.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeNav));
}

function escapeHtml(str=''){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* -------- scoped tabs (each view's tab group only affects its own panels) -------- */
function initTabsWithin(containerEl){
  if(!containerEl) return;
  const btns = containerEl.querySelectorAll('.tab-btn');
  const panels = containerEl.querySelectorAll('.tab-panel');
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btns.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      const target = containerEl.querySelector('#panel-'+btn.dataset.tab);
      if(target) target.classList.add('active');
    });
  });
}

/* -------- toast -------- */
function toast(message, type='success'){
  let stack = document.querySelector('.toast-stack');
  if(!stack){ stack = document.createElement('div'); stack.className='toast-stack'; document.body.appendChild(stack); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='success' ? '✓' : '!'}</span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s ease'; setTimeout(()=>el.remove(), 300); }, 3200);
}

/* -------- modal -------- */
function openModal(html, opts={}){
  closeModal();
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.id = 'globalModal';
  scrim.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(scrim);
  requestAnimationFrame(()=> scrim.classList.add('open'));
  scrim.addEventListener('click', e=>{ if(e.target === scrim && !opts.persistent) closeModal(); });
  document.addEventListener('keydown', escCloser);
  return scrim;
}
function escCloser(e){ if(e.key==='Escape') closeModal(); }
function closeModal(){
  const m = document.getElementById('globalModal');
  if(m){ m.classList.remove('open'); setTimeout(()=>m.remove(), 200); }
  document.removeEventListener('keydown', escCloser);
}

/* -------- image → dataURL helper (for "update pics") -------- */
function fileToDataUrl(file, cb){
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', initShell);
document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  document.getElementById('dateEyebrow').textContent = new Date().toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'});
  document.getElementById('greeting').textContent = `Welcome back, ${user.name.split(' ')[0]}`;
  document.getElementById('miniEmail').textContent = user.email;

  // skeleton loaders while "fetching" — mirrors a real API call during development
  document.getElementById('statCards').innerHTML = Array(4).fill('<div class="card"><div class="skel" style="height:14px;width:60%;margin-bottom:12px;"></div><div class="skel" style="height:32px;width:80%;margin-bottom:10px;"></div><div class="skel" style="height:12px;width:50%;"></div></div>').join('');
  document.getElementById('weekList').innerHTML = Array(3).fill('<div class="skel" style="height:44px;width:100%;"></div>').join('<div style="height:10px;"></div>');

  setTimeout(()=> renderDashboard(user), 380);
});

function renderDashboard(user){
  const weightLog = getWeightLog(user.id);
  const latestWeight = weightLog.length ? weightLog[weightLog.length-1].kg : user.weightKg;
  const goals = getGoals(user.id);
  const targetWeight = goals.targetWeight || user.targetWeight;
  const weeklyFreq = goals.weeklyFrequency || user.frequency || 3;

  const cal = getCalendar(user.id);
  const todayKey = new Date().toISOString().slice(0,10);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  let doneThisWeek = 0, totalThisWeek = 0;
  const weekDays = [];
  for(let i=0;i<7;i++){
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i);
    const key = d.toISOString().slice(0,10);
    const items = cal[key] || [];
    totalThisWeek += items.length;
    doneThisWeek += items.filter(it=>it.done).length;
    weekDays.push({key, d, items});
  }

  // stat cards
  const bmi = (latestWeight && user.heightCm) ? (latestWeight / Math.pow(user.heightCm/100,2)) : null;
  const stats = [
    { label:'Current weight', value: latestWeight ? `${latestWeight} kg` : '—', delta: targetWeight && latestWeight ? `${(latestWeight-targetWeight).toFixed(1)}kg to goal` : 'Set a goal weight', cls:'' },
    { label:'BMI', value: bmi ? bmi.toFixed(1) : '—', delta: bmi ? bmiCategory(bmi) : 'Add height & weight', cls:'' },
    { label:'Day streak', value: user.streak || 0, delta: (user.streak||0) > 0 ? 'Keep it going 🔥' : 'Log a workout today', cls:'up' },
    { label:'This week', value: `${doneThisWeek}/${weeklyFreq}`, delta: doneThisWeek >= weeklyFreq ? 'Goal met!' : `${Math.max(0,weeklyFreq-doneThisWeek)} to go`, cls: doneThisWeek>=weeklyFreq ? 'up':'' },
  ];
  document.getElementById('statCards').innerHTML = stats.map(s=>`
    <div class="card stat-card">
      <span class="stat-label">${s.label}</span>
      <span class="stat-num">${s.value}</span>
      <span class="stat-delta ${s.cls}">${s.delta}</span>
    </div>`).join('');

  // week list
  document.getElementById('weekList').innerHTML = weekDays.map(({key,d,items})=>{
    const isToday = key === todayKey;
    const label = d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'});
    const body = items.length
      ? items.map(it=>`<span class="tag ${it.done?'tag-level':'tag-equip'}">${it.done?'✓ ':''}${escapeHtml(it.name)}</span>`).join(' ')
      : `<span class="text-dim text-sm">Rest day</span>`;
    return `<div class="flex items-center gap-16" style="padding:10px 12px;border-radius:10px;${isToday?'background:var(--paper-soft);border:1px solid var(--line);':''}">
      <div style="min-width:120px;font-weight:${isToday?'800':'600'};font-size:.85rem;">${isToday?'Today · ':''}${label}</div>
      <div class="flex gap-8" style="flex-wrap:wrap;">${body}</div>
    </div>`;
  }).join('');

  // ring
  const ratio = totalThisWeek ? doneThisWeek/Math.max(weeklyFreq,1) : (weeklyFreq ? 0 : 0);
  const circumference = 314;
  const clamped = Math.min(1, ratio);
  document.getElementById('ringFg').style.strokeDashoffset = String(circumference * (1-clamped));
  document.getElementById('ringLabel').textContent = `${doneThisWeek}/${weeklyFreq}`;
  document.getElementById('ringHint').textContent = clamped >= 1 ? 'You hit your weekly workout goal — nice work!' : 'Log a workout on your calendar to fill the ring.';

  // goal form
  document.getElementById('goalTargetWeight').value = targetWeight || '';
  document.getElementById('goalFrequency').value = weeklyFreq;
  document.getElementById('goalMilestone').value = goals.strengthMilestone || '';
  document.getElementById('goalForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const newGoals = {
      targetWeight: Number(document.getElementById('goalTargetWeight').value) || null,
      weeklyFrequency: Number(document.getElementById('goalFrequency').value) || 3,
      strengthMilestone: document.getElementById('goalMilestone').value.trim(),
    };
    setGoals(user.id, newGoals);
    updateCurrentUser({ targetWeight:newGoals.targetWeight, frequency:newGoals.weeklyFrequency });
    toast('Goals saved.', 'success');
    renderDashboard(currentUser());
  });
}

function bmiCategory(bmi){
  if(bmi < 18.5) return 'Underweight';
  if(bmi < 25) return 'Healthy range';
  if(bmi < 30) return 'Overweight';
  return 'Obesity range';
}
let currentGender = 'all';
let currentMuscle = null;

document.addEventListener('DOMContentLoaded', ()=>{
  if(!document.getElementById('exerciseGroups')) return; // safety guard — exercises view is always present in the merged DOM
  const user = currentUser();
  if(!user) return;
  currentGender = user.gender === 'male' ? 'male' : (user.gender === 'female' ? 'female' : 'all');
  syncGenderButtons();

  document.getElementById('genderToggle').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-g]');
    if(!btn) return;
    currentGender = btn.dataset.g;
    syncGenderButtons();
    render();
  });

  document.querySelectorAll('.anatomy-svg .part').forEach(el=>{
    el.addEventListener('click', ()=>{
      currentMuscle = el.dataset.target;
      document.querySelectorAll('.anatomy-svg .part').forEach(p=>p.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('anatomyLabel').textContent = currentMuscle;
      render();
    });
  });
  document.getElementById('clearAnatomy').addEventListener('click', ()=>{
    currentMuscle = null;
    document.querySelectorAll('.anatomy-svg .part').forEach(p=>p.classList.remove('active'));
    document.getElementById('anatomyLabel').textContent = 'all muscle groups';
    render();
  });

  ['equip','level'].forEach(name=>{
    document.querySelectorAll(`input[name="${name}"]`).forEach(r=> r.addEventListener('change', render));
  });
  document.getElementById('typeSelect').addEventListener('change', render);
  document.getElementById('durationSelect').addEventListener('change', render);
  document.getElementById('searchBox').addEventListener('input', debounce(render, 150));
  document.getElementById('favOnly').addEventListener('change', render);

  if(isAdmin()){
    const btn = document.getElementById('addExerciseBtn');
    btn.style.display = 'inline-flex';
    btn.addEventListener('click', openExerciseEditor);
  }

  // brief skeleton loader on first load only — mirrors an async catalog fetch
  document.getElementById('exerciseGroups').innerHTML = Array(6).fill('<div class="skel" style="height:230px;border-radius:12px;"></div>').join('');
  document.getElementById('exerciseGroups').style.display = 'grid';
  document.getElementById('exerciseGroups').style.gridTemplateColumns = 'repeat(auto-fill,minmax(260px,1fr))';
  document.getElementById('exerciseGroups').style.gap = '18px';
  setTimeout(()=>{
    document.getElementById('exerciseGroups').style.display = '';
    document.getElementById('exerciseGroups').style.gridTemplateColumns = '';
    document.getElementById('exerciseGroups').style.gap = '';
    render();
  }, 320);
});

function syncGenderButtons(){
  document.querySelectorAll('#genderToggle button').forEach(b=> b.classList.toggle('active', b.dataset.g === currentGender));
}

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

function getFavorites(){ return readJSON('form_favorites_'+currentUser().id, []); }
function toggleFavorite(id){
  const key = 'form_favorites_'+currentUser().id;
  let favs = readJSON(key, []);
  favs = favs.includes(id) ? favs.filter(f=>f!==id) : [...favs, id];
  writeJSON(key, favs);
  render();
}

function durationBucket(durationStr){
  const mins = parseInt(durationStr, 10) || 0;
  if(mins < 7) return 'short';
  if(mins <= 9) return 'medium';
  return 'long';
}

function filteredExercises(){
  const equip = document.querySelector('input[name="equip"]:checked').value;
  const level = document.querySelector('input[name="level"]:checked').value;
  const type = document.getElementById('typeSelect').value;
  const duration = document.getElementById('durationSelect').value;
  const q = document.getElementById('searchBox').value.trim().toLowerCase();
  const favOnly = document.getElementById('favOnly').checked;
  const favs = getFavorites();

  return getExercises().filter(ex=>{
    if(equip !== 'all' && ex.equipment !== equip) return false;
    if(level !== 'all' && ex.level !== level) return false;
    if(type !== 'all' && ex.type !== type) return false;
    if(duration !== 'all' && durationBucket(ex.duration) !== duration) return false;
    if(currentGender !== 'all' && !(ex.gender === 'all' || ex.gender === currentGender)) return false;
    if(currentMuscle && ex.target !== currentMuscle) return false;
    if(q && !ex.name.toLowerCase().includes(q) && !ex.target.toLowerCase().includes(q)) return false;
    if(favOnly && !favs.includes(ex.id)) return false;
    return true;
  });
}

function render(){
  if(!document.getElementById('exerciseGroups')) return;
  const list = filteredExercises();
  document.getElementById('resultCount').textContent = `Showing ${list.length} exercise${list.length===1?'':'s'}${currentGender!=='all' ? ' · tailored for '+currentGender : ''}`;

  const groups = {};
  list.forEach(ex => { (groups[ex.type] = groups[ex.type] || []).push(ex); });

  const wrap = document.getElementById('exerciseGroups');
  if(!list.length){
    wrap.innerHTML = `<div class="card text-center" style="padding:50px;"><h3 style="font-family:var(--display);font-size:1.4rem;">No exercises match yet</h3><p class="text-dim mt-8">Try widening your filters or clearing the muscle map selection.</p></div>`;
    return;
  }
  const pics = getCustomPics();
  const favs = getFavorites();

  wrap.innerHTML = Object.keys(groups).map(type=>`
    <div class="mb-16">
      <h3 style="font-family:var(--display);font-size:1.5rem;margin-bottom:12px;">${type} <span class="text-dim" style="font-family:var(--body);font-size:.85rem;font-weight:600;">(${groups[type].length} targeting ${[...new Set(groups[type].map(e=>e.target))].join(', ')})</span></h3>
      <div class="grid grid-auto">
        ${groups[type].map(ex => exerciseCard(ex, pics, favs)).join('')}
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', ()=> openExerciseModal(el.dataset.open)));
  wrap.querySelectorAll('[data-fav]').forEach(el => el.addEventListener('click', (e)=>{ e.stopPropagation(); toggleFavorite(el.dataset.fav); }));
  wrap.querySelectorAll('[data-editpic]').forEach(el => el.addEventListener('click', (e)=>{ e.stopPropagation(); triggerPicUpload(el.dataset.editpic); }));
}

function exerciseCard(ex, pics, favs){
  const img = pics[ex.id] || ex.img;
  const isFav = favs.includes(ex.id);
  return `
  <article class="ex-card" data-open="${ex.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(ex.name)} details">
    <div class="ex-thumb">
      <img src="${img}" alt="${escapeHtml(ex.name)} demonstration" loading="lazy">
      <div class="play-badge"><span class="circle">▶</span></div>
      <button class="edit-pic" data-editpic="${ex.id}" title="Update photo">✎ Update pic</button>
    </div>
    <div class="ex-body">
      <div class="flex justify-between items-center">
        <h4>${escapeHtml(ex.name)}</h4>
        <button class="btn-icon" data-fav="${ex.id}" title="${isFav?'Remove from favorites':'Add to favorites'}" aria-label="Toggle favorite" style="width:32px;height:32px;">${isFav?'★':'☆'}</button>
      </div>
      <div class="ex-tags">
        <span class="tag tag-target">${ex.target}</span>
        <span class="tag tag-equip">${equipLabel(ex.equipment)}</span>
        <span class="tag tag-level">${ex.level}</span>
      </div>
      <p class="text-sm text-dim">${ex.duration} · ${ex.gender === 'all' ? 'All genders' : ex.gender + '-tailored'}</p>
    </div>
  </article>`;
}

function equipLabel(e){ return { none:'No equipment', everyday:'Everyday items', gym:'Gym' }[e] || e; }

function triggerPicUpload(exId){
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.addEventListener('change', ()=>{
    if(!input.files[0]) return;
    fileToDataUrl(input.files[0], (dataUrl)=>{
      setCustomPic(exId, dataUrl);
      toast('Photo updated.', 'success');
      render();
    });
  });
  input.click();
}

/* -------- exercise detail modal: video + carousel -------- */
function openExerciseModal(exId){
  const ex = getExercises().find(e=>e.id===exId);
  if(!ex) return;
  const pics = getCustomPics();
  const clips = readJSON('form_clips_'+exId, []);

  const html = `
    <div class="modal-head">
      <h3 style="font-family:var(--display);font-size:1.4rem;">${escapeHtml(ex.name)}</h3>
      <button class="modal-close" id="mClose" aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <div class="ex-tags mb-16">
        <span class="tag tag-target">${ex.target}</span>
        <span class="tag tag-equip">${equipLabel(ex.equipment)}</span>
        <span class="tag tag-level">${ex.level}</span>
        <span class="tag" style="background:var(--paper-soft);">${ex.duration}</span>
      </div>
      <div style="aspect-ratio:16/9;border-radius:var(--radius-m);overflow:hidden;background:#000;">
        <iframe id="exVideo" width="100%" height="100%" src="${ex.video}" title="${escapeHtml(ex.name)} video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:0;"></iframe>
      </div>
      <p class="text-sm text-dim mt-8">Embedded video player — use the player's own controls for speed, picture-in-picture and progress.</p>

      <p class="mt-16">${ex.desc}</p>

      <h4 style="font-family:var(--display);font-size:1.2rem;" class="mt-16">Step-by-step form</h4>
      <div class="card mt-8" style="padding:16px;">
        <p class="text-sm text-dim" id="exStepCounter">Step 1 of ${ex.steps.length}</p>
        <p id="exStepText" style="font-size:1.05rem;font-weight:600;margin:10px 0;">${ex.steps[0]}</p>
        <div class="flex gap-8">
          <button class="btn btn-outline btn-sm" id="exStepPrev" disabled>← Previous</button>
          <button class="btn btn-outline btn-sm" id="exStepNext">Next →</button>
        </div>
      </div>

      <h4 style="font-family:var(--display);font-size:1.2rem;" class="mt-16">Your clips</h4>
      <p class="text-sm text-dim">Add a link to your own demo clip or a coach's video for this exercise.</p>
      <div id="clipsList" class="flex mt-8" style="flex-direction:column;gap:6px;"></div>
      <form id="addClipForm" class="flex gap-8 mt-8">
        <input type="url" id="clipUrl" placeholder="https://…embed video URL" required style="flex:1;">
        <button class="btn btn-dark btn-sm" type="submit">Add clip</button>
      </form>

      <div class="flex gap-8 mt-24">
        <button class="btn btn-primary" id="scheduleBtn">＋ Add to today's calendar</button>
        ${isAdmin() ? `<button class="btn btn-outline" id="editExBtn">✎ Edit exercise</button>` : ''}
      </div>
    </div>`;

  const scrim = openModal(html);
  document.getElementById('mClose').addEventListener('click', closeModal);

  let stepIdx = 0;
  const renderStep = ()=>{
    document.getElementById('exStepText').textContent = ex.steps[stepIdx];
    document.getElementById('exStepCounter').textContent = `Step ${stepIdx+1} of ${ex.steps.length}`;
    document.getElementById('exStepPrev').disabled = stepIdx === 0;
    document.getElementById('exStepNext').textContent = stepIdx === ex.steps.length-1 ? 'Restart' : 'Next →';
  };
  document.getElementById('exStepPrev').addEventListener('click', ()=>{ stepIdx = Math.max(0, stepIdx-1); renderStep(); });
  document.getElementById('exStepNext').addEventListener('click', ()=>{ stepIdx = (stepIdx+1) % ex.steps.length; renderStep(); });

  const renderClips = ()=>{
    const list = readJSON('form_clips_'+exId, []);
    document.getElementById('clipsList').innerHTML = list.length
      ? list.map((c,i)=>`<div class="flex justify-between items-center text-sm" style="border:1px solid var(--line);border-radius:8px;padding:6px 10px;"><a href="${c}" target="_blank" rel="noopener" style="color:var(--data);word-break:break-all;">${c}</a><button class="btn-ghost btn-sm" data-rmclip="${i}">Remove</button></div>`).join('')
      : `<p class="text-sm text-dim">No clips added yet.</p>`;
    document.querySelectorAll('[data-rmclip]').forEach(b=> b.addEventListener('click', ()=>{
      const l = readJSON('form_clips_'+exId, []); l.splice(Number(b.dataset.rmclip),1); writeJSON('form_clips_'+exId, l); renderClips();
    }));
  };
  renderClips();

  document.getElementById('addClipForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const url = document.getElementById('clipUrl').value.trim();
    const l = readJSON('form_clips_'+exId, []); l.push(url); writeJSON('form_clips_'+exId, l);
    document.getElementById('clipUrl').value = '';
    renderClips();
    toast('Clip added.', 'success');
  });

  document.getElementById('scheduleBtn').addEventListener('click', ()=>{
    const user = currentUser();
    const cal = getCalendar(user.id);
    const key = new Date().toISOString().slice(0,10);
    cal[key] = cal[key] || [];
    cal[key].push({ id:'sch'+Date.now(), name:ex.name, done:false });
    setCalendar(user.id, cal);
    toast(`${ex.name} added to today's calendar.`, 'success');
  });

  if(isAdmin()){
    document.getElementById('editExBtn').addEventListener('click', ()=> openExerciseEditor(ex));
  }
}

/* -------- admin: add / edit exercise -------- */
function openExerciseEditor(ex){
  const isEdit = !!ex;
  ex = ex || { id:'', name:'', type:'Upper Body', target:'', equipment:'none', level:'beginner', gender:'all', duration:'6 min', img:'', video:'', desc:'', steps:['Step 1'] };
  const html = `
    <div class="modal-head"><h3 style="font-family:var(--display);font-size:1.4rem;">${isEdit?'Edit':'Add'} exercise</h3><button class="modal-close" id="mClose">×</button></div>
    <div class="modal-body">
      <form id="exForm">
        <div class="grid grid-2">
          <div class="field"><label>Name</label><input type="text" id="fName" value="${escapeHtml(ex.name)}" required></div>
          <div class="field"><label>Target muscle</label><input type="text" id="fTarget" value="${escapeHtml(ex.target)}" required></div>
          <div class="field"><label>Type</label>
            <select id="fType"><option ${ex.type==='Upper Body'?'selected':''}>Upper Body</option><option ${ex.type==='Lower Body'?'selected':''}>Lower Body</option><option ${ex.type==='Core'?'selected':''}>Core</option><option ${ex.type==='Cardio'?'selected':''}>Cardio</option></select>
          </div>
          <div class="field"><label>Equipment</label>
            <select id="fEquip"><option value="none" ${ex.equipment==='none'?'selected':''}>No equipment</option><option value="everyday" ${ex.equipment==='everyday'?'selected':''}>Everyday items</option><option value="gym" ${ex.equipment==='gym'?'selected':''}>Gym</option></select>
          </div>
          <div class="field"><label>Level</label>
            <select id="fLevel"><option value="beginner" ${ex.level==='beginner'?'selected':''}>Beginner</option><option value="intermediate" ${ex.level==='intermediate'?'selected':''}>Intermediate</option></select>
          </div>
          <div class="field"><label>Tailored for</label>
            <select id="fGender"><option value="all" ${ex.gender==='all'?'selected':''}>All genders</option><option value="female" ${ex.gender==='female'?'selected':''}>Female</option><option value="male" ${ex.gender==='male'?'selected':''}>Male</option></select>
          </div>
        </div>
        <div class="field"><label>Video embed URL</label><input type="url" id="fVideo" value="${escapeHtml(ex.video)}" placeholder="https://www.youtube.com/embed/…"></div>
        <div class="field"><label>Description</label><textarea id="fDesc" rows="2">${escapeHtml(ex.desc)}</textarea></div>
        <div class="field"><label>Steps (one per line)</label><textarea id="fSteps" rows="4">${ex.steps.join('\n')}</textarea></div>
        <div class="flex gap-8 mt-16">
          <button type="submit" class="btn btn-primary">Save exercise</button>
          ${isEdit ? `<button type="button" class="btn btn-outline" id="deleteExBtn" style="color:var(--accent);">Delete</button>` : ''}
        </div>
      </form>
    </div>`;
  openModal(html);
  document.getElementById('mClose').addEventListener('click', closeModal);
  document.getElementById('exForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const updated = {
      id: ex.id || 'ex'+Date.now(),
      name: document.getElementById('fName').value.trim(),
      target: document.getElementById('fTarget').value.trim(),
      type: document.getElementById('fType').value,
      equipment: document.getElementById('fEquip').value,
      level: document.getElementById('fLevel').value,
      gender: document.getElementById('fGender').value,
      video: document.getElementById('fVideo').value.trim() || 'https://www.youtube.com/embed/aclHkVaku9U',
      desc: document.getElementById('fDesc').value.trim(),
      steps: document.getElementById('fSteps').value.split('\n').map(s=>s.trim()).filter(Boolean),
      duration: ex.duration || '6 min',
      img: ex.img || IMG(('gen'+Date.now())),
    };
    let list = getExercises();
    if(isEdit){ list = list.map(e => e.id===ex.id ? updated : e); }
    else { list.push(updated); }
    saveExercises(list);
    closeModal();
    toast(`Exercise ${isEdit?'updated':'added'}.`, 'success');
    render();
  });
  if(isEdit){
    document.getElementById('deleteExBtn').addEventListener('click', ()=>{
      if(!confirm('Delete this exercise?')) return;
      saveExercises(getExercises().filter(e=>e.id!==ex.id));
      closeModal();
      toast('Exercise deleted.', 'success');
      render();
    });
  }
}
let units = 'metric';

document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  document.getElementById('cAge').value = user.age || 25;
  document.getElementById('cGender').value = (user.gender === 'male') ? 'male' : 'female';
  document.getElementById('cHeight').value = user.heightCm || 170;
  const log = getWeightLog(user.id);
  document.getElementById('cWeight').value = (log.length ? log[log.length-1].kg : user.weightKg) || 65;
  document.getElementById('wDate').value = new Date().toISOString().slice(0,10);

  document.getElementById('unitMetric').addEventListener('click', ()=>setUnits('metric'));
  document.getElementById('unitImperial').addEventListener('click', ()=>setUnits('imperial'));

  document.getElementById('calcForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    calculate();
  });

  document.getElementById('logWeightForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const rawVal = Number(document.getElementById('wVal').value);
    const kg = units === 'imperial' ? lbToKg(rawVal) : rawVal;
    const date = document.getElementById('wDate').value;
    logWeight(user.id, kg, new Date(date).toISOString());
    updateCurrentUser({ weightKg: kg });
    toast('Weight logged.', 'success');
    document.getElementById('wVal').value = '';
    renderChartAndTable();
  });

  document.getElementById('exportWeightBtn').addEventListener('click', ()=>{
    const rows = [['Date','Weight (kg)'], ...getWeightLog(user.id).map(r=>[r.date.slice(0,10), r.kg])];
    downloadCSV(rows, 'weight-history.csv');
  });

  renderChartAndTable();
  calculate();
});

function setUnits(u){
  units = u;
  document.getElementById('unitMetric').classList.toggle('active', u==='metric');
  document.getElementById('unitImperial').classList.toggle('active', u==='imperial');
  const hEl = document.getElementById('cHeight'), wEl = document.getElementById('cWeight'), wvEl = document.getElementById('wVal');
  if(u === 'imperial'){
    document.getElementById('heightLbl').textContent = 'Height (in)';
    document.getElementById('weightLbl').textContent = 'Weight (lb)';
    document.getElementById('wValLbl').textContent = 'Weight (lb)';
    hEl.value = (hEl.value * 0.393701).toFixed(1);
    wEl.value = (wEl.value * 2.20462).toFixed(1);
  } else {
    document.getElementById('heightLbl').textContent = 'Height (cm)';
    document.getElementById('weightLbl').textContent = 'Weight (kg)';
    document.getElementById('wValLbl').textContent = 'Weight (kg)';
    hEl.value = (hEl.value / 0.393701).toFixed(1);
    wEl.value = (wEl.value / 2.20462).toFixed(1);
  }
  renderChartAndTable();
}
function lbToKg(lb){ return lb / 2.20462; }
function inToCm(inch){ return inch / 0.393701; }

function calculate(){
  const age = Number(document.getElementById('cAge').value);
  const gender = document.getElementById('cGender').value;
  let heightCm = Number(document.getElementById('cHeight').value);
  let weightKg = Number(document.getElementById('cWeight').value);
  if(units === 'imperial'){ heightCm = inToCm(heightCm); weightKg = lbToKg(weightKg); }
  const activity = Number(document.getElementById('cActivity').value);

  const bmi = weightKg / Math.pow(heightCm/100, 2);
  const bmr = gender === 'male'
    ? (10*weightKg + 6.25*heightCm - 5*age + 5)
    : (10*weightKg + 6.25*heightCm - 5*age - 161);
  const tdee = bmr * activity;
  const protein = weightKg * 1.8;
  const fat = (tdee * 0.27) / 9;
  const carbs = (tdee - (protein*4) - (fat*9)) / 4;

  document.getElementById('calcResults').classList.remove('hidden');
  document.getElementById('rBmi').textContent = bmi.toFixed(1);
  document.getElementById('rBmiCat').textContent = bmiCategory(bmi);
  document.getElementById('rBmr').textContent = Math.round(bmr).toLocaleString();
  document.getElementById('rTdee').textContent = Math.round(tdee).toLocaleString();
  document.getElementById('rProtein').textContent = Math.round(protein);
  document.getElementById('rCarbs').textContent = Math.max(0,Math.round(carbs));
  document.getElementById('rFat').textContent = Math.round(fat);
}

function renderChartAndTable(){
  const user = currentUser();
  const log = getWeightLog(user.id).slice().sort((a,b)=> new Date(a.date)-new Date(b.date));
  const tbody = document.getElementById('weightTableBody');
  tbody.innerHTML = log.slice().reverse().slice(0,8).map(r=>{
    const disp = units === 'imperial' ? (r.kg*2.20462).toFixed(1)+' lb' : r.kg.toFixed(1)+' kg';
    return `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${disp}</td><td></td></tr>`;
  }).join('') || `<tr><td colspan="3" class="text-dim">No entries yet — log your first weight above.</td></tr>`;

  const canvas = document.getElementById('weightChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const style = getComputedStyle(document.documentElement);
  const line = style.getPropertyValue('--line').trim();
  const accent = style.getPropertyValue('--accent').trim() || '#ff4e33';
  const text = style.getPropertyValue('--text-dim').trim();

  if(log.length < 2){
    ctx.fillStyle = text || '#888';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('Log at least two weigh-ins to see your trend line.', 14, canvas.height/2);
    return;
  }
  const pad = 30;
  const vals = log.map(l=>l.kg);
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const xStep = (canvas.width - pad*2) / (log.length - 1);
  const yFor = v => canvas.height - pad - ((v - min)/(max-min)) * (canvas.height - pad*2);

  // grid
  ctx.strokeStyle = line || '#ddd';
  ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = pad + i*(canvas.height-pad*2)/4;
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(canvas.width-pad,y); ctx.stroke();
  }
  // line
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  log.forEach((l,i)=>{
    const x = pad + i*xStep, y = yFor(l.kg);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // points
  log.forEach((l,i)=>{
    const x = pad + i*xStep, y = yFor(l.kg);
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle = accent; ctx.fill();
  });
}

function bmiCategory(bmi){
  if(bmi < 18.5) return 'Underweight';
  if(bmi < 25) return 'Healthy range';
  if(bmi < 30) return 'Overweight';
  return 'Obesity range';
}

function downloadCSV(rows, filename){
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  toast('Export downloaded.', 'success');
}
let calCursor = new Date();

document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  document.getElementById('prevMonth').addEventListener('click', ()=>{ calCursor.setMonth(calCursor.getMonth()-1); renderCalendar(); });
  document.getElementById('nextMonth').addEventListener('click', ()=>{ calCursor.setMonth(calCursor.getMonth()+1); renderCalendar(); });
  document.getElementById('exportCalBtn').addEventListener('click', exportCalendar);

  renderTray();
  renderCalendar();
});

function renderTray(){
  const user = currentUser();
  const favs = readJSON('form_favorites_'+user.id, []);
  const exList = getExercises().filter(e => favs.includes(e.id));
  const tray = document.getElementById('dragTray');
  const source = exList.length ? exList : getExercises().slice(0,5);
  tray.innerHTML = source.map(ex => `
    <div class="drag-item" draggable="true" data-name="${escapeHtml(ex.name)}">
      <span class="grip">⠿</span> <span>${escapeHtml(ex.name)}</span>
    </div>`).join('');
  if(!exList.length){
    tray.insertAdjacentHTML('afterbegin', `<p class="text-sm text-dim mb-8">No favorites yet — showing sample exercises. <a href="#exercises" style="color:var(--accent);font-weight:700;">Browse library →</a></p>`);
  }
  tray.querySelectorAll('.drag-item').forEach(item=>{
    item.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', item.dataset.name));
  });
}

function renderCalendar(){
  const user = currentUser();
  const cal = getCalendar(user.id);
  const year = calCursor.getFullYear(), month = calCursor.getMonth();
  document.getElementById('monthLabel').textContent = calCursor.toLocaleDateString(undefined,{month:'long', year:'numeric'});

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayKey = new Date().toISOString().slice(0,10);

  const grid = document.getElementById('calGrid');
  let html = '';
  for(let i=0;i<startOffset;i++) html += `<div class="cal-cell muted"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateObj = new Date(year, month, d);
    const key = dateObj.toISOString().slice(0,10);
    const items = cal[key] || [];
    html += `<div class="cal-cell ${key===todayKey?'today':''}" data-key="${key}">
      <span class="cal-date">${d}</span>
      <div class="cal-items" style="display:flex;flex-direction:column;gap:3px;">
        ${items.map(it=>`<div class="cal-item ${it.done?'done':''}" data-id="${it.id}" data-key="${key}" title="Click to toggle done">${escapeHtml(it.name)}</div>`).join('')}
      </div>
      <button class="btn-ghost" data-addkey="${key}" style="font-size:.65rem;padding:2px 4px;align-self:flex-start;">+ add</button>
    </div>`;
  }
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-cell[data-key]').forEach(cell=>{
    cell.addEventListener('dragover', e=>{ e.preventDefault(); cell.classList.add('dragover'); });
    cell.addEventListener('dragleave', ()=> cell.classList.remove('dragover'));
    cell.addEventListener('drop', e=>{
      e.preventDefault();
      cell.classList.remove('dragover');
      const name = e.dataTransfer.getData('text/plain');
      if(!name) return;
      addToDay(cell.dataset.key, name);
    });
  });
  grid.querySelectorAll('.cal-item').forEach(el=>{
    el.addEventListener('click', ()=> toggleDone(el.dataset.key, el.dataset.id));
  });
  grid.querySelectorAll('[data-addkey]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = prompt('Workout name:');
      if(name) addToDay(btn.dataset.addkey, name.trim());
    });
  });
}

function addToDay(key, name){
  const user = currentUser();
  const cal = getCalendar(user.id);
  cal[key] = cal[key] || [];
  cal[key].push({ id:'sch'+Date.now()+Math.random().toString(16).slice(2), name, done:false });
  setCalendar(user.id, cal);
  toast(`Added "${name}" to ${new Date(key).toLocaleDateString()}.`, 'success');
  renderCalendar();
}

function toggleDone(key, id){
  const user = currentUser();
  const cal = getCalendar(user.id);
  const items = cal[key] || [];
  let justCompleted = false;
  cal[key] = items.map(it=>{
    if(it.id === id){ justCompleted = !it.done; return {...it, done:!it.done}; }
    return it;
  });
  setCalendar(user.id, cal);
  if(justCompleted && key === new Date().toISOString().slice(0,10)){
    updateCurrentUser({ streak: (user.streak||0) + 1, lastWorkout: key });
    toast('Nice work — streak updated!', 'success');
  }
  renderCalendar();
}

function exportCalendar(){
  const user = currentUser();
  const cal = getCalendar(user.id);
  const rows = [['Date','Workout','Completed']];
  Object.keys(cal).sort().forEach(key => cal[key].forEach(it => rows.push([key, it.name, it.done ? 'Yes':'No'])));
  const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'workout-schedule.csv'; a.click();
  toast('Schedule exported.', 'success');
}
document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  document.getElementById('logDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('logDate').addEventListener('change', renderLog);

  initTabsWithin(document.getElementById('view-nutrition'));

  document.getElementById('customFoodForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    addFoodEntry(user.id, {
      name: document.getElementById('cfName').value.trim(),
      kcal: Number(document.getElementById('cfKcal').value) || 0,
      protein: Number(document.getElementById('cfProtein').value) || 0,
      carbs: Number(document.getElementById('cfCarbs').value) || 0,
      fat: Number(document.getElementById('cfFat').value) || 0,
      ingredients: document.getElementById('cfIngredients').value.trim(),
      date: document.getElementById('logDate').value,
    });
    e.target.reset();
    toast('Food logged.', 'success');
    renderLog(); renderStats();
  });

  document.getElementById('foodSearch').addEventListener('input', renderDatabase);
  document.getElementById('clearShopping').addEventListener('click', ()=>{ writeJSON('form_shopping', []); renderShopping(); });
  document.getElementById('printShopping').addEventListener('click', ()=> window.print());

  renderStats(); renderLog(); renderDatabase(); renderRecipes(); renderShopping();
});

function renderStats(){
  const user = currentUser();
  const date = document.getElementById('logDate').value;
  const entries = getFoodLog(user.id).filter(e => e.date === date);
  const totals = entries.reduce((acc,e)=>({ kcal:acc.kcal+e.kcal, protein:acc.protein+e.protein, carbs:acc.carbs+e.carbs, fat:acc.fat+e.fat }), {kcal:0,protein:0,carbs:0,fat:0});
  const weightKg = (getWeightLog(user.id).slice(-1)[0]||{}).kg || user.weightKg || 65;
  const targetKcal = Math.round(weightKg * 30); // simple estimate for the widget

  document.getElementById('nutriStats').innerHTML = `
    <div class="card stat-card"><span class="stat-label">Calories today</span><span class="stat-num">${totals.kcal}</span><span class="stat-delta ${totals.kcal>targetKcal?'down':'up'}">of ~${targetKcal} kcal target</span></div>
    <div class="card stat-card"><span class="stat-label">Protein</span><span class="stat-num">${totals.protein}g</span><span class="stat-delta">of ${Math.round(weightKg*1.8)}g target</span></div>
    <div class="card stat-card"><span class="stat-label">Carbs</span><span class="stat-num">${totals.carbs}g</span><span class="stat-delta">logged today</span></div>
    <div class="card stat-card"><span class="stat-label">Fat</span><span class="stat-num">${totals.fat}g</span><span class="stat-delta">logged today</span></div>`;
}

function renderLog(){
  const user = currentUser();
  const date = document.getElementById('logDate').value;
  const entries = getFoodLog(user.id).filter(e => e.date === date);
  document.getElementById('logTableBody').innerHTML = entries.length ? entries.map(e=>`
    <tr>
      <td>${escapeHtml(e.name)}${e.ingredients ? `<div class="text-sm text-dim">${escapeHtml(e.ingredients)}</div>`:''}</td>
      <td>${e.kcal}</td><td>${e.protein}g</td><td>${e.carbs}g</td><td>${e.fat}g</td>
      <td><button class="btn-ghost btn-sm" data-rm="${e.id}">Remove</button></td>
    </tr>`).join('') : `<tr><td colspan="6" class="text-dim">Nothing logged for this day yet.</td></tr>`;
  document.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', ()=>{
    removeFoodEntry(user.id, b.dataset.rm); renderLog(); renderStats();
  }));
}

function renderDatabase(){
  const q = document.getElementById('foodSearch').value.trim().toLowerCase();
  const foods = readJSON('form_foods', []).filter(f => !q || f.name.toLowerCase().includes(q));
  document.getElementById('foodDbGrid').innerHTML = foods.map(f=>`
    <div class="card">
      <div class="flex justify-between items-center"><h4 style="font-size:1rem;">${escapeHtml(f.name)}</h4><span class="text-sm text-dim">${f.portion}</span></div>
      <div class="ex-tags mt-8">
        <span class="tag" style="background:var(--paper-soft);">${f.kcal} kcal</span>
        <span class="tag tag-level">P ${f.protein}g</span>
        <span class="tag tag-equip">C ${f.carbs}g</span>
        <span class="tag tag-target">F ${f.fat}g</span>
      </div>
      <button class="btn btn-outline btn-sm w-full mt-16" data-quickadd="${f.id}">+ Add to today's log</button>
    </div>`).join('') || `<p class="text-dim">No matches.</p>`;
  document.querySelectorAll('[data-quickadd]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = readJSON('form_foods', []).find(x=>x.id===btn.dataset.quickadd);
      const user = currentUser();
      addFoodEntry(user.id, { name:f.name, kcal:f.kcal, protein:f.protein, carbs:f.carbs, fat:f.fat, ingredients:'', date: document.getElementById('logDate').value });
      toast(`${f.name} added to today's log.`, 'success');
      renderLog(); renderStats();
    });
  });
}

function renderRecipes(){
  const recipes = readJSON('form_recipes', []);
  document.getElementById('recipeGrid').innerHTML = recipes.map(r=>`
    <div class="ex-card">
      <div class="ex-thumb"><img src="${r.img}" alt="${escapeHtml(r.name)}" loading="lazy"></div>
      <div class="ex-body">
        <h4>${escapeHtml(r.name)}</h4>
        <div class="ex-tags"><span class="tag" style="background:var(--paper-soft);">${r.kcal} kcal</span><span class="tag tag-level">P${r.protein}</span><span class="tag tag-equip">C${r.carbs}</span><span class="tag tag-target">F${r.fat}</span></div>
        <p class="text-sm text-dim">${r.ingredients.join(', ')}</p>
        <div class="ex-foot">
          <button class="btn btn-outline btn-sm" data-addshop="${r.id}">+ Shopping list</button>
          <button class="btn btn-primary btn-sm" data-logrecipe="${r.id}">+ Log meal</button>
        </div>
      </div>
    </div>`).join('');

  document.querySelectorAll('[data-addshop]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const r = readJSON('form_recipes', []).find(x=>x.id===btn.dataset.addshop);
      const list = readJSON('form_shopping', []);
      r.ingredients.forEach(ing => { if(!list.includes(ing)) list.push(ing); });
      writeJSON('form_shopping', list);
      toast(`Added ${r.name} ingredients to shopping list.`, 'success');
      renderShopping();
    });
  });
  document.querySelectorAll('[data-logrecipe]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const r = readJSON('form_recipes', []).find(x=>x.id===btn.dataset.logrecipe);
      const user = currentUser();
      addFoodEntry(user.id, { name:r.name, kcal:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat, ingredients:r.ingredients.join(', '), date: document.getElementById('logDate').value });
      toast(`${r.name} logged.`, 'success');
      renderLog(); renderStats();
    });
  });
}

function renderShopping(){
  const list = readJSON('form_shopping', []);
  document.getElementById('shoppingList').innerHTML = list.length
    ? `<ul style="list-style:disc;padding-left:20px;display:flex;flex-direction:column;gap:6px;">${list.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    : `<p class="text-dim">Your shopping list is empty — add ingredients from a recipe.</p>`;
}
let routine = [];

document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  renderPool();
  renderRoutine();
  renderSaved();

  document.getElementById('poolSearch').addEventListener('input', renderPool);
  document.getElementById('saveRoutineBtn').addEventListener('click', saveRoutine);
  document.getElementById('printRoutineBtn').addEventListener('click', ()=>{
    if(!routine.length){ toast('Add exercises to your routine before printing.', 'error'); return; }
    window.print();
  });
  document.getElementById('startTimerBtn').addEventListener('click', startWorkout);
  document.getElementById('timerPause').addEventListener('click', ()=>{
    timerState.paused = !timerState.paused;
    document.getElementById('timerPause').textContent = timerState.paused ? '▶ Resume' : '⏸ Pause';
  });
  document.getElementById('timerSkip').addEventListener('click', nextInterval);
  document.getElementById('timerExit').addEventListener('click', ()=> endWorkout(false));

  const routineList = document.getElementById('routineList');
  routineList.addEventListener('dragover', e=>{ e.preventDefault(); routineList.classList.add('dragover'); });
  routineList.addEventListener('dragleave', ()=> routineList.classList.remove('dragover'));
  routineList.addEventListener('drop', e=>{
    e.preventDefault();
    routineList.classList.remove('dragover');
    const id = e.dataTransfer.getData('text/plain');
    if(id && !routine.includes(id)) { routine.push(id); renderRoutine(); }
  });
});

function renderPool(){
  const q = document.getElementById('poolSearch').value.trim().toLowerCase();
  const list = getExercises().filter(ex => !q || ex.name.toLowerCase().includes(q));
  const pool = document.getElementById('poolList');
  pool.innerHTML = list.map(ex => `
    <div class="drag-item" draggable="true" data-id="${ex.id}">
      <span class="grip">⠿</span>
      <span style="flex:1;">${escapeHtml(ex.name)} <span class="text-dim text-sm">· ${ex.target}</span></span>
      <button class="btn-ghost btn-sm" data-quickadd="${ex.id}">+</button>
    </div>`).join('');
  pool.querySelectorAll('.drag-item').forEach(item=>{
    item.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', item.dataset.id));
  });
  pool.querySelectorAll('[data-quickadd]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!routine.includes(btn.dataset.quickadd)){ routine.push(btn.dataset.quickadd); renderRoutine(); }
    });
  });
}

function renderRoutine(){
  const all = getExercises();
  const wrap = document.getElementById('routineList');
  if(!routine.length){ wrap.innerHTML = `<p class="text-dim text-sm">Drag exercises here to build your routine.</p>`; return; }
  wrap.innerHTML = routine.map((id,i)=>{
    const ex = all.find(e=>e.id===id);
    if(!ex) return '';
    return `<div class="drag-item" draggable="true" data-rid="${id}">
      <span class="grip">⠿</span>
      <span style="flex:1;"><strong>${i+1}.</strong> ${escapeHtml(ex.name)} <span class="text-dim text-sm">· ${ex.duration}</span></span>
      <button class="btn-ghost btn-sm" data-remove="${id}">✕</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ routine = routine.filter(id=>id!==btn.dataset.remove); renderRoutine(); });
  });
  // simple reorder: dragstart sets id, dropping on another item swaps position
  wrap.querySelectorAll('.drag-item[data-rid]').forEach(item=>{
    item.addEventListener('dragstart', e=> e.dataTransfer.setData('reorder', item.dataset.rid));
    item.addEventListener('dragover', e=> e.preventDefault());
    item.addEventListener('drop', e=>{
      e.preventDefault(); e.stopPropagation();
      const draggedId = e.dataTransfer.getData('reorder') || e.dataTransfer.getData('text/plain');
      if(!draggedId || draggedId === item.dataset.rid) return;
      const from = routine.indexOf(draggedId);
      const to = routine.indexOf(item.dataset.rid);
      if(from === -1){ if(!routine.includes(draggedId)) routine.splice(to,0,draggedId); }
      else { routine.splice(from,1); routine.splice(to,0,draggedId); }
      renderRoutine();
    });
  });
}

function saveRoutine(){
  const name = document.getElementById('routineName').value.trim();
  if(!name){ toast('Give your routine a name first.', 'error'); return; }
  if(!routine.length){ toast('Add at least one exercise.', 'error'); return; }
  const user = currentUser();
  const all = readJSON('form_routines_'+user.id, []);
  all.push({ id:'rt'+Date.now(), name, exercises:[...routine], createdAt:new Date().toISOString() });
  writeJSON('form_routines_'+user.id, all);
  toast('Routine saved.', 'success');
  document.getElementById('routineName').value = '';
  renderSaved();
}

function renderSaved(){
  const user = currentUser();
  const all = readJSON('form_routines_'+user.id, []);
  document.getElementById('savedRoutines').innerHTML = all.length ? all.map(r=>`
    <div class="card">
      <h4 style="font-size:1.05rem;">${escapeHtml(r.name)}</h4>
      <p class="text-sm text-dim">${r.exercises.length} exercises</p>
      <div class="flex gap-8 mt-8">
        <button class="btn btn-outline btn-sm" data-loadroutine="${r.id}">Load</button>
        <button class="btn btn-ghost btn-sm" data-delroutine="${r.id}" style="color:var(--accent);">Delete</button>
      </div>
    </div>`).join('') : `<p class="text-dim">No saved routines yet.</p>`;
  document.querySelectorAll('[data-loadroutine]').forEach(b=> b.addEventListener('click', ()=>{
    const r = readJSON('form_routines_'+user.id, []).find(x=>x.id===b.dataset.loadroutine);
    routine = [...r.exercises]; document.getElementById('routineName').value = r.name; renderRoutine();
    toast('Routine loaded into builder.', 'success');
  }));
  document.querySelectorAll('[data-delroutine]').forEach(b=> b.addEventListener('click', ()=>{
    writeJSON('form_routines_'+user.id, readJSON('form_routines_'+user.id, []).filter(x=>x.id!==b.dataset.delroutine));
    renderSaved();
  }));
}

/* -------- active workout timer overlay -------- */
let timerState = { queue:[], idx:0, seconds:45, remaining:45, paused:false, handle:null };

function startWorkout(){
  if(!routine.length){ toast('Build a routine first.', 'error'); return; }
  const all = getExercises();
  timerState.queue = routine.map(id => all.find(e=>e.id===id)).filter(Boolean);
  timerState.idx = 0;
  document.getElementById('timerOverlay').classList.remove('hidden');
  runInterval();
}

function currentTimerExercise(){ return timerState.queue[timerState.idx]; }

function runInterval(){
  clearInterval(timerState.handle);
  timerState.remaining = timerState.seconds;
  timerState.paused = false;
  document.getElementById('timerPause').textContent = '⏸ Pause';
  updateTimerUI();
  timerState.handle = setInterval(()=>{
    if(timerState.paused) return;
    timerState.remaining--;
    if(timerState.remaining <= 5 && timerState.remaining >= 0) beep();
    if(timerState.remaining <= 0){ nextInterval(); return; }
    updateTimerUI();
  }, 1000);
}

function nextInterval(){
  timerState.idx++;
  if(timerState.idx >= timerState.queue.length){ endWorkout(true); return; }
  runInterval();
}

function updateTimerUI(){
  const ex = currentTimerExercise();
  document.getElementById('timerExerciseName').textContent = ex ? ex.name : '';
  const m = String(Math.floor(timerState.remaining/60)).padStart(2,'0');
  const s = String(timerState.remaining%60).padStart(2,'0');
  document.getElementById('timerClock').textContent = `${m}:${s}`;
  document.getElementById('timerBarFill').style.width = `${(timerState.remaining/timerState.seconds)*100}%`;
  const next = timerState.queue[timerState.idx+1];
  document.getElementById('timerNext').textContent = 'Up next: ' + (next ? next.name : 'Cool down — you\'re almost done!');
}

function beep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  }catch(e){ /* audio not available */ }
}

function endWorkout(completed){
  clearInterval(timerState.handle);
  document.getElementById('timerOverlay').classList.add('hidden');
  if(completed){
    const user = currentUser();
    const cal = getCalendar(user.id);
    const key = new Date().toISOString().slice(0,10);
    cal[key] = cal[key] || [];
    cal[key].push({ id:'sch'+Date.now(), name: document.getElementById('routineName').value || 'Custom routine', done:true });
    setCalendar(user.id, cal);
    updateCurrentUser({ streak: (user.streak||0) + 1 });
    toast('Workout complete — logged to your calendar!', 'success');
  } else {
    toast('Workout ended.', 'success');
  }
}
const TOPICS = ['General','Nutrition','Strength Training','Cardio','Motivation'];
let activeTopic = 'All';

document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  initTabsWithin(document.getElementById('view-community'));

  seedThreadsIfEmpty();
  renderTopics();
  renderThreads();
  renderLeaderboard();
  renderFeedback();
  renderTrainerPosts();
  renderQa();

  document.getElementById('qaForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const list = readJSON('form_qa', []);
    list.unshift({ id:'qa'+Date.now(), author:user.name, question:document.getElementById('qaQuestion').value.trim(), date:new Date().toISOString() });
    writeJSON('form_qa', list);
    e.target.reset();
    toast('Question submitted for the next live session.', 'success');
    renderQa();
  });

  document.getElementById('threadForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const threads = readJSON('form_threads', []);
    threads.unshift({
      id:'th'+Date.now(), title:document.getElementById('threadTitle').value.trim(),
      body:document.getElementById('threadBody').value.trim(), topic:document.getElementById('threadTopic').value,
      author:user.name, date:new Date().toISOString(), replies:[],
    });
    writeJSON('form_threads', threads);
    e.target.reset();
    toast('Thread posted.', 'success');
    renderThreads();
  });

  document.getElementById('feedbackForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    addComment({
      type: document.getElementById('fbType').value,
      subject: document.getElementById('fbSubject').value.trim(),
      message: document.getElementById('fbMessage').value.trim(),
      author: user.name,
    });
    e.target.reset();
    toast('Thanks — your feedback was submitted.', 'success');
    renderFeedback();
  });
});

function seedThreadsIfEmpty(){
  if(localStorage.getItem('form_threads')) return;
  writeJSON('form_threads', [
    { id:'th1', title:'How do you stay consistent on busy weeks?', body:'Some weeks I can barely fit in one session. What keeps you on track?', topic:'Motivation', author:'Amara K.', date:new Date(Date.now()-864e5*2).toISOString(), replies:[{author:'Priya S.', body:'I schedule workouts like meetings — non-negotiable 20 minute blocks.'}] },
    { id:'th2', title:'Best everyday-item substitute for dumbbells?', body:'Traveling for a month, no gym access. What household items have worked for you?', topic:'Strength Training', author:'Diego R.', date:new Date(Date.now()-864e5*5).toISOString(), replies:[] },
    { id:'th3', title:'Simple high-protein breakfast ideas', body:'Looking for quick options under 10 minutes prep.', topic:'Nutrition', author:'Nia W.', date:new Date(Date.now()-864e5).toISOString(), replies:[] },
  ]);
}

function renderTopics(){
  const list = document.getElementById('topicList');
  const all = ['All', ...TOPICS];
  list.innerHTML = all.map(t => `<button class="chip ${t===activeTopic?'active':''}" data-topic="${t}" style="justify-content:flex-start;">${t}</button>`).join('');
  list.querySelectorAll('[data-topic]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ activeTopic = btn.dataset.topic; renderTopics(); renderThreads(); });
  });
}

function renderThreads(){
  const threads = readJSON('form_threads', []).filter(t => activeTopic==='All' || t.topic===activeTopic);
  document.getElementById('threadsWrap').innerHTML = threads.length ? threads.map(t=>`
    <div class="thread">
      <div class="flex justify-between items-start">
        <h4 style="font-size:1.05rem;">${escapeHtml(t.title)}</h4>
        <span class="tag" style="background:var(--paper-soft);">${t.topic}</span>
      </div>
      <p class="mt-8">${escapeHtml(t.body)}</p>
      <div class="thread-meta mt-8"><span>${escapeHtml(t.author)}</span><span>·</span><span>${new Date(t.date).toLocaleDateString()}</span><span>·</span><span>${t.replies.length} repl${t.replies.length===1?'y':'ies'}</span></div>
      ${t.replies.map(r=>`<div class="mt-8" style="padding-left:14px;border-left:2px solid var(--line);"><strong style="font-size:.85rem;">${escapeHtml(r.author)}:</strong> <span class="text-sm">${escapeHtml(r.body)}</span></div>`).join('')}
      <form class="flex gap-8 mt-8" data-reply="${t.id}">
        <input type="text" placeholder="Write a reply…" required style="flex:1;">
        <button class="btn btn-outline btn-sm" type="submit">Reply</button>
      </form>
    </div>`).join('') : `<p class="text-dim">No threads in this topic yet — start one above.</p>`;

  document.querySelectorAll('[data-reply]').forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const input = form.querySelector('input');
      const threads = readJSON('form_threads', []);
      const t = threads.find(x=>x.id===form.dataset.reply);
      t.replies.push({ author: currentUser().name, body: input.value.trim() });
      writeJSON('form_threads', threads);
      renderThreads();
    });
  });
}

function renderLeaderboard(){
  const users = getUsers().slice().sort((a,b)=> (b.streak||0) - (a.streak||0));
  document.getElementById('leaderboardBody').innerHTML = users.length ? users.map((u,i)=>{
    const cal = getCalendar(u.id);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-weekStart.getDay());
    let count = 0;
    for(let d=0; d<7; d++){ const dd=new Date(weekStart); dd.setDate(weekStart.getDate()+d); const key=dd.toISOString().slice(0,10); count += (cal[key]||[]).filter(it=>it.done).length; }
    return `<tr><td>${i+1}</td><td>${escapeHtml(u.name)}</td><td>🔥 ${u.streak||0}</td><td>${count}</td></tr>`;
  }).join('') : `<tr><td colspan="4" class="text-dim">No members yet.</td></tr>`;
}

function renderFeedback(){
  const list = getComments();
  document.getElementById('feedbackList').innerHTML = list.length ? list.map(c=>`
    <div class="card mb-16">
      <div class="flex justify-between items-center">
        <span class="tag ${c.type==='Complaint' ? 'tag-target' : c.type==='Suggestion' ? 'tag-level':'tag-equip'}">${c.type}</span>
        <span class="text-sm text-dim">${new Date(c.date).toLocaleDateString()}</span>
      </div>
      <h4 style="font-size:1rem;" class="mt-8">${escapeHtml(c.subject)}</h4>
      <p class="text-sm mt-8">${escapeHtml(c.message)}</p>
      <p class="text-sm text-dim mt-8">— ${escapeHtml(c.author)}</p>
    </div>`).join('') : `<p class="text-dim">No feedback submitted yet.</p>`;
}

const TRAINER_POSTS = [
  { author:'Coach Elena M.', role:'Strength & Conditioning', title:'Why tempo matters more than you think', body:'Slowing down the lowering phase of a lift under control builds more usable strength than rushing for extra reps — try a 3-second descent on your next squat session.', date:new Date(Date.now()-864e5*3).toISOString() },
  { author:'Coach Marcus T.', role:'Mobility Coach', title:'A 5-minute hip routine for desk workers', body:'Long sitting stiffens the hip flexors more than almost anything else. Pair a couch stretch with 90/90 switches before your next lower-body session.', date:new Date(Date.now()-864e5*7).toISOString() },
  { author:'Coach Priya D.', role:'Nutrition Coach', title:'Protein timing is less strict than people assume', body:'Total daily protein matters far more than exact timing around your workout — spread intake across 3–4 meals and don\'t stress the "anabolic window".', date:new Date(Date.now()-864e5*10).toISOString() },
];

function renderTrainerPosts(){
  document.getElementById('trainerPosts').innerHTML = TRAINER_POSTS.map(p=>`
    <div class="thread">
      <div class="flex justify-between items-start">
        <h4 style="font-size:1.05rem;">${escapeHtml(p.title)}</h4>
        <span class="tag tag-level">${escapeHtml(p.role)}</span>
      </div>
      <p class="mt-8">${escapeHtml(p.body)}</p>
      <div class="thread-meta mt-8"><span>${escapeHtml(p.author)}</span><span>·</span><span>${new Date(p.date).toLocaleDateString()}</span></div>
    </div>`).join('');
}

function renderQa(){
  const list = readJSON('form_qa', []);
  document.getElementById('qaList').innerHTML = list.length
    ? `<p class="text-sm text-dim mb-8">Submitted questions:</p>` + list.slice(0,5).map(q=>`<div class="text-sm mb-8" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;"><strong>${escapeHtml(q.author)}:</strong> ${escapeHtml(q.question)}</div>`).join('')
    : `<p class="text-sm text-dim">No questions submitted yet — be the first.</p>`;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  paintAvatar(user);
  document.getElementById('pName').value = user.name;
  document.getElementById('pEmail').value = user.email;
  document.getElementById('pGender').value = user.gender;
  document.getElementById('pAge').value = user.age || '';
  document.getElementById('pHeight').value = user.heightCm || '';
  document.getElementById('pEquip').value = user.equipment || 'none';
  document.getElementById('pMedical').value = user.medical || '';
  document.getElementById('staySignedIn').checked = !!localStorage.getItem('form_session');

  document.getElementById('uploadAvatarBtn').addEventListener('click', ()=>{
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', ()=>{
      if(!input.files[0]) return;
      fileToDataUrl(input.files[0], (dataUrl)=>{
        updateCurrentUser({ avatar: dataUrl });
        paintAvatar(currentUser());
        toast('Profile photo updated.', 'success');
      });
    });
    input.click();
  });
  document.getElementById('removeAvatarBtn').addEventListener('click', ()=>{
    updateCurrentUser({ avatar:'' });
    paintAvatar(currentUser());
    toast('Profile photo removed.', 'success');
  });

  document.getElementById('profileForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    updateCurrentUser({
      name: document.getElementById('pName').value.trim(),
      email: document.getElementById('pEmail').value.trim(),
      gender: document.getElementById('pGender').value,
      age: Number(document.getElementById('pAge').value) || null,
      heightCm: Number(document.getElementById('pHeight').value) || null,
      equipment: document.getElementById('pEquip').value,
      medical: document.getElementById('pMedical').value.trim(),
    });
    toast('Profile updated.', 'success');
    initShell();
  });

  document.getElementById('settingsThemeBtn').addEventListener('click', toggleTheme);

  document.getElementById('staySignedIn').addEventListener('change', (e)=>{
    const remember = e.target.checked;
    login(user.email, user.password, remember);
    toast(remember ? 'You\'ll stay signed in on this device.' : 'You\'ll be signed out when this tab closes.', 'success');
  });

  document.getElementById('exportAllCsv').addEventListener('click', ()=>{
    const rows = [['Type','Date','Detail 1','Detail 2']];
    getWeightLog(user.id).forEach(w => rows.push(['Weight', w.date.slice(0,10), w.kg+' kg', '']));
    getFoodLog(user.id).forEach(f => rows.push(['Food', f.date, f.name, f.kcal+' kcal']));
    const cal = getCalendar(user.id);
    Object.keys(cal).forEach(k => cal[k].forEach(it => rows.push(['Workout', k, it.name, it.done?'done':'planned'])));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'form-account-history.csv'; a.click();
    toast('Export downloaded.', 'success');
  });
  document.getElementById('exportPdf').addEventListener('click', ()=> window.print());

  document.getElementById('deleteAccountBtn').addEventListener('click', ()=>{
    if(!confirm('This will permanently delete your account and locally stored data. Continue?')) return;
    saveUsers(getUsers().filter(u=>u.id!==user.id));
    logout();
  });
});

function paintAvatar(user){
  const el = document.getElementById('avatarPreview');
  const initials = (user.name||'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  el.innerHTML = user.avatar ? `<img src="${user.avatar}" alt="">` : initials;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  if(!isAdmin()){
    document.getElementById('deniedPanel').classList.remove('hidden');
    return;
  }
  document.getElementById('adminBody').classList.remove('hidden');

  initTabsWithin(document.getElementById('view-admin'));

  renderUsers();
  renderExTable();
  renderFoods();
  renderModeration();

  document.getElementById('addExAdminBtn').addEventListener('click', ()=> openExerciseEditor());

  document.getElementById('addFoodForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const foods = readJSON('form_foods', []);
    foods.push({ id:'f'+Date.now(), name:document.getElementById('afName').value.trim(), portion:document.getElementById('afPortion').value.trim(), kcal:Number(document.getElementById('afKcal').value), protein:0, carbs:0, fat:0, tags:[] });
    writeJSON('form_foods', foods);
    e.target.reset();
    toast('Food added to database.', 'success');
    renderFoods();
  });
});

function renderUsers(){
  const users = getUsers();
  const me = currentUser();
  document.getElementById('usersBody').innerHTML = users.map(u=>`
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="tag ${u.role==='admin'?'tag-level':'tag-equip'}">${u.role}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>🔥 ${u.streak||0}</td>
      <td class="flex gap-8">
        <button class="btn-ghost btn-sm" data-toggle-role="${u.id}">${u.role==='admin'?'Revoke admin':'Make admin'}</button>
        ${u.id!==me.id ? `<button class="btn-ghost btn-sm" data-del-user="${u.id}" style="color:var(--accent);">Delete</button>` : ''}
      </td>
    </tr>`).join('');

  document.querySelectorAll('[data-toggle-role]').forEach(b=> b.addEventListener('click', ()=>{
    const users2 = getUsers().map(u => u.id===b.dataset.toggleRole ? {...u, role: u.role==='admin'?'member':'admin'} : u);
    saveUsers(users2);
    toast('Role updated.', 'success');
    renderUsers();
  }));
  document.querySelectorAll('[data-del-user]').forEach(b=> b.addEventListener('click', ()=>{
    if(!confirm('Delete this member account?')) return;
    saveUsers(getUsers().filter(u=>u.id!==b.dataset.delUser));
    toast('Member removed.', 'success');
    renderUsers();
  }));
}

function renderExTable(){
  const list = getExercises();
  document.getElementById('exBody').innerHTML = list.map(ex=>`
    <tr>
      <td>${escapeHtml(ex.name)}</td><td>${ex.type}</td><td>${ex.target}</td><td>${ex.equipment}</td><td>${ex.level}</td>
      <td class="flex gap-8">
        <button class="btn-ghost btn-sm" data-edit-ex="${ex.id}">Edit</button>
        <button class="btn-ghost btn-sm" data-del-ex="${ex.id}" style="color:var(--accent);">Delete</button>
      </td>
    </tr>`).join('');
  document.querySelectorAll('[data-edit-ex]').forEach(b=> b.addEventListener('click', ()=>{
    const ex = getExercises().find(e=>e.id===b.dataset.editEx);
    openExerciseEditor(ex);
  }));
  document.querySelectorAll('[data-del-ex]').forEach(b=> b.addEventListener('click', ()=>{
    if(!confirm('Delete this exercise from the library?')) return;
    saveExercises(getExercises().filter(e=>e.id!==b.dataset.delEx));
    toast('Exercise deleted.', 'success');
    renderExTable();
  }));
}

// re-render admin exercise table after the shared editor modal saves changes
const _origSaveExercises = saveExercises;
saveExercises = function(list){ _origSaveExercises(list); if(document.getElementById('exBody')) renderExTable(); };

function renderFoods(){
  const foods = readJSON('form_foods', []);
  document.getElementById('foodsBody').innerHTML = foods.map(f=>`
    <tr><td>${escapeHtml(f.name)}</td><td>${f.portion}</td><td>${f.kcal}</td>
      <td><button class="btn-ghost btn-sm" data-del-food="${f.id}" style="color:var(--accent);">Delete</button></td>
    </tr>`).join('');
  document.querySelectorAll('[data-del-food]').forEach(b=> b.addEventListener('click', ()=>{
    writeJSON('form_foods', readJSON('form_foods', []).filter(f=>f.id!==b.dataset.delFood));
    renderFoods();
  }));
}

function renderModeration(){
  const comments = getComments();
  document.getElementById('modFeedback').innerHTML = comments.length ? comments.map(c=>`
    <div class="card mb-16">
      <div class="flex justify-between items-center">
        <span class="tag tag-target">${c.type}</span>
        <button class="btn-ghost btn-sm" data-del-comment="${c.id}" style="color:var(--accent);">Delete</button>
      </div>
      <h4 style="font-size:1rem;" class="mt-8">${escapeHtml(c.subject)}</h4>
      <p class="text-sm mt-8">${escapeHtml(c.message)}</p>
      <p class="text-sm text-dim mt-8">— ${escapeHtml(c.author)} · ${new Date(c.date).toLocaleDateString()}</p>
    </div>`).join('') : `<p class="text-dim">Inbox is empty.</p>`;
  document.querySelectorAll('[data-del-comment]').forEach(b=> b.addEventListener('click', ()=>{
    deleteComment(b.dataset.delComment);
    renderModeration();
  }));

  const threads = readJSON('form_threads', []);
  document.getElementById('modThreads').innerHTML = threads.length ? threads.map(t=>`
    <div class="thread">
      <div class="flex justify-between items-center">
        <h4 style="font-size:1rem;">${escapeHtml(t.title)}</h4>
        <button class="btn-ghost btn-sm" data-del-thread="${t.id}" style="color:var(--accent);">Delete thread</button>
      </div>
      <p class="thread-meta">${escapeHtml(t.author)} · ${t.topic} · ${t.replies.length} replies</p>
    </div>`).join('') : `<p class="text-dim">No threads yet.</p>`;
  document.querySelectorAll('[data-del-thread]').forEach(b=> b.addEventListener('click', ()=>{
    writeJSON('form_threads', readJSON('form_threads', []).filter(t=>t.id!==b.dataset.delThread));
    renderModeration();
  }));
}
const PROMO_CODES = { FORM20:'20% off any paid plan for 3 months', FREESHIP:'Free shipping on Coach merch', WELCOME:'Extra 7-day trial extension' };

document.addEventListener('DOMContentLoaded', ()=>{
  const user = currentUser();
  if(!user) return;

  const plan = readJSON('form_plan_'+user.id, 'free');
  paintPlan(plan);

  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const chosen = btn.dataset.plan;
      if(chosen === plan){ toast('That\'s already your current plan.', 'success'); return; }
      writeJSON('form_plan_'+user.id, chosen);
      paintPlan(chosen);
      const label = chosen === 'free' ? 'Free' : chosen === 'plus' ? 'Plus (7-day trial started)' : 'Coach';
      toast(`Switched to ${label}.`, 'success');
    });
  });

  document.getElementById('promoForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    const result = document.getElementById('promoResult');
    if(PROMO_CODES[code]){
      result.textContent = `✓ Applied: ${PROMO_CODES[code]}`;
      result.style.color = 'var(--health-ink)';
      toast('Promo code applied.', 'success');
    } else {
      result.textContent = 'That code isn\'t recognized — check for typos.';
      result.style.color = 'var(--accent-ink)';
    }
  });
});

function paintPlan(plan){
  const label = { free:'Free', plus:'Plus', coach:'Coach' }[plan] || 'Free';
  document.getElementById('currentPlanTag').textContent = `Current plan: ${label}`;
  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.textContent = btn.dataset.plan === plan ? 'Current plan'
      : btn.dataset.plan === 'plus' ? 'Start free trial'
      : btn.dataset.plan === 'coach' ? 'Upgrade to Coach' : 'Switch to Free';
  });
}
let authScreenBooted = false;
function initAuthScreen(){
  if(authScreenBooted) return;
  authScreenBooted = true;

  const tabSignin = document.getElementById('tabSignin');
  const tabSignup = document.getElementById('tabSignup');
  const panelSignin = document.getElementById('panelSignin');
  const panelSignup = document.getElementById('panelSignup');

  function activateTab(which){
    const signin = which === 'signin';
    tabSignin.classList.toggle('active', signin);
    tabSignup.classList.toggle('active', !signin);
    tabSignin.setAttribute('aria-selected', signin);
    tabSignup.setAttribute('aria-selected', !signin);
    panelSignin.classList.toggle('active', signin);
    panelSignup.classList.toggle('active', !signin);
  }
  tabSignin.addEventListener('click', ()=>activateTab('signin'));
  tabSignup.addEventListener('click', ()=>activateTab('signup'));

  // Autofill remembered email
  const rememberedEmail = readJSON('form_remembered_email', '');
  if(rememberedEmail){ document.getElementById('siEmail').value = rememberedEmail; }

  document.getElementById('fillDemo').addEventListener('click', ()=>{
    document.getElementById('siEmail').value = ADMIN_EMAIL;
    document.getElementById('siPassword').value = ADMIN_PASSWORD;
    toast('Admin credentials filled in — click Sign in.', 'success');
  });

  document.getElementById('signinForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = document.getElementById('siEmail').value.trim();
    const password = document.getElementById('siPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    const res = login(email, password, remember);
    if(res.ok){ enterApp(); }
    else { toast(res.error, 'error'); }
  });

  document.getElementById('forgotLink').addEventListener('click', (e)=>{
    e.preventDefault();
    toast('Password reset isn\'t wired up in this demo — try the admin login instead.', 'error');
  });

  // ---- multi-step signup ----
  let step = 1;
  const steps = document.querySelectorAll('.signup-step');
  const stepNext = document.getElementById('stepNext');
  const stepBack = document.getElementById('stepBack');
  const stepSubmit = document.getElementById('stepSubmit');
  const stepNum = document.getElementById('stepNum');
  const headings = { 1:'Create your account', 2:'Tell us about you', 3:'Your fitness questionnaire' };

  function renderStep(){
    steps.forEach(s => s.classList.toggle('hidden', Number(s.dataset.step) !== step));
    stepBack.style.visibility = step === 1 ? 'hidden' : 'visible';
    stepNext.classList.toggle('hidden', step === 3);
    stepSubmit.classList.toggle('hidden', step !== 3);
    stepNum.textContent = step;
    document.getElementById('signupHeading').textContent = headings[step];
  }
  stepNext.addEventListener('click', ()=>{
    const currentFields = document.querySelector(`.signup-step[data-step="${step}"]`).querySelectorAll('input[required], select[required]');
    for(const f of currentFields){ if(!f.checkValidity()){ f.reportValidity(); return; } }
    step = Math.min(3, step + 1);
    renderStep();
  });
  stepBack.addEventListener('click', ()=>{ step = Math.max(1, step - 1); renderStep(); });

  document.getElementById('signupForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const profile = {
      name: document.getElementById('suName').value.trim(),
      email: document.getElementById('suEmail').value.trim(),
      password: document.getElementById('suPassword').value,
      gender: document.getElementById('suGender').value,
      age: document.getElementById('suAge').value,
      heightCm: document.getElementById('suHeight').value,
      weightKg: document.getElementById('suWeight').value,
      fitnessLevel: document.getElementById('suLevel').value,
      goal: document.getElementById('suGoal').value,
      targetWeight: document.getElementById('suTargetWeight').value,
      equipment: document.getElementById('suEquip').value,
      frequency: document.getElementById('suFreq').value,
      medical: document.getElementById('suMedical').value.trim(),
    };
    const res = signup(profile);
    if(!res.ok){ toast(res.error, 'error'); activateTab('signup'); return; }
    const remember = document.getElementById('rememberMeSignup').checked;
    login(profile.email, profile.password, remember);
    toast(`Welcome, ${profile.name.split(' ')[0]}! Your account is ready.`, 'success');
    setTimeout(()=> enterApp(), 400);
  });
}
/* ==========================================================================
   FORM/ — single-page router
   All "pages" are data-view sections that live in one document at once.
   Navigation just shows/hides them and keeps the URL hash in sync, so
   every link in the sidenav is a real, working link.
   ========================================================================== */
const VIEW_ORDER = ['dashboard','exercises','builder','calculator','calendar','nutrition','community','pricing','settings','admin'];
let appBooted = false;

const VIEW_REFRESH = {
  dashboard: ()=> renderDashboard(currentUser()),
  exercises: ()=> render(),
  builder: ()=> { renderPool(); renderRoutine(); renderSaved(); },
  calculator: ()=> { calculate(); renderChartAndTable(); },
  calendar: ()=> { renderTray(); renderCalendar(); },
  nutrition: ()=> { renderStats(); renderLog(); renderDatabase(); renderRecipes(); renderShopping(); },
  community: ()=> { renderTopics(); renderThreads(); renderLeaderboard(); renderFeedback(); renderTrainerPosts(); renderQa(); },
  settings: ()=> {
    const u = currentUser();
    paintAvatar(u);
    document.getElementById('pName').value = u.name;
    document.getElementById('pEmail').value = u.email;
    document.getElementById('pGender').value = u.gender;
    document.getElementById('pAge').value = u.age || '';
    document.getElementById('pHeight').value = u.heightCm || '';
    document.getElementById('pEquip').value = u.equipment || 'none';
    document.getElementById('pMedical').value = u.medical || '';
    document.getElementById('staySignedIn').checked = !!localStorage.getItem('form_session');
  },
  admin: ()=> {
    document.getElementById('deniedPanel').classList.toggle('hidden', isAdmin());
    document.getElementById('adminBody').classList.toggle('hidden', !isAdmin());
    if(isAdmin()){ renderUsers(); renderExTable(); renderFoods(); renderModeration(); }
  },
  pricing: ()=> paintPlan(readJSON('form_plan_'+currentUser().id, 'free')),
};

function showView(name){
  if(!VIEW_ORDER.includes(name)) name = 'dashboard';
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('hidden', v.dataset.view !== name));
  document.querySelectorAll('#sidenav-mount .nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  const titleEl = document.getElementById('topbarTitleText');
  if(titleEl) titleEl.textContent = PAGE_TITLES[name] || '';
  if(location.hash.slice(1) !== name) history.replaceState(null, '', '#'+name);
  document.getElementById('main-content').scrollTop = 0;
  window.scrollTo(0,0);
  if(currentUser() && appBooted){
    const refresh = VIEW_REFRESH[name];
    if(refresh){ try{ refresh(); }catch(err){ console.error('view refresh failed for', name, err); } }
  }
}

/* -------- transition between the auth screen and the logged-in app -------- */
function enterApp(){
  document.getElementById('authView').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  bootApp();
  initShell(); // rebuild sidenav/topbar for whoever just logged in (safe to call repeatedly)
  showView((location.hash || '#dashboard').slice(1));
}
function exitToAuth(){
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('authView').classList.remove('hidden');
  history.replaceState(null, '', location.pathname + location.search);
}

/* bootApp() re-fires DOMContentLoaded exactly once so every page script's
   (currentUser()-gated) setup code runs the moment someone actually logs in,
   without needing a real page reload. Guarded so listeners are only ever
   attached a single time, no matter how many times a person logs in/out. */
function bootApp(){
  if(appBooted) return;
  appBooted = true;
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

window.addEventListener('hashchange', ()=>{
  if(currentUser()) showView((location.hash || '#dashboard').slice(1));
});

document.addEventListener('DOMContentLoaded', function boot(){
  showStorageFallbackNoticeIfNeeded();
  initAuthScreen();
  if(currentUser()){
    appBooted = true; // real DOMContentLoaded already ran every gated init() above
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
  } else {
    document.getElementById('authView').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
  }
  showView((location.hash || '#dashboard').slice(1));
});
