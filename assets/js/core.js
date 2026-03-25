const KEY='samaos_v3';
const DAYS_AR=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MONTHS_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const AR_NUMS=['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const BUDGET_CATEGORIES=['أكل','مواصلات','دراسة','ترفيه','صحة','فواتير','أخرى'];
const TASK_PRIORITY_META={
  urgent:{label:'عاجل',color:'var(--red)',chip:'chip-red',xp:30},
  important:{label:'مهم',color:'var(--amber)',chip:'chip-amber',xp:20},
  normal:{label:'عادي',color:'var(--text2)',chip:'',xp:10},
};
const TASK_REPEAT_META={
  none:{label:'لا'},
  daily:{label:'يومي'},
  weekly:{label:'أسبوعي'},
};
const JOURNAL_MOOD_OPTIONS=[
  {value:1,emoji:'😔',label:'صعب'},
  {value:2,emoji:'😕',label:'مرهق'},
  {value:3,emoji:'😐',label:'هادئ'},
  {value:4,emoji:'🙂',label:'عادي'},
  {value:5,emoji:'😊',label:'كويس'},
  {value:6,emoji:'🤩',label:'ممتاز'},
];
const WEEKLY_CHALLENGE_DEFS=[
  {
    id:'habit_days_3',
    text:'أتمي ٥ عادات كل يوم لمدة ٣ أيام',
    reward:100,
    target:3,
    type:'days',
    progress(){
      const start=challengeWeekStartKey(todayKey());
      let count=0;
      for(let i=0;i<7;i++){
        const date=shiftDateKey(start,i);
        const doneCount=S.habits.filter(habit=>habit.done.includes(date)).length;
        if(doneCount>=5)count+=1;
      }
      return count;
    },
  },
  {
    id:'save_200',
    text:'وفري ٢٠٠ روبل هذا الأسبوع',
    reward:100,
    target:200,
    type:'amount',
    progress(){
      const start=challengeWeekStartKey(todayKey());
      const end=shiftDateKey(start,6);
      return S.expenses.filter(expense=>expense.cat==='ادخار'&&expense.date>=start&&expense.date<=end).reduce((sum,expense)=>sum+expense.amt,0);
    },
  },
  {
    id:'journal_3',
    text:'اكتبي في اليومية ٣ أيام متتالية',
    reward:100,
    target:3,
    type:'days',
    progress(){
      const start=challengeWeekStartKey(todayKey());
      const journalDays=[...new Set((S.journal||[]).map(entry=>entry.date).filter(date=>date>=start))].sort();
      let best=0;
      let current=0;
      let prev=null;
      journalDays.forEach(date=>{
        if(prev&&shiftDateKey(prev,1)===date)current+=1;
        else current=1;
        best=Math.max(best,current);
        prev=date;
      });
      return best;
    },
  },
];

function digitsAr(v){return String(v).replace(/[0-9]/g,d=>AR_NUMS[d]);}
function toAr(n){return digitsAr(Math.round(n));}
function toArFull(n){return Number(n||0).toLocaleString('ar-EG');}
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function dateKeyFromDate(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function parseDateKey(dateStr){
  const [y,m,d]=String(dateStr).split('-').map(Number);
  if(!y||!m||!d)return new Date();
  return new Date(y,m-1,d);
}
function shiftDateKey(dateStr,offset){
  const date=parseDateKey(dateStr);
  date.setDate(date.getDate()+offset);
  return dateKeyFromDate(date);
}
function slugify(value){
  return String(value??'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^\w\u0600-\u06FF-]+/g,'');
}
function budgetId(category){return `budget_${slugify(category)}`;}
function computeLevel(xp){return clamp(Math.floor(Math.max(0,Number(xp)||0)/200)+1,1,20);}
function xpIntoLevel(xp){
  const safeXp=Math.max(0,Number(xp)||0);
  const level=computeLevel(safeXp);
  if(level>=20)return {level,progress:100,current:safeXp,target:safeXp};
  const currentFloor=(level-1)*200;
  const nextFloor=level*200;
  const current=safeXp-currentFloor;
  const target=nextFloor-currentFloor;
  return {level,progress:Math.round(current/target*100),current,target};
}
function uniqueDates(values){return [...new Set((values||[]).filter(Boolean))].sort();}
function todayKey(){return dateKeyFromDate(new Date());}
function todayStr(){
  const d=new Date();
  if(lang()==='en'){
    return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
  }
  return DAYS_AR[d.getDay()]+'، '+digitsAr(d.getDate())+' '+MONTHS_AR[d.getMonth()]+' '+digitsAr(d.getFullYear());
}
function timeStr(){
  const d=new Date();
  return new Intl.DateTimeFormat(lang()==='en'?'en-GB':'ar-EG',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
}
function formatShortDate(dateStr){
  const [y,m,d]=String(dateStr).split('-').map(Number);
  return digitsAr(`${d}/${m}`);
}
function formatMonthYear(date){
  return new Intl.DateTimeFormat(lang()==='en'?'en-GB':'ar-EG',{month:'long',year:'numeric'}).format(date);
}
function weekStartKey(dateStr=todayKey()){
  const date=parseDateKey(dateStr);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()-date.getDay());
  return dateKeyFromDate(date);
}
function challengeWeekStartKey(dateStr=todayKey()){
  const date=parseDateKey(dateStr);
  date.setHours(0,0,0,0);
  const diff=(date.getDay()+1)%7;
  date.setDate(date.getDate()-diff);
  return dateKeyFromDate(date);
}

const ENERGY_DESC=['','طاقة منخفضة جداً — خطوة واحدة','تعبانة — اهتمي بنفسك أولاً','طاقة ضعيفة — الحد الأدنى كافي','تحت المتوسط — خطوات صغيرة','طاقة متوسطة — يمكن التقدم','كويس — فرصة جيدة','طاقة جيدة — تقدمي بثقة','طاقة عالية — يوم منتج','ممتاز — أقصى استفادة','طاقة كاملة — يوم استثنائي ✦'];
const MVD_LISTS={
  normal:['مذاكرة ٢٠ دقيقة','صفحة قرآن','تسجيل المصاريف','١٥ دقيقة إنجليزي'],
  lecture:['حضور المحاضرة بتركيز','مراجعة نوتة اليوم','صفحة قرآن','تسجيل المصاريف'],
  restaurant:['الوصول للمطعم في الوقت','مذاكرة ١٥ دقيقة قبل الشغل','صفحة قرآن','تسجيل المصاريف'],
  nightshift:['الاستعداد للشغل الليلي','نوم فور الانتهاء','صفحة قرآن','تسجيل المصاريف'],
  ramadan:['ورد القرآن اليومي','مذاكرة بعد الفجر','تسجيل المصاريف','دعاء بالهدف'],
  offday:['راحة بدون تأنيب','ترتيب ركن صغير','صفحة قرآن','مصروف اليوم أو مراجعة مالية'],
  weekend:['مهمة مؤجلة مهمة','جلسة تطوير ٣٠ دقيقة','تحضير للأسبوع','خروجة أو راحة محسوبة'],
};
const MVD_LABELS={normal:'يوم عادي',lecture:'يوم محاضرة',restaurant:'يوم مطعم',nightshift:'شغل ليلي',ramadan:'رمضان',offday:'يوم عطلة',weekend:'weekend'};
const MOOD_OPTIONS=[
  {value:1,emoji:'😞',label:'صعب'},
  {value:2,emoji:'😕',label:'مرهق'},
  {value:3,emoji:'🙂',label:'عادي'},
  {value:4,emoji:'😊',label:'كويس'},
  {value:5,emoji:'🤩',label:'ممتاز'},
];
const LANG_STRINGS={
  ar:{
    sync:{syncing:'syncing...',synced:'✓ synced',offline:'cache only'},
    nav:{home:'لوحة القيادة',tasks:'المهام اليومية',habits:'العادات اليومية',money:'المصاريف والتحويش',problems:'إدارة المشاكل',journal:'اليومية',mood:'تتبع المزاج',analytics:'التحليلات',goals:'أهداف ٣ شهور',weekly:'المراجعة الأسبوعية',pomodoro:'مؤقت بومودورو',achievements:'الإنجازات',tips:'مكتبة النصائح',settings:'الإعدادات'},
    mobileNav:{home:'الرئيسية',tasks:'المهام',habits:'العادات',money:'المال',problems:'المشاكل',journal:'اليومية',mood:'المزاج',analytics:'تحليلات',goals:'الأهداف',weekly:'الأسبوعي',pomodoro:'بومودورو',achievements:'إنجازات',tips:'النصائح',settings:'الإعدادات'},
    buttons:{start:'ابدأ',pause:'إيقاف',saveMood:'حفظ المزاج',saveWeekly:'💾 احفظي المراجعة',saveJournal:'احفظي اليومية',addHabit:'+ أضف عادة جديدة',addGoal:'+ هدف جديد',addProblem:'+ مشكلة جديدة',addTask:'إضافة مهمة',logExpense:'سجّل'},
  },
  en:{
    sync:{syncing:'syncing...',synced:'✓ synced',offline:'cache only'},
    nav:{home:'Dashboard',tasks:'Daily Tasks',habits:'Habits',money:'Money',problems:'Problems',journal:'Journal',mood:'Mood',analytics:'Analytics',goals:'Goals',weekly:'Weekly Review',pomodoro:'Pomodoro',achievements:'Achievements',tips:'Tips Library',settings:'Settings'},
    mobileNav:{home:'Home',tasks:'Tasks',habits:'Habits',money:'Money',problems:'Problems',journal:'Journal',mood:'Mood',analytics:'Charts',goals:'Goals',weekly:'Weekly',pomodoro:'Focus',achievements:'Badges',tips:'Tips',settings:'Settings'},
    buttons:{start:'Start',pause:'Pause',saveMood:'Save Mood',saveWeekly:'Save Review',saveJournal:'Save Journal',addHabit:'+ Add Habit',addGoal:'+ New Goal',addProblem:'+ New Problem',addTask:'Add Task',logExpense:'Save'},
  },
};
const ACHIEVEMENT_DEFS=[
  {id:'first_habit',icon:'✓',title:'أول عادة',desc:'أكملي أول عادة'},
  {id:'streak_7',icon:'🔥',title:'سلسلة ٧ أيام',desc:'وصلي لأي عادة ٧ أيام متتالية'},
  {id:'streak_30',icon:'💎',title:'سلسلة ٣٠ يوم',desc:'وصلي لأي عادة ٣٠ يوم متتالي'},
  {id:'first_saving',icon:'💰',title:'أول ادخار',desc:'أضيفي أول عملية ادخار'},
  {id:'saved_1000',icon:'🏦',title:'١٠٠٠ روبل محفوظ',desc:'اجمعي ١٠٠٠ روبل ادخار'},
  {id:'first_problem_done',icon:'⚡',title:'أول مشكلة محلولة',desc:'حوّلي مشكلة إلى محلولة'},
  {id:'weekly_review',icon:'✍️',title:'مراجعة أسبوعية',desc:'احفظي أول مراجعة أسبوعية'},
  {id:'tasks_10',icon:'✅',title:'١٠ مهام منجزة',desc:'أنجزي ١٠ مهام يومية'},
  {id:'level_5',icon:'🌟',title:'مستوى ٥',desc:'وصلي للمستوى الخامس'},
  {id:'level_10',icon:'👑',title:'مستوى ١٠',desc:'وصلي للمستوى العاشر'},
  {id:'thirty_day_active',icon:'🔱',title:'٣٠ يوم متواصل',desc:'سجلي نشاطًا لمدة ٣٠ يومًا'},
  {id:'productivity_master',icon:'🎓',title:'محترف الإنتاجية',desc:'افتحي ٨ إنجازات أو أكثر'},
];

const TIPS_DATA=[
  {id:1,cat:'energy',icon:'😴',iconbg:'var(--blue-dim)',title:'إصلاح النوم المتلغبط',summary:'محاضرات الساعة ٢ صبحاً بتدمر الإيقاع البيولوجي — في الحل العلمي.',detail:'الجسم بيعمل على circadian rhythm — ساعة داخلية بتنظم الهرمونات والطاقة. لما النوم بيتغير كل يوم، الجسم بيتلخبط ومستوى الكورتيزول والميلاتونين بيتغير. الخبر الكويس: الجسم بيتعود على إيقاع جديد في أسبوعين فقط.',steps:['حددي anchor time — وقت صحيان ثابت حتى لو نمتِ متأخرة','قبل النوم بساعة: أضواء خافتة، موبايل بوضع الليل، درجة حرارة باردة','يوم المحاضرة المسائية: قيلولة ٢٠ دقيقة بعد الظهر تعوض','تجنبي الكافيين بعد الساعة ٦ مساءً'],tags:['علمي','مجرب']},
  {id:2,cat:'focus',icon:'🧠',iconbg:'var(--gold-dim)',title:'مذاكرة طب الأسنان بكفاءة',summary:'مش الوقت اللي بتذاكريه — هو جودة كل دقيقة. Active Recall أقوى ٣ مرات.',detail:'الدراسات أثبتت إن Passive reading بتسبب وهم الفهم. لكن Active Recall + Spaced Repetition بيخليكِ تفتكري أكتر من ٩٠٪ بعد شهر. طب الأسنان بالذات محتاج فهم تطبيقي مش حفظ فقط.',steps:['اقرئي الموضوع مرة واحدة، بعدين أغلقي الكتاب واكتبي كل اللي تفتكريه','استخدمي Anki لمادة طب الأسنان — ١٥ دقيقة يومياً كافية','كل ٣ أيام راجعي بالسؤال والجواب مش القراءة','ريحتي بعد ٢٥ دقيقة تركيز — مش ساعات متواصلة (Pomodoro)'],tags:['علمي','مذاكرة']},
  {id:3,cat:'money',icon:'💰',iconbg:'var(--green-dim)',title:'نظام التحويش التلقائي',summary:'مش قوة إرادة — بل تصميم ذكي. Pay Yourself First أثبتت أنها الأنجح.',detail:'لما الفلوس بتيجي، الدماغ بيعتبرها للإنفاق. الحل: حولي ١٠٪ قبل ما تفكري في أي مصروف تاني. مش ما بيفضل — لأ. ٣ شهور من دي وهتتفاجئي بالمبلغ المتراكم.',steps:['حولي ١٠٪ فورًا عند استلام أي مبلغ — قبل ما تشوفيه','سجلي كل مصروف في نفس اليوم — ده بيخلق وعي مالي','حددي ٣ فئات: ضروري / مفيد / ترفيه','كل شهر: اتفرجي على الإنفاق وحددي فئة تقليلها'],tags:['مالي','مجرب']},
  {id:4,cat:'focus',icon:'📵',iconbg:'var(--red-dim)',title:'التحرر من إدمان الموبايل',summary:'الموبايل مش إدمان إرادة — هو هندسة دماغية. ٣ تغييرات بيئية بتكسر الحلقة.',detail:'كل notification بيطلق dopamine صغير والدماغ بيتعلم يطلبها. السر مش المنع — هو تغيير البيئة اللي بتحفز السلوك. الدراسات أثبتت إن مجرد وجود التليفون على المكتب بيقلل التركيز ٢٠٪ حتى لو مش بتستخدميه.',steps:['شيلي كل app سوشيال من الشاشة الرئيسية — الوصول الصعب = استخدام أقل','الموبايل خارج الأوضة وقت النوم والمذاكرة — مش صامت، بره تماماً','حددي وقتين فقط للسوشيال: الظهر والليل','اعملي قائمة بدائل: قرآن، كتاب، مشي، موسيقى'],tags:['سلوكي','مجرب']},
  {id:5,cat:'develop',icon:'🇬🇧',iconbg:'var(--blue-dim)',title:'تطوير الإنجليزي بدون ملل',summary:'الطريقة الأفعل مش الكورسات — هي Comprehensible Input بموضوعات بتحبيها.',detail:'Stephen Krashen اكتشف إن الدماغ بيكتسب اللغة مش بيتعلمها — لما تسمعي وتقري محتوى مفهوم ٩٠٪ وجديد ١٠٪، اللغة بتدخل تلقائي. طب الأسنان فيه محتوى إنجليزي ممتاز بيجمع التعلم والتطوير المهني.',steps:['بودكاست إنجليزي بموضوع بتحبيه ١٥ دقيقة يومياً (TED-Ed, BBC, Dental podcasts)','سيريز بالإنجليزي مع subtitles إنجليزي — مش عربي','٥ كلمات جديدة في السياق مش من القاموس','ريلز واليوتيوب بالإنجليزي بدل العربي ٣٠ دقيقة'],tags:['تطوير','لغات']},
  {id:6,cat:'develop',icon:'🦷',iconbg:'var(--green-dim)',title:'خبرة عملية في طب الأسنان',summary:'الخبرة العملية بتفرق في التوظيف والمهارة — إزاي تبدأي وأنتِ طالبة.',detail:'عيادات كتير بتقبل طلاب طب أسنان كـ observers. ده بيفرق في السيرة الذاتية وبيثبت المعلومات الأكاديمية بشكل عملي. في روسيا في عيادات مصرية ودولية ممكن تتواصلي معاها.',steps:['ابدأي بعيادات قريبة من سكنك — تواصلي مباشرة','قدمي نفسك كـ طالبة بتدور خبرة مش مرتب — فرصة أكبر للقبول','احتفظي بـ log يومي للحالات اللي شايفاها — بيفيد في الامتحانات','اسأل عن الأساسيات: isolation, mixing materials, X-ray reading'],tags:['مهني','طب أسنان']},
  {id:7,cat:'social',icon:'⏰',iconbg:'var(--amber-dim)',title:'توازن الوقت مع الصحاب',summary:'الصحاب ضروريون للصحة النفسية — لكن بحدود واضحة ومحبة.',detail:'في الغربة، الصحاب بيملوا فراغ العيلة وده طبيعي ومهم. لكن لما يكونوا مصدر وقت ضايع، لازم حدود بمحبة. مش أنانية — هو تنظيم ذكي.',steps:['حددي مواعيد ثابتة للاجتماع — مش open door طول اليوم','تعلمي تقولي سأروح بعد ساعتين بدل ما تفضلي لحد ١٢','اعملي نشاط مشترك مفيد: ذاكروا سوا، اتمشوا','الصاحبة اللي نايمة مش مشكلتك — أوضتك مش سجن'],tags:['اجتماعي','حدود']},
  {id:8,cat:'spirit',icon:'📖',iconbg:'var(--green-dim)',title:'ختم القرآن بخطة ثابتة',summary:'صفحتين يومياً = ختم في سنة. الاستمرارية أهم من الكمية.',detail:'الكثير بيبدؤوا بحماس وبيوقفوا. السر هو Minimum commitment — أقل التزام ممكن تلتزم بيه كل يوم بغض النظر عن الظروف.',steps:['حددي minimum: صفحة واحدة فقط — لو عملتِ أكتر ممتاز','اربطيها بوقت ثابت: بعد الفجر أو قبل النوم','استخدمي تطبيق بيتتبع مكانك في القرآن (Quran.com)','لو فاتك يوم: ما تعوضيش — كمّلي من بكرة بدون ذنب'],tags:['ديني','روتين']},
  {id:9,cat:'expat',icon:'🌍',iconbg:'var(--blue-dim)',title:'الغربة والصحة النفسية',summary:'Homesickness مش ضعف — هي استجابة نفسية طبيعية لفقد شبكة الأمان.',detail:'الاغتراب بيزيد الضغط النفسي لأن شبكة الأمان الاجتماعية بتقل. الجسم بيعتبرها تهديد حقيقي. مش لازم تحاربي الإحساس ده — لازم تديريه بذكاء.',steps:['كلمي أهلك على schedule ثابت — مش بس لما تضغطي','اعملي mini Egypt في أوضتك: أكل مصري، موسيقى مصرية','ركزي على أهداف قصيرة المدى — مش لما أخلص الدراسة كلها','لو الضغط شديد: ابحثي عن student counseling في جامعتك'],tags:['نفسي','غربة']},
  {id:10,cat:'energy',icon:'⚡',iconbg:'var(--amber-dim)',title:'إدارة الطاقة مع جدول متلغبط',summary:'مش إدارة وقت — إدارة طاقة. نفس الساعة بجسم مرهق = نص الإنتاجية.',detail:'عندك ٣ أنواع طاقة: جسدية، ذهنية، عاطفية. كل نوع بيحتاج استراحة مختلفة. شغل الليل + محاضرات + مطعم = جسم مرهق يحتاج ترتيب ذكي.',steps:['افعلي المهام الصعبة في أعلى وقت طاقة عندك','١٠ دقيقة مشي = أحسن من كوباية قهوة للتركيز','بعد الشغل الليلي: نومي مباشرة، مش سوشيال أولاً','الأكل بيأثر على الطاقة — وجبة تقيلة = نعاس فوري'],tags:['طاقة','جسم']},
  {id:11,cat:'money',icon:'🎯',iconbg:'var(--green-dim)',title:'التخطيط المالي للمغترب',summary:'ميزانية الغربة تاخد في حسبانها: طوارئ + أجازة + احتياجات دراسية.',detail:'كتير من الطلاب المغتربين بيعيشوا paycheck-to-paycheck مش لأنهم بيصرفوا كتير، لأنهم مش بيخططوا للمصاريف غير المنتظمة.',steps:['عملي ٣ buckets: ضروري يومي / طوارئ / أحلام (أجازة، هدايا)','مصاريف الطوارئ = شهر واحد من المصاريف الأساسية على الأقل','هدايا أهلك: ادخري شوية كل شهر مش في آخر لحظة','تتبعي شهرين — هتعرفي وين بيروح معظم الفلوس'],tags:['مالي','تخطيط']},
  {id:12,cat:'develop',icon:'🌱',iconbg:'var(--green-dim)',title:'التطوير الذاتي بدون كسل',summary:'المشكلة مش الكسل — هي الأهداف الكبيرة اللي بتخلف إحساس بالفشل.',detail:'James Clear في Atomic Habits بيقول: الهوية قبل الأهداف. مش عايزة أذاكر — لكن أنا شخص بيذاكر كل يوم. التعديل الصغير ده في التفكير بيغير كل حاجة.',steps:['ابدأي بـ ٢ دقيقة فقط — أصغر نسخة من العادة','اربطي العادة الجديدة بعادة موجودة (habit stacking)','احتفلي بالاستمرارية مش الكمال — ٧ أيام أحسن من يوم مثالي','بدل ليه مش بعمل زي فلان — اسأل أتحسن ١٪ النهارده'],tags:['سلوكي','عادات']},
];

const SUPABASE_URL='https://gneqvzfggpurvnfblewo.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZXF2emZnZ3B1cnZuZmJsZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTkwNTksImV4cCI6MjA4OTE5NTA1OX0.YiazO-4j0llYMzEgrJhNw4vKl0L0kN0-ohNOzTqkeao';
const SAMA_STATE_ID='sama_user_1';
const DEFAULT_SYNC_DELAY_MS=0;
const ENERGY_SYNC_DELAY_MS=250;

function createDefaultState(){
  return {
    energy:5,
    dayType:'normal',
    habits:[
      {id:'sleep',name:'نوم ٧ ساعات',done:[]},
      {id:'study',name:'مذاكرة ٢٠ دقيقة',done:[]},
      {id:'quran',name:'صفحة قرآن',done:[]},
      {id:'english',name:'إنجليزي ١٥ دقيقة',done:[]},
      {id:'money_log',name:'تسجيل المصاريف',done:[]},
      {id:'nophone',name:'ساعة بدون موبايل',done:[]},
      {id:'clinic',name:'متابعة عيادة / خبرة',done:[]},
    ],
    expenses:[],
    savingsGoal:5000,
    problems:[
      {id:1,title:'الموبايل كتير',solution:'ساعة بدون موبايل فور الاستيقاظ',duration:'٧ أيام',status:'exp',note:''},
      {id:2,title:'مش بحوش فلوس',solution:'١٠٪ فورًا عند استلام الفلوس',duration:'٣٠ يوم',status:'todo',note:''},
      {id:3,title:'النوم غير منتظم',solution:'وقت صحيان ثابت كل يوم',duration:'١٤ يوم',status:'todo',note:''},
    ],
    goals:[
      {id:1,icon:'🇬🇧',title:'إنجليزي أحسن',detail:'مستوى B2',pct:15,deadline:'٣ شهور'},
      {id:2,icon:'🦷',title:'خبرة عيادة أسنان',detail:'يومين في الأسبوع',pct:5,deadline:'٣ شهور'},
      {id:3,icon:'💰',title:'توفير للأجازة',detail:'مبلغ للرجوع لأهلي',pct:10,deadline:'٣ شهور'},
      {id:4,icon:'📖',title:'ختم القرآن',detail:'صفحة أو أكتر يومياً',pct:50,deadline:'شهرين'},
    ],
    tasks:[],
    journal:[],
    budgets:{},
    xp:0,
    level:1,
    weeklyChallenge:null,
    weeklyChallengeDone:false,
    weeklyChallengeProgress:0,
    energyHistory:[],
    mvdDone:{},
    weekly:{w1:'',w2:'',w3:'',w4:''},
    weeklyHistory:[],
    moodLog:[],
    settings:{fontScale:1,language:'ar'},
    pomodoro:{mode:'focus',remainingSec:1500,running:false,lastTickAt:null,sessionsToday:{},totalSessions:0},
  };
}

let S=createDefaultState();
let supabaseClient=null;
let syncTimer=null;
let syncChain=Promise.resolve();
let numericIdCounter=0;
let selectedMood=null;
let selectedJournalMood=null;
let pomodoroInterval=null;
let editingSavingsGoal=false;

try{
  if(window.supabase&&typeof window.supabase.createClient==='function'){
    supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  }
}catch(err){
  console.warn('Supabase client init failed',err);
}

function lang(){return S&&S.settings&&LANG_STRINGS[S.settings.language]?S.settings.language:'ar';}
function langText(path,fallback=''){
  const parts=path.split('.');
  let current=LANG_STRINGS[lang()];
  for(const part of parts){current=current&&current[part];}
  return current??fallback;
}
function generateNumericId(){numericIdCounter=(numericIdCounter+1)%1000;return Date.now()*1000+numericIdCounter;}
function normalizeDateKey(value,fallback=todayKey()){const str=String(value||'');return /^\d{4}-\d{2}-\d{2}$/.test(str)?str:fallback;}
