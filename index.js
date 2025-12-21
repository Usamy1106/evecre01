
// --- 定数定義 ---
const SEED_TYPES = [
  { id: 'jack', path: './images/plants/seed-jack.svg', name: 'ジャック', plantPrefix: './images/plants/plant-jack-' },
  { id: 'baribari', path: './images/plants/seed-baribari.svg', name: 'バリバリ', plantPrefix: './images/plants/plant-baribari-' },
  { id: 'lucky', path: './images/plants/seed-lucky.svg', name: 'ラッキー', plantPrefix: './images/plants/plant-lucky-' }
];

const PROPOSAL_HELP = {
  p1: { title: "開催場所を決める", body: "イベントをどこで行うか決めましょう。オンラインの場合はツール名を、対面の場合は施設名を入力します。", format: 'text' },
  p2: { title: "広報リンクを挿入", body: "SNSやWebサイトなど、参加者が詳細を確認できるURLを準備しましょう。", format: 'link' },
  p3: { title: "メインビジュアルを作成", body: "イベントの顔となる画像を作成します。テーマカラーやロゴを含めると効果的です。", format: 'image' }
};

const LABEL_CONFIG = {
  '企画': { color: '#0CA1E3', bg: 'bg-[#0CA1E3]/10', border: 'border-[#0CA1E3]', text: 'text-[#0CA1E3]' },
  '運営': { color: '#EE3E12', bg: 'bg-[#EE3E12]/10', border: 'border-[#EE3E12]', text: 'text-[#EE3E12]' },
  '制作': { color: '#FFC300', bg: 'bg-[#FFC300]/10', border: 'border-[#FFC300]', text: 'text-[#FFC300]' },
  '広報': { color: '#9EDF05', bg: 'bg-[#9EDF05]/10', border: 'border-[#9EDF05]', text: 'text-[#9EDF05]' }
};

// --- 状態管理 ---
const state = {
  projects: [],
  currentView: 'HOME',
  selectedProjectId: null,
  mainBoardTab: 'MAIN', // 'MAIN' | 'RANKING' | 'ARCHIVE'
  editingMissionId: null,
  draftProject: { name: '', description: '', dates: [], seedType: 'jack' },
  draftMission: {
    title: '', labels: ['企画'], priority: 0, dates: [], clearFormat: 'text', note: ''
  },
  missionModalTab: 'BASIC',
  calendarDate: new Date(),

  init() {
    const saved = localStorage.getItem('event_planner_projects');
    if (saved) {
      try { this.projects = JSON.parse(saved); } catch (e) { this.projects = []; }
    }
    this.render();
  },

  save() {
    localStorage.setItem('event_planner_projects', JSON.stringify(this.projects));
  },

  setView(view, projectId = null) {
    if (view === 'CREATE_PROJECT_INFO' && this.currentView === 'HOME') {
      this.draftProject = { name: '', description: '', dates: [], seedType: 'jack' };
    }
    this.currentView = view;
    this.selectedProjectId = projectId;
    this.mainBoardTab = 'MAIN';
    this.render();
    window.scrollTo(0, 0);
  },

  addProject() {
    if (!this.draftProject.name || !this.draftProject.description || this.draftProject.dates.length === 0) return;
    
    const defaultMissions = [
      { id: 'def-1', title: 'イベントの目的を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet' },
      { id: 'def-2', title: 'イベントのタイトルを決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet' },
      { id: 'def-3', title: 'イベントの概要を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet' }
    ];

    const newProject = {
      id: Date.now().toString(),
      name: this.draftProject.name,
      description: this.draftProject.description,
      seedType: this.draftProject.seedType,
      dates: [...this.draftProject.dates],
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      createdAt: Date.now(),
      isCompleted: false,
      progress: 0, 
      daysLeft: this.calculateDaysLeft(this.draftProject.dates[0]),
      missions: defaultMissions,
      clearedData: {}, 
      proposals: [
        { id: 'p1', title: '開催場所を決める', tag: '企画', type: 'plan' },
        { id: 'p2', title: '広報リンクを挿入', tag: '広報', type: 'public' },
        { id: 'p3', title: 'メインビジュアルを作成', tag: '制作', type: 'create' }
      ]
    };
    this.projects.push(newProject);
    this.save();
    this.setView('MAIN_BOARD', newProject.id);
  },

  calculateDaysLeft(dateStr) {
    if (!dateStr) return 99;
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    switch (this.currentView) {
      case 'HOME': renderHome(appEl); break;
      case 'CREATE_PROJECT_INFO': renderCreateProjectInfo(appEl); break;
      case 'CREATE_PROJECT_SEED': renderCreateProjectSeed(appEl); break;
      case 'CREATE_PROJECT_INVITE': renderCreateProjectInvite(appEl); break;
      case 'MAIN_BOARD': renderMainBoard(appEl); break;
    }
  }
};

window.state = state;

// --- アーカイブ直接編集 ---
window.editArchiveItem = (type) => {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  let missionId = '';
  let currentVal = '';
  let format = 'text';

  if (type === 'title') { missionId = 'def-2'; currentVal = p.clearedData['def-2']?.content || p.name; }
  else if (type === 'summary') { missionId = 'def-3'; currentVal = p.clearedData['def-3']?.content || p.description; }
  else if (type === 'url') { 
    const m = p.missions.find(x => x.title === '広報リンクを挿入');
    missionId = m?.id || 'url-temp';
    currentVal = p.clearedData[missionId]?.content || '';
    format = 'link';
  } else if (type === 'venue') {
    const m = p.missions.find(x => x.title === '開催場所を決める');
    missionId = m?.id || 'venue-temp';
    currentVal = p.clearedData[missionId]?.content || '';
  } else if (type === 'image') {
    const m = p.missions.find(x => x.title === 'メインビジュアルを作成');
    missionId = m?.id || 'image-temp';
    window.openClearMissionModal(missionId, 'image');
    return;
  }

  // 編集用の簡易プロンプト
  const newVal = prompt(`${type === 'url' ? 'URL' : '内容'}を入力してください`, currentVal);
  if (newVal === null) return;

  // ミッションが存在しない場合は作成（提案から追加される前の場合など）
  if (!p.missions.find(m => m.id === missionId)) {
    p.missions.push({
      id: missionId,
      title: type === 'url' ? '広報リンクを挿入' : type === 'venue' ? '開催場所を決める' : type,
      tag: type === 'url' ? '広報' : '企画',
      clearFormat: format,
      status: 'cleared',
      dates: [],
      daysLeft: 7
    });
  } else {
    const m = p.missions.find(x => x.id === missionId);
    m.status = 'cleared';
  }

  p.clearedData[missionId] = { content: newVal, timestamp: Date.now(), title: type, format: format };
  state.save();
  state.render();
};

// --- グローバル関数 ---

window.updateDraftInfo = (field, value) => {
  state.draftProject[field] = value;
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.disabled = !(state.draftProject.name && state.draftProject.description && state.draftProject.dates.length > 0);
  }
};

window.removeDraftDateGroup = (jsonGroup) => {
  const group = JSON.parse(jsonGroup);
  state.draftProject.dates = state.draftProject.dates.filter(d => !group.includes(d));
  state.render();
};

window.handleImageSelect = (input) => {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    if (preview && placeholder) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
      preview.dataset.base64 = e.target.result;
    }
  };
  reader.readAsDataURL(file);
};

window.submitMissionClear = (missionId) => {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  let m = project.missions.find(x => x.id === missionId);
  
  // アーカイブから開いた際にミッションが未作成だった場合の補完
  if (!m) {
     m = { id: missionId, title: 'メインビジュアルを作成', tag: '制作', clearFormat: 'image', status: 'yet', dates: [], daysLeft: 7 };
     project.missions.push(m);
  }

  let content = '';
  if (m.clearFormat === 'image') {
    const preview = document.getElementById('preview-img');
    content = preview ? preview.dataset.base64 : '';
  } else {
    const input = document.getElementById('clear-input');
    content = input ? input.value : '';
  }

  if (!content) return alert('入力を完了させてください');

  project.clearedData[missionId] = { content, timestamp: Date.now(), title: m.title, format: m.clearFormat };
  m.status = 'cleared';
  state.save();
  const modal = document.getElementById('clear-mission-modal');
  if (modal) modal.remove();
  state.render();
};

window.openClearMissionModal = (missionId, overrideFormat = null) => {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  let m = project.missions.find(x => x.id === missionId);
  
  const title = m ? m.title : 'メインビジュアルを作成';
  const format = overrideFormat || (m ? m.clearFormat : 'text');

  const overlay = document.createElement('div');
  overlay.id = 'clear-mission-modal';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 page-transition';
  
  let inputHtml = '';
  if (format === 'text') {
    inputHtml = `<textarea id="clear-input" class="w-full h-40 p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="内容を入力してください"></textarea>`;
  } else if (format === 'image') {
    inputHtml = `
      <div class="w-full aspect-video bg-[#EBE8E5] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#A7AAAC] cursor-pointer" onclick="document.getElementById('file-input').click()">
        <img id="preview-img" class="hidden w-full h-full object-cover rounded-2xl">
        <div id="upload-placeholder" class="text-center">
          <img src="./images/icon/icon-image.svg" class="w-12 h-12 mx-auto mb-2 opacity-40">
          <p class="text-rs text-[#A7AAAC] font-bold">画像をアップロード</p>
        </div>
        <input type="file" id="file-input" class="hidden" accept="image/*" onchange="window.handleImageSelect(this)">
      </div>
    `;
  } else {
    inputHtml = `<input type="url" id="clear-input" class="w-full p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="https://...">`;
  }

  overlay.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative animate-fadeIn">
      <button onclick="document.getElementById('clear-mission-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <h3 class="heading-m text-[#484545] mb-2 pr-6">${title}</h3>
      <p class="text-rs text-[#A7AAAC] mb-6 font-bold">提出物を入力してください</p>
      ${inputHtml}
      <button onclick="window.submitMissionClear('${missionId}')" class="btn-primary w-full py-4 mt-8 heading-r font-bold">クリアする</button>
    </div>
  `;
  document.body.appendChild(overlay);
};

// --- カレンダー ---
window.openCalendarModal = (target = 'project') => {
  state.calendarDate = new Date();
  const modal = document.createElement('div');
  modal.id = 'calendar-modal';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 page-transition';
  document.body.appendChild(modal);
  renderCalendarInner(target);
};

function renderCalendarInner(target) {
  const modal = document.getElementById('calendar-modal');
  if (!modal) return;
  const year = state.calendarDate.getFullYear(), month = state.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate();
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  const eventDates = project ? project.dates : (target === 'project' ? state.draftProject.dates : []);
  const missionDeadlines = project ? project.missions.flatMap(m => m.dates || []) : [];
  const currentTargetDates = target === 'project' ? state.draftProject.dates : (target === 'mission' ? state.draftMission.dates : []);

  let daysHtml = '';
  for (let i = 0; i < firstDay; i++) daysHtml += `<div class="h-10"></div>`;
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = currentTargetDates.includes(dateStr);
    const isEventDate = eventDates.includes(dateStr);
    const hasMission = missionDeadlines.includes(dateStr);
    daysHtml += `
      <div onclick="window.toggleDate('${dateStr}', '${target}')" class="relative h-10 w-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all text-rs font-bold 
        ${isSelected ? 'bg-[#0CA1E3] text-white shadow-md' : (isEventDate ? 'bg-[#CFD8FF] text-[#484545]' : 'bg-white text-[#484545]')}"
      >
        ${d}
        ${hasMission ? '<div class="absolute bottom-1 w-1 h-1 bg-[#EE3E12] rounded-full"></div>' : ''}
      </div>
    `;
  }
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn">
      <div class="flex items-center justify-between mb-6">
        <h3 class="heading-r text-[#484545] font-bold">${year}年 ${month+1}月</h3>
        <div class="flex gap-2">
          <button onclick="window.moveCalendarMonth(-1, '${target}')" class="p-2 bg-[#FDFBF8] rounded-full"><img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 brightness-0 opacity-50"></button>
          <button onclick="window.moveCalendarMonth(1, '${target}')" class="p-2 bg-[#FDFBF8] rounded-full"><img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 rotate-180 brightness-0 opacity-50"></button>
        </div>
      </div>
      <div class="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] text-[#A7AAAC] font-bold"><div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div></div>
      <div class="grid grid-cols-7 gap-1 mb-8">${daysHtml}</div>
      <button onclick="document.getElementById('calendar-modal').remove()" class="btn-primary w-full py-3 heading-rs font-bold">決定</button>
    </div>
  `;
}

window.moveCalendarMonth = (offset, target) => { state.calendarDate.setMonth(state.calendarDate.getMonth() + offset); renderCalendarInner(target); };
window.toggleDate = (dateStr, target) => {
  if (target === 'view') return; 
  const dates = target === 'project' ? state.draftProject.dates : state.draftMission.dates;
  const idx = dates.indexOf(dateStr);
  if (idx > -1) dates.splice(idx, 1); else dates.push(dateStr);
  dates.sort();
  renderCalendarInner(target);
  if (target === 'project') state.render(); else window.renderMissionModalContent();
};

// --- ヘルパー ---
function getConsecutiveGroups(dateStrings) {
  if (!dateStrings || dateStrings.length === 0) return [];
  const sorted = [...dateStrings].sort();
  const groups = [];
  let currentGroup = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i]);
    const diffInDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffInDays === 1) currentGroup.push(sorted[i]); else { groups.push(currentGroup); currentGroup = [sorted[i]]; }
  }
  groups.push(currentGroup);
  return groups;
}

// --- ミッション関連 ---

window.openMissionModal = (missionId = null) => {
  state.editingMissionId = missionId;
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (missionId && project) {
    const m = project.missions.find(x => x.id === missionId);
    state.draftMission = { ...m, dates: m.dates || [], labels: [m.tag] };
  } else {
    state.draftMission = { title: '', labels: ['企画'], priority: 0, dates: [], clearFormat: 'text', note: '' };
  }
  state.missionModalTab = 'BASIC';
  let overlay = document.getElementById('mission-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'mission-overlay';
  overlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-end justify-center page-transition';
  overlay.onclick = (e) => { if(e.target === overlay) window.closeMissionModal(); };
  overlay.innerHTML = `
    <div id="mission-panel" class="bg-white w-full max-w-md rounded-t-[40px] p-6 shadow-2xl transition-transform transform translate-y-full" style="height: 95vh;">
       <div class="w-12 h-1.5 bg-[#E1DFDC] rounded-full mx-auto mb-4"></div>
       <h2 class="text-[17px] font-bold text-center text-[#484545] mb-4" id="mission-modal-title"></h2>
       <div id="mission-modal-content" class="h-full pb-10"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    const panel = document.getElementById('mission-panel');
    if (panel) panel.classList.remove('translate-y-full');
  }, 10);
  window.renderMissionModalContent();
};

window.closeMissionModal = () => {
  const panel = document.getElementById('mission-panel');
  if (panel) panel.classList.add('translate-y-full');
  setTimeout(() => { const overlay = document.getElementById('mission-overlay'); if (overlay) overlay.remove(); }, 300);
};

window.renderMissionModalContent = function() {
  const container = document.getElementById('mission-modal-content'), titleEl = document.getElementById('mission-modal-title');
  if (!container || !titleEl) return;
  const isEdit = state.editingMissionId !== null;
  titleEl.innerText = isEdit ? 'ミッションを編集' : '新規ミッションを作成';
  const isBasic = state.missionModalTab === 'BASIC';
  const groups = getConsecutiveGroups(state.draftMission.dates);
  let dateDisplay = groups.length > 0 ? `<div class="flex items-center gap-2"><div class="bg-[#EBE8E5] px-2 py-1 rounded">${groups[0][0]}</div> 〜 <div class="bg-[#EBE8E5] px-2 py-1 rounded">${groups[0][groups[0].length-1]}</div></div>` : 'カレンダーから設定する';

  const renderBasic = () => `
    <div class="flex flex-col h-full">
      <div class="flex justify-center gap-10 mb-6">
        <button onclick="window.setMissionTab('BASIC')" class="text-[14px] font-bold pb-1 border-b-2 ${isBasic ? 'border-[#0CA1E3] text-[#0CA1E3]' : 'border-transparent text-[#A7AAAC]'}">基本設定</button>
        <button onclick="window.setMissionTab('DETAIL')" class="text-[14px] font-bold pb-1 border-b-2 ${!isBasic ? 'border-[#9EDF05] text-[#9EDF05]' : 'border-transparent text-[#A7AAAC]'}">詳細設定</button>
      </div>
      <div class="space-y-4 flex-1">
        <div>
          <label class="heading-rs block mb-1 text-[#484545]">ミッション</label>
          <input type="text" placeholder="ミッションを入力" value="${state.draftMission.title}" oninput="state.draftMission.title=this.value" class="input-field w-full px-4 py-3 focus:outline-none">
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1">
             <label class="heading-rs text-[#484545]">ラベル</label>
             <button class="w-5 h-5 border border-[#A7AAAC] rounded-full flex items-center justify-center text-[#A7AAAC] text-sm">+</button>
          </div>
          <div class="flex gap-2">
            ${['企画','運営','制作','広報'].map(l => {
              const sel = state.draftMission.labels.includes(l), conf = LABEL_CONFIG[l];
              return `<button onclick="window.toggleMissionLabel('${l}')" class="px-4 py-1 rounded-full border text-[12px] font-bold transition-all ${sel ? `${conf.border} ${conf.text} ${conf.bg}` : 'border-[#D3D6D8] text-[#A7AAAC]'}">${l}</button>`;
            }).join('')}
          </div>
        </div>
        <div>
          <label class="heading-rs block mb-1 text-[#484545]">優先度</label>
          <div class="flex gap-1">
            ${[1,2,3,4,5].map(v => `<button onclick="state.draftMission.priority=${v};window.renderMissionModalContent()" class="p-0.5"><svg width="32" height="32" viewBox="0 0 24 24" fill="${state.draftMission.priority >= v ? '#FFC300' : 'none'}" stroke="${state.draftMission.priority >= v ? '#FFC300' : '#E1DFDC'}" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>`).join('')}
          </div>
        </div>
        <div>
          <label class="heading-rs block mb-1 text-[#484545]">期限</label>
          <div class="flex items-center gap-2 mb-2 cursor-pointer" onclick="window.openCalendarModal('mission')">
            <img src="./images/icon/icon-Calender.svg" class="w-4 h-4 opacity-40">
            <span class="text-[12px] text-[#A7AAAC] font-bold">${dateDisplay}</span>
          </div>
        </div>
        <div>
          <label class="heading-rs block mb-3 text-[#484545]">ミッションクリアの形式</label>
          <div class="flex justify-around">
            ${['text', 'image', 'link'].map(f => `
              <div onclick="state.draftMission.clearFormat='${f}';window.renderMissionModalContent()" class="flex flex-col items-center gap-1.5 cursor-pointer">
                <div class="w-12 h-12 border-2 rounded-lg flex items-center justify-center ${state.draftMission.clearFormat===f ? 'border-[#0CA1E3]' : 'border-[#A7AAAC]'}">
                  <img src="./images/icon/icon-${f==='text'?'TextBox':f==='image'?'image':'Link'}.svg" class="w-6 h-6">
                </div>
                <span class="text-[9px] font-bold">${f==='text'?'テキスト':f==='image'?'画像':'リンク'}形式</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <button onclick="window.createOrUpdateMission()" class="btn-primary w-full py-4 heading-r font-bold mt-4 shadow-lg shadow-blue-200">${isEdit ? '保存' : '作成'}</button>
    </div>
  `;
  container.innerHTML = isBasic ? renderBasic() : `<div class="p-10 text-center text-gray">詳細設定は開発中です</div>`;
};

window.setMissionTab = (tab) => { state.missionModalTab = tab; window.renderMissionModalContent(); };
window.toggleMissionLabel = (l) => { state.draftMission.labels = [l]; window.renderMissionModalContent(); };
window.createOrUpdateMission = () => {
  if (!state.draftMission.title) return alert('ミッション名を入力してください');
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (state.editingMissionId) {
    const idx = project.missions.findIndex(m => m.id === state.editingMissionId);
    if (idx > -1) project.missions[idx] = { ...project.missions[idx], title: state.draftMission.title, tag: state.draftMission.labels[0], dates: state.draftMission.dates, clearFormat: state.draftMission.clearFormat };
  } else {
    project.missions.push({ id: Date.now().toString(), title: state.draftMission.title, tag: state.draftMission.labels[0], daysLeft: 7, dates: [...state.draftMission.dates], clearFormat: state.draftMission.clearFormat, status: 'yet', isDeletable: true });
  }
  state.save(); window.closeMissionModal(); state.render();
};

window.addProposalToMission = (pid) => {
  const prop = PROPOSAL_HELP[pid];
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (project.missions.some(m => m.title === prop.title)) return;
  project.missions.push({ id: Date.now().toString(), title: prop.title, tag: pid==='p1'?'企画':pid==='p2'?'広報':'制作', daysLeft: 7, dates: [], clearFormat: prop.format, status: 'yet', isDeletable: true });
  state.save(); state.render();
};

window.toggleMissionMenu = (e, missionId) => {
  e.stopPropagation();
  const existingMenu = document.getElementById('mission-menu');
  if (existingMenu) { existingMenu.remove(); if (existingMenu.dataset.mid === missionId) return; }
  const menu = document.createElement('div');
  menu.id = 'mission-menu'; menu.dataset.mid = missionId;
  menu.className = 'absolute right-4 top-10 bg-white border border-[#D3D6D8] rounded-xl shadow-xl z-[60] overflow-hidden min-w-[100px] animate-fadeIn';
  menu.innerHTML = `<button onclick="window.openMissionModal('${missionId}')" class="w-full text-left px-4 py-3 hover:bg-[#FDFBF8] text-rs font-bold border-b border-[#FDFBF8]">編集</button>`;
  e.currentTarget.parentElement.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
};

window.showMissionListModal = () => {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  const overlay = document.createElement('div');
  overlay.id = 'mission-list-modal';
  overlay.className = 'fixed inset-0 bg-black/60 z-[150] flex items-end justify-center page-transition';
  overlay.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-t-[40px] p-6 shadow-2xl h-[80vh] overflow-y-auto animate-fadeIn">
      <div class="flex items-center justify-between mb-8">
        <h2 class="heading-m text-[#484545]">ミッション一覧</h2>
        <button onclick="document.getElementById('mission-list-modal').remove()" class="p-2 opacity-40"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="space-y-4">
        ${p.missions.map(m => {
          const cleared = p.clearedData[m.id];
          return `
            <div class="bg-[#FDFBF8] border border-[#D3D6D8] rounded-2xl p-5">
              <div class="flex items-center gap-2 mb-2">${Components.Tag(m.tag)}${m.status==='cleared'?'<span class="text-[8px] text-[#9EDF05] font-bold border border-[#9EDF05] px-1 rounded ml-1">CLEAR</span>':''}</div>
              <h3 class="text-r font-bold text-[#484545] mb-2">${m.title}</h3>
              ${cleared ? `
                <div class="mt-3 pt-3 border-t border-[#EBE8E5]">
                  <p class="text-[10px] text-[#A7AAAC] font-bold mb-1">提出内容</p>
                  ${cleared.format === 'image' ? `<img src="${cleared.content}" class="w-full h-32 object-cover rounded-xl mt-1 shadow-inner">` : `<p class="text-rs text-[#484545] bg-white p-3 rounded-lg border border-[#EBE8E5] break-words">${cleared.content}</p>`}
                </div>
              ` : `<p class="text-[10px] text-[#A7AAAC]">未提出</p>`}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

// --- UIコンポーネント ---
const Components = {
  Header: (p) => {
    if (!p) {
      return `
        <header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20">
          <h1 class="heading-l text-[#484545]">イベントプランナー</h1>
          <button onclick="state.setView('CREATE_PROJECT_INFO')" class="w-10 h-10 bg-[#0CA1E3] rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>
      `;
    }
    return `
      <header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20">
        <div class="flex items-center gap-3">
          <button onclick="state.setView('HOME')" class="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><img src="./images/icon/iocn-Chevron.svg" class="w-4 h-4 brightness-0 opacity-50"></button>
          <div class="flex items-center gap-2"><img src="${SEED_TYPES.find(s=>s.id===p.seedType).path}" class="w-5 h-5"><span class="text-[14px] font-bold truncate max-w-[180px]">${p.name}</span></div>
        </div>
        <button class="p-1"><img src="./images/icon/icon-Setting.svg" class="w-6 h-6"></button>
      </header>
    `;
  },
  Tabs: (active) => `
    <div class="px-6 flex border-b border-[#D3D6D8]">
      <div onclick="state.mainBoardTab='MAIN';state.render()" class="flex-1 flex flex-col items-center py-2 cursor-pointer ${active==='MAIN'?'border-b-2 border-[#0CA1E3]':'opacity-40'}"><img src="./images/icon/icon-MainBoard${active==='MAIN'?'-pressed':''}.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold ${active==='MAIN'?'text-[#0CA1E3]':''}">メインボード</span></div>
      <div onclick="state.mainBoardTab='RANKING';state.render()" class="flex-1 flex flex-col items-center py-2 cursor-pointer ${active==='RANKING'?'border-b-2 border-[#EE3E12]':'opacity-40'}"><img src="./images/icon/icon-Ranking${active==='RANKING'?'-pressed':''}.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold ${active==='RANKING'?'text-[#EE3E12]':''}">ランキング</span></div>
      <div onclick="state.mainBoardTab='ARCHIVE';state.render()" class="flex-1 flex flex-col items-center py-2 cursor-pointer ${active==='ARCHIVE'?'border-b-2 border-[#FFC300]':'opacity-40'}"><img src="./images/icon/icon-Archive${active==='ARCHIVE'?'-pressed':''}.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold ${active==='ARCHIVE'?'text-[#FFC300]':''}">アーカイブ</span></div>
    </div>
  `,
  Tag: (text) => {
    const conf = LABEL_CONFIG[text] || { color: '#484545' };
    return `<span class="px-1.5 py-0.5 rounded text-[8px] text-white font-bold" style="background-color: ${conf.color}">${text}</span>`;
  },
  PenIcon: (type) => `
    <button onclick="window.editArchiveItem('${type}')" class="p-1 opacity-60 hover:opacity-100 transition-opacity">
      <img src="./images/icon/ icon-Pen.svg" class="w-4 h-4">
    </button>
  `
};

// --- 各画面レンダリング ---

function renderHome(container) {
  const ongoing = state.projects.filter(p => !p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const completed = state.projects.filter(p => p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const renderGrid = (list) => {
    if (list.length === 0) return `<div class="h-24 flex items-center"><span class="text-rs text-[#A7AAAC]">プロジェクトがありません</span></div><div class="w-full h-[1.5px] bg-[#D3D6D8] mt-1 mb-8"></div>`;
    let html = '';
    for (let i = 0; i < list.length; i += 3) {
      const row = list.slice(i, i + 3);
      html += `<div class="grid grid-cols-3 gap-x-2 px-1 mb-2 items-end">
        ${row.map(p => `<div class="flex flex-col items-center cursor-pointer group" onclick="state.setView('MAIN_BOARD', '${p.id}')">
          <span class="text-[10px] text-[#484545] mb-2 truncate w-full text-center px-1 font-bold">${p.name}</span>
          <div class="h-24 w-full flex items-end justify-center mb-1"><img src="${SEED_TYPES.find(s=>s.id===p.seedType).path}" class="max-h-full max-w-full object-contain block h-full"></div>
        </div>`).join('')}
        ${Array(3 - row.length).fill('<div class="h-28"></div>').join('')}
      </div><div class="w-full h-[1.5px] bg-[#D3D6D8] mt-1 mb-8"></div>`;
    }
    return html;
  };
  container.innerHTML = `<div class="flex flex-col min-h-screen bg-[#FDFBF8]">${Components.Header()}<main class="flex-1 px-6 pt-2 pb-36 page-transition"><section class="mb-12"><h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">作成したプロジェクト</h2>${renderGrid(ongoing)}</section><section><h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">完了したプロジェクト</h2>${renderGrid(completed)}</section></main></div>`;
}

function renderCreateProjectInfo(container) {
  const groups = getConsecutiveGroups(state.draftProject.dates);
  const dateListHtml = groups.length === 0 ? `<p class="text-[12px] text-[#A7AAAC] text-center py-4">開催日が選択されていません</p>` : groups.map(g => `<div class="flex items-center justify-between bg-white border border-[#D3D6D8] px-5 py-4 rounded-xl shadow-sm animate-fadeIn"><div class="text-[14px] text-[#484545]">${g[0]}〜${g[g.length-1]}</div><button onclick="window.removeDraftDateGroup('${JSON.stringify(g)}')" class="p-1 opacity-30"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>`).join('');
  const canNext = state.draftProject.name && state.draftProject.description && state.draftProject.dates.length > 0;

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header>
      <main class="flex-1 px-8 pt-2 pb-12 flex flex-col page-transition">
        <div class="space-y-6 mb-8">
          <div>
            <label class="heading-rs block mb-2 text-[#484545]">プロジェクト名</label>
            <input type="text" placeholder="プロジェクト名を入力" value="${state.draftProject.name}" oninput="window.updateDraftInfo('name', this.value)" class="input-field w-full px-5 py-4 focus:outline-none">
          </div>
          <div>
            <label class="heading-rs block mb-2 text-[#484545]">プロジェクトの説明</label>
            <textarea placeholder="プロジェクトの説明を入力" rows="4" oninput="window.updateDraftInfo('description', this.value)" class="input-field w-full px-5 py-4 focus:outline-none resize-none">${state.draftProject.description}</textarea>
          </div>
          <div class="pt-2 border-t border-[#EBE8E5]">
            <div class="flex items-center justify-between mb-4">
              <label class="heading-rs text-[#484545]">開催日時</label>
              <button onclick="window.openCalendarModal('project')" class="bg-[#EBE8E5] px-4 py-2 rounded-full font-bold text-[12px]">日付を追加</button>
            </div>
            <div class="space-y-3">${dateListHtml}</div>
          </div>
        </div>
        <button id="next-btn" onclick="state.setView('CREATE_PROJECT_SEED')" class="btn-primary w-full py-4 heading-r font-bold mt-auto" ${canNext ? '' : 'disabled'}>次へ</button>
      </main>
    </div>`;
}

function renderCreateProjectSeed(container) {
  let sel = state.draftProject.seedType || '';
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header>
      <main class="flex-1 px-8 pt-6 pb-12 flex flex-col items-center page-transition">
        <h2 class="heading-l mb-12 text-[#484545]">種を選択</h2>
        <div class="grid grid-cols-3 gap-6 mb-16 w-full max-w-[320px]">
          ${SEED_TYPES.map(s => `
            <div onclick="state.draftProject.seedType='${s.id}';state.render()" class="flex flex-col items-center cursor-pointer">
              <div class="w-20 h-20 rounded-full bg-[#EBE8E5] flex items-center justify-center border-2 ${sel===s.id?'border-[#0CA1E3] scale-110 shadow-md':'border-transparent'}">
                <img src="${s.path}" class="w-12 h-12">
              </div>
              <span class="text-[11px] mt-2 font-bold text-[#484545]">${s.name}</span>
            </div>`).join('')}
        </div>
        <button onclick="state.setView('CREATE_PROJECT_INVITE')" class="btn-primary w-full py-4 heading-r font-bold mt-auto" ${sel?'':'disabled'}>次へ</button>
      </main>
    </div>`;
}

function renderCreateProjectInvite(container) {
  const code = state.draftProject.inviteCode || Math.random().toString(36).substring(2,10).toUpperCase();
  state.draftProject.inviteCode = code;
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header>
      <main class="flex-1 px-8 pt-6 pb-12 flex flex-col items-center page-transition">
        <h2 class="heading-l mb-16 text-[#484545]">チームメンバーを招待</h2>
        <div class="text-center space-y-6 mb-12 w-full">
          <div class="bg-white border border-[#D3D6D8] p-6 rounded-2xl shadow-sm">
            <p class="heading-m tracking-widest font-mono text-[#484545]">${code}</p>
          </div>
        </div>
        <button onclick="state.addProject()" class="btn-primary w-full py-4 heading-r font-bold mt-auto">プロジェクトを作成</button>
      </main>
    </div>`;
}

function renderMainBoard(container) {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  if (!p) return state.setView('HOME');
  const seed = SEED_TYPES.find(s => s.id === p.seedType);
  
  const renderArchive = () => {
    const title = p.clearedData['def-2']?.content || '未設定';
    const summary = p.clearedData['def-3']?.content || '未設定';
    const mainVisual = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].title==='メインビジュアルを作成' || p.clearedData[k].title==='image')]?.content;
    const url = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].format==='link' || p.clearedData[k].title==='url')]?.content || '未設定';
    const venue = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].title==='開催場所を決める' || p.clearedData[k].title==='venue')]?.content || '未設定';
    const period = p.dates.length > 0 ? `${p.dates[0]} 〜 ${p.dates[p.dates.length-1]}` : '未設定';

    return `
      <div class="px-6 pt-4 pb-20 page-transition space-y-6">
        <div class="flex justify-between items-center px-1">
           <div onclick="window.openCalendarModal('view')" class="cursor-pointer bg-white border border-[#D3D6D8] rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
             <img src="./images/icon/icon-Calender.svg" class="w-4 h-4">
             <span class="text-[12px] font-bold text-[#484545]">開催まで残り <span class="text-[18px] font-mono">${p.daysLeft}</span> 日</span>
           </div>
           <div class="flex items-center gap-1.5 opacity-40"><img src="./images/icon/icon-good.svg" class="w-5 h-5"> <span class="text-[14px] font-bold">21</span></div>
        </div>

        <div class="relative group rounded-3xl overflow-hidden shadow-sm border border-[#D3D6D8] bg-[#EBE8E5] aspect-[4/3] flex items-center justify-center">
          ${mainVisual ? `<img src="${mainVisual}" class="w-full h-full object-cover">` : `<img src="./images/icon/icon-image.svg" class="w-12 h-12 opacity-20">`}
          <div class="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-lg">
             ${Components.PenIcon('image')}
          </div>
        </div>

        <div class="text-center px-4 relative">
          <div class="flex items-center justify-center gap-2">
            <h2 class="text-[18px] font-bold text-[#484545] leading-snug">「${title}」</h2>
            ${Components.PenIcon('title')}
          </div>
        </div>

        <div class="space-y-6">
          <section>
            <div class="flex items-center gap-2 mb-2">
               <h3 class="text-[12px] font-bold text-[#484545]">概要</h3>
               ${Components.PenIcon('summary')}
            </div>
            <p class="text-[13px] text-[#484545] leading-relaxed whitespace-pre-wrap">${summary}</p>
          </section>

          <section class="grid grid-cols-[80px_1fr_40px] gap-y-4 text-[13px]">
            <div class="font-bold text-[#A7AAAC]">期間</div>
            <div class="font-bold text-[#484545]">${period}<br><span class="text-[11px] opacity-60">11:00-19:00</span></div>
            <div></div>

            <div class="font-bold text-[#A7AAAC]">URL</div>
            <div class="font-bold text-[#0CA1E3] underline truncate">${url}</div>
            <div>${Components.PenIcon('url')}</div>

            <div class="font-bold text-[#A7AAAC]">場所</div>
            <div class="font-bold text-[#484545]">${venue}</div>
            <div>${Components.PenIcon('venue')}</div>
          </section>
        </div>

        <button onclick="window.showMissionListModal()" class="btn-secondary w-full py-4 heading-r font-bold">ミッション一覧</button>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      ${Components.Header(p)}
      ${Components.Tabs(state.mainBoardTab)}
      <main class="flex-1 overflow-y-auto no-scrollbar pb-32">
        ${state.mainBoardTab === 'MAIN' ? `
          <div class="px-6 pt-4 space-y-6 page-transition">
            <div onclick="window.openCalendarModal('view')" class="cursor-pointer bg-white border border-[#D3D6D8] rounded-xl p-2.5 flex items-center justify-center gap-3 shadow-sm scale-90 active:scale-95 transition-transform">
               <img src="./images/icon/icon-Calender.svg" class="w-5 h-5">
               <span class="heading-rs tracking-tight">開催まで残り <span class="text-[20px] font-mono">${p.daysLeft}</span> 日</span>
            </div>
            <div class="flex justify-center -mt-2"><div class="relative w-48 h-48 rounded-full border-[10px] border-[#EBE8E5] flex items-center justify-center shadow-inner"><div class="w-36 h-36 bg-[#CFD8FF] rounded-full flex items-center justify-center"><img src="${seed.plantPrefix}1.svg" class="w-24 h-28 object-contain mt-2 opacity-80"></div></div></div>
            <div class="grid grid-cols-3 gap-2">
               ${p.proposals.map((pr, i) => `<div onclick="window.addProposalToMission('${pr.id}')" class="cursor-pointer bg-white border border-[#D3D6D8] rounded-2xl p-2.5 shadow-sm flex flex-col min-h-[120px] active:bg-[#FDFBF8] transition-colors"><div class="flex items-center justify-between mb-1.5"><span class="text-[7.5px] text-black/40 font-bold">提案${i+1}</span>${Components.Tag(pr.tag)}</div><h3 class="text-[13px] font-bold leading-snug flex-1 break-words">${pr.title}</h3><div class="flex justify-end gap-1 mt-1"><button onclick="event.stopPropagation(); window.showProposalHelp('${pr.id}')" class="opacity-30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></button></div></div>`).join('')}
            </div>
            <section>
               <div class="flex items-center justify-between mb-4"><h2 class="heading-m">ミッション</h2><button class="p-1"><img src="./images/icon/icon-Filter.svg" class="w-6 h-4"></button></div>
               <div class="space-y-3 pb-10">
                  ${p.missions.length === 0 ? '<p class="text-center py-4 text-[#A7AAAC] text-rs">ミッションがありません</p>' : p.missions.map(m => `
                    <div onclick="window.openClearMissionModal('${m.id}')" class="bg-white border border-[#D3D6D8] rounded-xl p-4 flex flex-col shadow-sm relative animate-fadeIn group cursor-pointer ${m.status==='cleared'?'opacity-60':''}">
                       <div class="flex items-center gap-3 mb-2">${Components.Tag(m.tag)}<span class="text-[11px] text-black/40 font-bold">残り${m.daysLeft}日</span> ${m.status==='cleared'?'<span class="text-[9px] font-bold text-[#9EDF05] ml-2">✓ CLEAR</span>':''}</div>
                       <h3 class="text-[14px] font-bold text-[#484545] pr-8">${m.title}</h3>
                       <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 p-2 cursor-pointer hover:opacity-100 transition-opacity" onclick="window.toggleMissionMenu(event, '${m.id}')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div>
                    </div>`).join('')}
               </div>
            </section>
          </div>
        ` : state.mainBoardTab === 'ARCHIVE' ? renderArchive() : `<div class="p-10 text-center text-gray">ランキングは準備中です</div>`}
      </main>
      <button onclick="window.openMissionModal()" class="fixed bottom-10 right-6 w-14 h-14 bg-[#0CA1E3] rounded-full shadow-[0_4px_15px_rgba(12,161,227,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform z-40"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
    </div>
  `;
}

state.init();
