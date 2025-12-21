
// --- 定数定義 ---
const SEED_TYPES = [
  { id: 'jack', path: './images/plants/seed-jack.svg', name: 'ジャック', plantPrefix: './images/plants/plant-jack-' },
  { id: 'baribari', path: './images/plants/seed-baribari.svg', name: 'バリバリ', plantPrefix: './images/plants/plant-baribari-' },
  { id: 'lucky', path: './images/plants/seed-lucky.svg', name: 'ラッキー', plantPrefix: './images/plants/plant-lucky-' }
];

const PROPOSAL_HELP = {
  p1: { title: "開催場所を設定する", body: "イベントをどこで行うか決めましょう。オンラインの場合はツール名を、対面の場合は施設名を入力します。" },
  p2: { title: "広報用リンクを挿入する", body: "SNSやWebサイトなど、参加者が詳細を確認できるURLを準備しましょう。" },
  p3: { title: "メインビジュアル作成", body: "イベントの顔となる画像を作成します。テーマカラーやロゴを含めると効果的です。" }
};

// --- ヘルパー関数 ---

function getConsecutiveGroups(dateStrings) {
  if (!dateStrings || dateStrings.length === 0) return [];
  const sorted = [...dateStrings].sort();
  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffInDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffInDays === 1) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
}

// --- 状態管理 ---
const state = {
  projects: [],
  currentView: 'HOME',
  selectedProjectId: null,
  editingMissionId: null, // nullなら新規、IDがあれば編集
  draftProject: { name: '', description: '', dates: [] },
  draftMission: {
    title: '',
    labels: ['企画'],
    priority: 0,
    dates: [],
    clearFormat: 'text',
    note: '',
    isReadOnly: false,
    restrictRole: false,
    restrictMember: false,
    noReminder: false,
    autoDelete: false
  },
  missionModalTab: 'BASIC', // 'BASIC' | 'DETAIL'
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
    this.currentView = view;
    this.selectedProjectId = projectId;
    this.render();
    window.scrollTo(0, 0);
  },

  addProject() {
    if (!this.draftProject.name || !this.draftProject.description || !this.draftProject.seedType || this.draftProject.dates.length === 0) return;
    
    // 初期ミッションの定義
    const defaultMissions = [
      { id: 'def-1', title: 'イベントの目的を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false },
      { id: 'def-2', title: 'イベントのタイトルを決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false },
      { id: 'def-3', title: 'イベントの概要を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false }
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
      proposals: [
        { id: 'p1', title: '開催場所を設定する', tag: '制作', type: 'create' },
        { id: 'p2', title: '広報用リンクを挿入', tag: '企画', type: 'plan' },
        { id: 'p3', title: 'メインビジュアル作成', tag: '広報', type: 'public' }
      ]
    };
    this.projects.push(newProject);
    this.save();
    this.setView('MAIN_BOARD', newProject.id);
    this.draftProject = { name: '', description: '', dates: [] };
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

// --- モーダル関連 ---

window.showProposalHelp = (pid) => {
  const help = PROPOSAL_HELP[pid];
  if (!help) return;
  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 page-transition';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative">
      <button onclick="document.getElementById('help-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <h3 class="heading-l text-[#0CA1E3] mb-4 pr-6">${help.title}</h3>
      <p class="text-r text-[#484545] leading-relaxed mb-8">${help.body}</p>
      <button onclick="document.getElementById('help-modal').remove()" class="btn-primary w-full py-4 heading-r font-bold">わかった</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// カレンダー
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
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const dates = target === 'project' ? state.draftProject.dates : state.draftMission.dates;
  
  let daysHtml = '';
  for (let i = 0; i < firstDay; i++) daysHtml += `<div class="h-10"></div>`;
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dates.includes(dateStr);
    daysHtml += `
      <div onclick="window.toggleDate('${dateStr}', '${target}')" class="h-10 w-full flex items-center justify-center rounded-lg cursor-pointer transition-all text-rs font-bold ${isSelected ? 'bg-[#0CA1E3] text-white shadow-md' : 'bg-white text-[#484545]'}">${d}</div>
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

window.moveCalendarMonth = (offset, target) => {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + offset);
  renderCalendarInner(target);
};

window.toggleDate = (dateStr, target) => {
  const dates = target === 'project' ? state.draftProject.dates : state.draftMission.dates;
  const idx = dates.indexOf(dateStr);
  if (idx > -1) dates.splice(idx, 1); else dates.push(dateStr);
  dates.sort();
  renderCalendarInner(target);
  if (target === 'project') window.refreshDraftDateList(); else window.renderMissionModalContent();
};

// --- ミッション作成/編集モーダル ---

window.openMissionModal = (missionId = null) => {
  state.editingMissionId = missionId;
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  
  if (missionId && project) {
    const m = project.missions.find(x => x.id === missionId);
    state.draftMission = { ...m, dates: m.dates || [], labels: [m.tag] };
  } else {
    state.draftMission = {
      title: '', labels: ['企画'], priority: 0, dates: [], clearFormat: 'text',
      note: '', isReadOnly: false, restrictRole: false, restrictMember: false, noReminder: false, autoDelete: false
    };
  }
  
  state.missionModalTab = 'BASIC';
  const overlay = document.createElement('div');
  overlay.id = 'mission-overlay';
  overlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-end justify-center page-transition';
  overlay.onclick = (e) => { if(e.target === overlay) window.closeMissionModal(); };
  overlay.innerHTML = `
    <div id="mission-panel" class="bg-white w-full max-w-md rounded-t-[40px] p-8 shadow-2xl transition-transform transform translate-y-full" style="height: 90vh;">
       <div class="w-12 h-1.5 bg-[#E1DFDC] rounded-full mx-auto mb-8"></div>
       <h2 class="heading-l text-center text-[#484545] mb-8" id="mission-modal-title"></h2>
       <div id="mission-modal-content"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('mission-panel').classList.remove('translate-y-full'), 10);
  window.renderMissionModalContent();
};

window.closeMissionModal = () => {
  const panel = document.getElementById('mission-panel');
  if (panel) panel.classList.add('translate-y-full');
  setTimeout(() => {
    const overlay = document.getElementById('mission-overlay');
    if (overlay) overlay.remove();
  }, 300);
};

window.setMissionTab = (tab) => {
  state.missionModalTab = tab;
  window.renderMissionModalContent();
};

window.renderMissionModalContent = function() {
  const container = document.getElementById('mission-modal-content');
  const titleEl = document.getElementById('mission-modal-title');
  if (!container || !titleEl) return;

  const isEdit = state.editingMissionId !== null;
  titleEl.innerText = isEdit ? 'ミッションを編集' : '新規ミッションを作成';

  const isBasic = state.missionModalTab === 'BASIC';
  const groups = getConsecutiveGroups(state.draftMission.dates);
  let dateDisplay = 'カレンダーから設定する';
  if (groups.length > 0) {
    const g = groups[0];
    const [sy, sm, sd] = g[0].split('-');
    const last = g[g.length-1].split('-');
    dateDisplay = `<div class="flex items-center gap-2"><div class="bg-[#EBE8E5] px-2 py-1 rounded">${sy}</div> / <div class="bg-[#EBE8E5] px-2 py-1 rounded">${sm}</div> / <div class="bg-[#EBE8E5] px-2 py-1 rounded">${sd}</div> 〜 <div class="bg-[#EBE8E5] px-2 py-1 rounded">${last[2]}</div></div>`;
  }

  const renderBasic = () => `
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div class="flex justify-center gap-12 mb-10">
        <button onclick="window.setMissionTab('BASIC')" class="heading-r pb-1 border-b-2 ${isBasic ? 'border-[#0CA1E3] text-[#0CA1E3]' : 'border-transparent text-[#A7AAAC]'}">基本設定</button>
        <button onclick="window.setMissionTab('DETAIL')" class="heading-r pb-1 border-b-2 ${!isBasic ? 'border-[#9EDF05] text-[#9EDF05]' : 'border-transparent text-[#A7AAAC]'}">詳細設定</button>
      </div>

      <div class="space-y-8 flex-1">
        <div>
          <label class="heading-rs block mb-3 text-[#484545]">ミッション</label>
          <input type="text" placeholder="ミッションを入力" value="${state.draftMission.title}" oninput="state.draftMission.title=this.value" class="input-field w-full px-5 py-4 focus:outline-none">
        </div>

        <div>
          <div class="flex items-center gap-2 mb-3">
             <label class="heading-rs text-[#484545]">ラベル</label>
             <button class="w-6 h-6 border border-[#A7AAAC] rounded-full flex items-center justify-center text-[#A7AAAC] text-xl pb-1">+</button>
          </div>
          <div class="flex gap-2">
            ${['企画','運営','制作','広報'].map(l => `
              <button onclick="window.toggleMissionLabel('${l}')" class="px-5 py-1.5 rounded-full border text-rs font-bold transition-all ${state.draftMission.labels.includes(l) ? 'border-[#0CA1E3] text-[#0CA1E3] bg-[#0CA1E3]/5' : 'border-[#D3D6D8] text-[#A7AAAC]'}">${l}</button>
            `).join('')}
          </div>
        </div>

        <div>
          <label class="heading-rs block mb-3 text-[#484545]">優先度</label>
          <div class="flex gap-2">
            ${[1,2,3,4,5].map(v => `
              <button onclick="state.draftMission.priority=${v};window.renderMissionModalContent()" class="p-1">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="${state.draftMission.priority >= v ? '#E1DFDC' : 'none'}" stroke="#E1DFDC" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-3 cursor-pointer" onclick="window.openCalendarModal('mission')">
            <label class="heading-rs text-[#484545]">期限</label>
            <img src="./images/icon/icon-Calender.svg" class="w-5 h-5 opacity-40">
            <span class="text-rs text-[#A7AAAC]">${groups.length > 0 ? '' : 'カレンダーから設定する'}</span>
          </div>
          <div class="flex items-center text-[#484545] font-bold">
            ${dateDisplay}
          </div>
        </div>

        <div>
          <label class="heading-rs block mb-5 text-[#484545]">ミッションクリアの形式</label>
          <div class="flex justify-around">
            <div onclick="state.draftMission.clearFormat='text';window.renderMissionModalContent()" class="flex flex-col items-center gap-2 cursor-pointer">
              <div class="w-16 h-16 border-4 rounded-xl flex items-center justify-center ${state.draftMission.clearFormat==='text' ? 'border-[#0CA1E3]' : 'border-[#A7AAAC]'}">
                <img src="./images/icon/icon-TextBox.svg" class="w-8 h-8">
              </div>
              <span class="text-[10px] font-bold">テキスト形式</span>
            </div>
            <div onclick="state.draftMission.clearFormat='image';window.renderMissionModalContent()" class="flex flex-col items-center gap-2 cursor-pointer">
              <div class="w-16 h-16 border-4 rounded-xl flex items-center justify-center ${state.draftMission.clearFormat==='image' ? 'border-[#0CA1E3]' : 'border-[#A7AAAC]'}">
                <img src="./images/icon/icon-image.svg" class="w-8 h-8">
              </div>
              <span class="text-[10px] font-bold">画像形式</span>
            </div>
            <div onclick="state.draftMission.clearFormat='link';window.renderMissionModalContent()" class="flex flex-col items-center gap-2 cursor-pointer">
              <div class="w-16 h-16 border-4 rounded-xl flex items-center justify-center ${state.draftMission.clearFormat==='link' ? 'border-[#0CA1E3]' : 'border-[#A7AAAC]'}">
                <img src="./images/icon/icon-Link.svg" class="w-8 h-8">
              </div>
              <span class="text-[10px] font-bold">リンク形式</span>
            </div>
          </div>
        </div>
      </div>

      <button onclick="window.createOrUpdateMission()" class="btn-primary w-full py-5 heading-r font-bold mt-8 shadow-lg shadow-blue-200">
        ${isEdit ? '保存' : '作成'}
      </button>
    </div>
  `;

  const renderDetail = () => `
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div class="flex justify-center gap-12 mb-10">
        <button onclick="window.setMissionTab('BASIC')" class="heading-r pb-1 border-b-2 border-transparent text-[#A7AAAC]">基本設定</button>
        <button onclick="window.setMissionTab('DETAIL')" class="heading-r pb-1 border-b-2 border-[#9EDF05] text-[#9EDF05]">詳細設定</button>
      </div>

      <div class="space-y-10 flex-1">
        <div>
          <label class="heading-rs block mb-3 text-[#484545]">メモ</label>
          <textarea placeholder="説明や伝達事項を入力" oninput="state.draftMission.note=this.value" class="input-field w-full px-5 py-6 rounded-3xl focus:outline-none h-32 resize-none">${state.draftMission.note || ''}</textarea>
        </div>

        <div>
          <label class="heading-rs block mb-4 text-[#484545]">編集権限</label>
          <div class="flex items-center justify-between">
            <span class="text-rs text-[#484545] font-bold">メンバーの編集を不可能にする</span>
            ${renderToggle('isReadOnly', state.draftMission.isReadOnly)}
          </div>
        </div>

        <div>
          <label class="heading-rs block mb-4 text-[#484545]">非公開設定</label>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-rs text-[#484545] font-bold">公開する役職を絞る</span>
              ${renderToggle('restrictRole', state.draftMission.restrictRole)}
            </div>
            <div class="flex items-center justify-between">
              <span class="text-rs text-[#484545] font-bold">公開するメンバーを絞る</span>
              ${renderToggle('restrictMember', state.draftMission.restrictMember)}
            </div>
          </div>
        </div>

        <div>
          <label class="heading-rs block mb-4 text-[#484545]">期限</label>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-rs text-[#484545] font-bold">期限前はリマインドしない</span>
              ${renderToggle('noReminder', state.draftMission.noReminder)}
            </div>
            <div class="flex items-center justify-between">
              <span class="text-rs text-[#484545] font-bold">期限超過後は自動で削除する</span>
              ${renderToggle('autoDelete', state.draftMission.autoDelete)}
            </div>
          </div>
        </div>
      </div>

      <button onclick="window.deleteMission()" class="btn-primary w-full py-5 heading-r font-bold mt-8 shadow-lg shadow-blue-200" ${state.draftMission.isDeletable === false ? 'disabled opacity-30' : ''}>削除する</button>
    </div>
  `;

  const renderToggle = (key, val) => `
    <div onclick="state.draftMission['${key}']=!state.draftMission['${key}'];window.renderMissionModalContent()" class="w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${val ? 'bg-[#0CA1E3]' : 'bg-[#EBE8E5]'}">
      <div class="w-4 h-4 bg-white rounded-full transition-transform ${val ? 'translate-x-6' : ''}"></div>
    </div>
  `;

  container.innerHTML = isBasic ? renderBasic() : renderDetail();
};

window.toggleMissionLabel = (l) => {
  const idx = state.draftMission.labels.indexOf(l);
  if(idx > -1) state.draftMission.labels.splice(idx, 1); else state.draftMission.labels.push(l);
  window.renderMissionModalContent();
};

window.createOrUpdateMission = () => {
  if (!state.draftMission.title) return alert('ミッション名を入力してください');
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  if (state.editingMissionId) {
    const idx = project.missions.findIndex(m => m.id === state.editingMissionId);
    if (idx > -1) {
      project.missions[idx] = {
        ...project.missions[idx],
        title: state.draftMission.title,
        tag: state.draftMission.labels[0] || '運営',
        daysLeft: state.draftMission.dates.length > 0 ? state.calculateDaysLeft(state.draftMission.dates[0]) : project.missions[idx].daysLeft,
        dates: state.draftMission.dates,
        note: state.draftMission.note
      };
    }
  } else {
    project.missions.push({
      id: Date.now().toString(),
      title: state.draftMission.title,
      tag: state.draftMission.labels[0] || '運営',
      daysLeft: state.draftMission.dates.length > 0 ? state.calculateDaysLeft(state.draftMission.dates[0]) : 7,
      dates: state.draftMission.dates,
      type: 'plan',
      isDeletable: true
    });
  }

  state.save();
  window.closeMissionModal();
  state.render();
};

window.deleteMission = () => {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project || !state.editingMissionId) return;
  project.missions = project.missions.filter(m => m.id !== state.editingMissionId);
  state.save();
  window.closeMissionModal();
  state.render();
};

// --- ミートボールメニュー ---
window.toggleMissionMenu = (e, missionId) => {
  e.stopPropagation();
  const existingMenu = document.getElementById('mission-menu');
  if (existingMenu) {
    existingMenu.remove();
    if (existingMenu.dataset.mid === missionId) return;
  }

  const menu = document.createElement('div');
  menu.id = 'mission-menu';
  menu.dataset.mid = missionId;
  menu.className = 'absolute right-4 top-10 bg-white border border-[#D3D6D8] rounded-xl shadow-xl z-50 overflow-hidden min-w-[100px]';
  menu.innerHTML = `
    <button onclick="window.openMissionModal('${missionId}')" class="w-full text-left px-4 py-3 hover:bg-[#FDFBF8] text-rs font-bold border-b border-[#FDFBF8]">編集</button>
  `;
  e.currentTarget.parentElement.appendChild(menu);

  // 外側クリックで閉じる
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
};

// --- UIコンポーネント ---
const Components = {
  Header: () => `
    <header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20">
      <button class="p-1" onclick="state.setView('HOME')">
        <svg width="34" height="24" viewBox="0 0 34 24" fill="none"><path d="M1 1H33M1 12H33M1 23H33" stroke="#484545" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <button id="header-add-btn" class="flex items-center gap-1 border border-[#0CA1E3] text-[#0CA1E3] px-4 py-1.5 rounded-lg bg-white shadow-sm active:scale-95 transition-transform">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span class="heading-r font-bold">作成</span>
      </button>
    </header>
  `,
  BottomNav: (active = 'home') => `
    <div class="fixed bottom-6 left-0 right-0 px-6 z-40 pointer-events-none">
      <nav class="max-w-sm mx-auto bg-white/95 backdrop-blur-md border border-[#D3D6D8] rounded-[32px] px-8 py-3.5 flex justify-between items-center shadow-xl pointer-events-auto">
        <button class="p-2" onclick="state.setView('HOME')"><img src="./images/icon/icon-Home${active === 'home' ? '-pressed' : ''}.svg" class="w-8 h-8"></button>
        <button class="p-2 opacity-40"><img src="./images/icon/icon-Research.svg" class="w-8 h-8"></button>
        <button class="p-2 opacity-40"><img src="./images/icon/icon-Notification.svg" class="w-8 h-8"></button>
      </nav>
    </div>
  `,
  ShelfLine: () => `<div class="w-full h-[1.5px] bg-[#D3D6D8] mt-1 mb-8"></div>`,
  Pagination: (step) => `
    <div class="flex gap-2 justify-center mb-10">
      ${[0,1,2].map(i => `<div class="w-2.5 h-2.5 rounded-full ${step === i ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>`).join('')}
    </div>
  `,
  Tag: (text) => {
    const colors = { 運営: 'bg-[#EE3E12]', 企画: 'bg-[#0CA1E3]', 制作: 'bg-[#FFC300]', 広報: 'bg-[#9EDF05]' };
    return `<span class="px-1.5 py-0.5 rounded text-[8px] text-white font-bold ${colors[text] || 'bg-gray-400'}">${text}</span>`;
  }
};

// --- 各画面レンダリング ---

function renderHome(container) {
  const ongoing = state.projects.filter(p => !p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const completed = state.projects.filter(p => p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const renderGrid = (list) => {
    if (list.length === 0) return `<div class="h-24 flex items-center"><span class="text-rs text-[#A7AAAC]">プロジェクトがありません</span></div>${Components.ShelfLine()}`;
    let html = '';
    for (let i = 0; i < list.length; i += 3) {
      const row = list.slice(i, i + 3);
      html += `<div class="grid grid-cols-3 gap-x-2 px-1 mb-2 items-end">
        ${row.map(p => `<div class="flex flex-col items-center cursor-pointer group" onclick="state.setView('MAIN_BOARD', '${p.id}')">
          <span class="text-[10px] text-[#484545] mb-2 truncate w-full text-center px-1 font-bold">${p.name}</span>
          <div class="h-24 w-full flex items-end justify-center mb-1"><img src="${SEED_TYPES.find(s=>s.id===p.seedType)?.path || SEED_TYPES[0].path}" class="max-h-full max-w-full object-contain block h-full"></div>
        </div>`).join('')}
        ${Array(3 - row.length).fill('<div class="h-28"></div>').join('')}
      </div>${Components.ShelfLine()}`;
    }
    return html;
  };
  container.innerHTML = `<div class="flex flex-col min-h-screen bg-[#FDFBF8]">${Components.Header()}<main class="flex-1 px-6 pt-2 pb-36 page-transition"><section class="mb-12"><h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">作成したプロジェクト</h2>${renderGrid(ongoing)}</section><section><h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">完了したプロジェクト</h2>${renderGrid(completed)}</section></main>${Components.BottomNav('home')}</div>`;
  document.getElementById('header-add-btn').onclick = () => { state.draftProject={name:'',description:'',dates:[]}; state.setView('CREATE_PROJECT_INFO'); };
}

function renderCreateProjectInfo(container) {
  window.refreshDraftDateList = () => {
    const listEl = document.getElementById('selected-dates-list');
    if (!listEl) return;
    const groups = getConsecutiveGroups(state.draftProject.dates);
    listEl.innerHTML = groups.length === 0 ? `<p class="text-[12px] text-[#A7AAAC] text-center py-4">開催日が選択されていません</p>` : groups.map(g => {
      const s = g[0].split('-'); const e = g[g.length-1].split('-');
      const txt = g.length > 1 ? (s[1]===e[1] ? `<span class="font-bold">${s[0]}年${s[1]}月${s[2]}日</span>〜<span class="font-bold">${e[2]}日</span>` : `<span class="font-bold">${s[0]}年${s[1]}月${s[2]}日</span>〜<span class="font-bold">${e[0]}年${e[1]}月${e[2]}日</span>`) : `<span class="font-bold">${s[0]}年${s[1]}月${s[2]}日</span>`;
      return `<div class="flex items-center justify-between bg-white border border-[#D3D6D8] px-5 py-4 rounded-xl shadow-sm animate-fadeIn"><div class="text-[14px] text-[#484545]">${txt}</div><button onclick="window.removeDraftRange('${encodeURIComponent(JSON.stringify(g))}')" class="p-1 opacity-30"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>`;
    }).join('');
    document.getElementById('next-btn').disabled = !(state.draftProject.name && state.draftProject.description && state.draftProject.dates.length > 0);
  };
  window.removeDraftRange = (json) => { const arr = JSON.parse(decodeURIComponent(json)); state.draftProject.dates = state.draftProject.dates.filter(d=>!arr.includes(d)); window.refreshDraftDateList(); };
  container.innerHTML = `<div class="flex flex-col min-h-screen bg-[#FDFBF8]"><header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header><main class="flex-1 px-8 pt-2 pb-12 page-transition flex flex-col"><div class="space-y-6 mb-8 overflow-y-auto pr-1 no-scrollbar"><div><label class="heading-rs block mb-2 pl-1 text-[#484545]">プロジェクト名</label><input type="text" id="p-name" placeholder="プロジェクト名を入力" value="${state.draftProject.name}" class="input-field w-full px-5 py-4 focus:outline-none"></div><div><label class="heading-rs block mb-2 pl-1 text-[#484545]">プロジェクトの説明</label><textarea id="p-desc" placeholder="プロジェクトの説明を入力" rows="4" class="input-field w-full px-5 py-4 focus:outline-none resize-none">${state.draftProject.description}</textarea></div><div class="pt-2 border-t border-[#EBE8E5]"><div class="flex items-center justify-between mb-4"><label class="heading-rs text-[#484545]">開催日時</label><button onclick="window.openCalendarModal('project')" class="flex items-center gap-2 bg-[#EBE8E5] px-4 py-2 rounded-full active:scale-95 transition-transform"><img src="./images/icon/icon-Calender.svg" class="w-5 h-5"><span class="text-[12px] font-bold">日付を追加</span></button></div><div id="selected-dates-list" class="space-y-3"></div></div></div><div class="mt-auto">${Components.Pagination(0)}<div class="space-y-4"><button id="next-btn" class="btn-primary w-full py-4 heading-r font-bold" disabled>次へ</button><button onclick="state.setView('HOME')" class="btn-secondary w-full py-4 heading-r font-bold">キャンセル</button></div></div></main></div>`;
  const ni=document.getElementById('p-name'), di=document.getElementById('p-desc');
  ni.oninput=()=>{state.draftProject.name=ni.value; window.refreshDraftDateList();}; di.oninput=()=>{state.draftProject.description=di.value; window.refreshDraftDateList();};
  document.getElementById('next-btn').onclick=()=>state.setView('CREATE_PROJECT_SEED');
  window.refreshDraftDateList();
}

function renderCreateProjectSeed(container) {
  let sel = state.draftProject.seedType || '';
  container.innerHTML = `<div class="flex flex-col min-h-screen bg-[#FDFBF8]"><header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header><main class="flex-1 px-8 pt-6 pb-12 page-transition flex flex-col items-center"><h2 class="heading-l mb-12 text-[#484545]">種を選択</h2><div class="grid grid-cols-3 gap-6 mb-16 w-full max-w-[320px]">${SEED_TYPES.map(s => `<div onclick="window.selSeed('${s.id}')" id="seed-${s.id}" class="flex flex-col items-center cursor-pointer"><div class="w-20 h-20 rounded-full bg-[#EBE8E5] flex items-center justify-center border-2 ${sel===s.id?'border-[#0CA1E3] scale-110 shadow-md':'border-transparent'}"><img src="${s.path}" class="w-12 h-12 object-contain"></div><span class="text-[11px] mt-2 font-bold text-[#484545]">${s.name}</span></div>`).join('')}</div><div class="mt-auto w-full">${Components.Pagination(1)}<div class="space-y-4"><button id="next-btn" class="btn-primary w-full py-4 heading-r font-bold" ${sel?'':'disabled'}>次へ</button><button onclick="state.setView('CREATE_PROJECT_INFO')" class="btn-secondary w-full py-4 heading-r font-bold">戻る</button></div></div></main></div>`;
  window.selSeed=(id)=>{ sel=id; state.draftProject.seedType=id; renderCreateProjectSeed(container); };
  document.getElementById('next-btn').onclick=()=>state.setView('CREATE_PROJECT_INVITE');
}

function renderCreateProjectInvite(container) {
  const code = state.draftProject.inviteCode || Math.random().toString(36).substring(2,10).toUpperCase();
  state.draftProject.inviteCode = code;
  container.innerHTML = `<div class="flex flex-col min-h-screen bg-[#FDFBF8]"><header class="px-6 py-8 text-center"><h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1></header><main class="flex-1 px-8 pt-6 pb-12 page-transition flex flex-col items-center"><h2 class="heading-l mb-16 text-[#484545]">チームメンバーを招待</h2><div class="text-center space-y-6 mb-12 w-full"><p class="text-rs font-bold text-[#484545]">共有リンク</p><div class="bg-white border border-[#D3D6D8] p-6 rounded-2xl shadow-sm"><p class="heading-m tracking-widest font-mono text-[#484545]">${code}</p></div><button class="text-rs flex items-center justify-center gap-2 mx-auto bg-[#EBE8E5] px-6 py-3 rounded-full"><img src="./images/icon/icon-Link.svg" class="w-5 h-5">共有する</button></div><div class="mt-auto w-full">${Components.Pagination(2)}<div class="space-y-4"><button onclick="state.addProject()" class="btn-primary w-full py-4 heading-r font-bold">プロジェクトを作成</button><button onclick="state.setView('CREATE_PROJECT_SEED')" class="btn-secondary w-full py-4 heading-r font-bold">戻る</button></div></div></main></div>`;
}

function renderMainBoard(container) {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  if (!p) return state.setView('HOME');
  const seed = SEED_TYPES.find(s => s.id === p.seedType);
  
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="state.setView('HOME')" class="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><img src="./images/icon/iocn-Chevron.svg" class="w-4 h-4 brightness-0 opacity-50"></button>
          <div class="flex items-center gap-2"><img src="${seed.path}" class="w-5 h-5"><span class="text-[14px] font-bold truncate max-w-[180px]">${p.name}</span></div>
        </div>
        <button class="p-1"><img src="./images/icon/icon-Setting.svg" class="w-6 h-6"></button>
      </div>

      <div class="px-6 flex border-b border-[#D3D6D8]">
        <div class="flex-1 flex flex-col items-center py-2 border-b-2 border-[#0CA1E3]"><img src="./images/icon/icon-MainBoard-pressed.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold text-[#0CA1E3]">メインボード</span></div>
        <div class="flex-1 flex flex-col items-center py-2 opacity-40"><img src="./images/icon/icon-Ranking.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold">ランキング</span></div>
        <div class="flex-1 flex flex-col items-center py-2 opacity-40"><img src="./images/icon/icon-Archive.svg" class="w-6 h-6 mb-1"><span class="text-[10px] font-bold">アーカイブ</span></div>
      </div>

      <main class="flex-1 px-6 pt-4 pb-36 overflow-y-auto space-y-6 no-scrollbar page-transition">
        <div class="bg-white border border-[#D3D6D8] rounded-xl p-2.5 flex items-center justify-center gap-3 shadow-sm scale-90">
           <img src="./images/icon/icon-Calender.svg" class="w-5 h-5">
           <span class="heading-rs tracking-tight">開催まで残り <span class="text-[20px] font-mono">${p.daysLeft}</span> 日</span>
        </div>

        <div class="flex justify-center -mt-2">
           <div class="relative w-48 h-48 rounded-full border-[10px] border-[#EBE8E5] flex items-center justify-center shadow-inner">
              <div class="w-36 h-36 bg-[#CFD8FF] rounded-full flex items-center justify-center">
                 <img src="${seed.plantPrefix}1.svg" class="w-24 h-28 object-contain mt-2 opacity-80">
              </div>
           </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
           ${p.proposals.map((pr, i) => `
             <div class="bg-white border border-[#D3D6D8] rounded-2xl p-2 shadow-sm flex flex-col h-28">
                <div class="flex items-center justify-between mb-1"><span class="text-[7px] text-black/40 font-bold">提案${i+1}</span>${Components.Tag(pr.tag)}</div>
                <h3 class="text-[9px] font-bold leading-tight flex-1">${pr.title}</h3>
                <button onclick="window.showProposalHelp('${pr.id}')" class="text-right opacity-30"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></button>
             </div>`).join('')}
        </div>

        <section>
           <div class="flex items-center justify-between mb-4"><h2 class="heading-m">ミッション</h2><button class="p-1"><img src="./images/icon/icon-Filter.svg" class="w-6 h-4"></button></div>
           <div class="space-y-3">
              ${p.missions.length === 0 ? '<p class="text-center py-4 text-[#A7AAAC] text-rs">ミッションがありません</p>' : p.missions.map(m => `
                <div class="bg-white border border-[#D3D6D8] rounded-xl p-4 flex flex-col shadow-sm relative animate-fadeIn">
                   <div class="flex items-center gap-3 mb-2">${Components.Tag(m.tag)}<span class="text-[11px] text-black/40 font-bold">残り${m.daysLeft}日</span></div>
                   <h3 class="text-[14px] font-bold text-[#484545] pr-8">${m.title}</h3>
                   <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 p-2 cursor-pointer" onclick="window.toggleMissionMenu(event, '${m.id}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                   </div>
                </div>`).join('')}
           </div>
        </section>
      </main>

      <button onclick="window.openMissionModal()" class="fixed bottom-32 right-6 w-14 h-14 bg-[#0CA1E3] rounded-full shadow-[0_4px_15px_rgba(12,161,227,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform z-40">
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      ${Components.BottomNav('')}
    </div>
  `;
}

// 起動
state.init();
