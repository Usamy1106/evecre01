
// --- 定数定義 ---
const SEED_TYPES = [
  { id: 'jack', path: './images/plants/seed-jack.svg', name: 'ジャック', plantPrefix: './images/plants/plant-jack-' },
  { id: 'baribari', path: './images/plants/seed-baribari.svg', name: 'バリバリ', plantPrefix: './images/plants/plant-baribari-' },
  { id: 'lucky', path: './images/plants/seed-lucky.svg', name: 'ラッキー', plantPrefix: './images/plants/plant-lucky-' }
];

const MISSION_DESCRIPTIONS = {
  'def-1': "目的設定は、「成功の8割」を決める作業です。軸が固まれば、無駄な迷いは消えます。誰に、どんな価値を届けたいのか。私たちの「旗印」を明確にしましょう。",
  'def-2': "タイトルは参加者が最初に触れる、イベントの「第一印象」そのものです。一目で期待感が高まる名前を決定しましょう。\n\nポイント\n・言葉からイメージができるか？\n・リズムが良くキャッチーで、SNSなどでつぶやきやすいか？\n・決めた「目的」と乖離していないか？",
  'def-3': "概要は、目的を具体化し、関係者全員の認識を一致させる基盤です。「いつ、どこで、誰に、何を、どう届けるか（5W1H）」を明確にし、理想を現実に落とし込み、強固な土台を作りましょう。",
  'p1': "イベントをどこで行うか決めましょう。オンラインの場合はツール名を、対面の場合は施設名を入力します。",
  'p2': "SNSやWebサイトなど、参加者が詳細を確認できるURLを準備しましょう。",
  'p3': "イベントの顔となる画像を作成します。テーマカラーやロゴを含めると効果的です。",
  'p4': "イベントの成功を測るための指標を設定します。来場者数、満足度、SNSのシェア数など、具体的に記述しましょう。",
  'p5': "限られたリソースをどこに集中させるか決めます。会場費、広報費、制作費などの概算を出し、優先順位をつけましょう。",
  'p6': "SNSで拡散されやすい独自のタグを決めましょう。イベント名を含めると効果的です。",
  'p7': "当日の流れを時間単位で書き出し、運営メンバーの動きを可視化しましょう。",
  'p8': "配信機材、音響、PC、備品など、当日必要なものをリストアップしましょう。"
};

const PROPOSAL_POOL = [
  { id: 'p1', title: '開催場所を決める', tag: '企画', type: 'plan', format: 'text', priority: 4 },
  { id: 'p2', title: '広報リンクを挿入', tag: '広報', type: 'public', format: 'link', priority: 3 },
  { id: 'p3', title: 'メインビジュアルを作成', tag: '制作', type: 'create', format: 'image', priority: 4 },
  { id: 'p4', title: '数値目標（KPI）を設定する', tag: '企画', type: 'plan', format: 'text', priority: 4 },
  { id: 'p5', title: '予算配分を決める', tag: '運営', type: 'op', format: 'text', priority: 5 },
  { id: 'p6', title: 'SNSハッシュタグを決定', tag: '広報', type: 'public', format: 'text', priority: 3 },
  { id: 'p7', title: '当日のタイムスケジュール', tag: '運営', type: 'op', format: 'text', priority: 5 },
  { id: 'p8', title: '必要な機材リスト作成', tag: '制作', type: 'create', format: 'text', priority: 3 }
];

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
  mainBoardTab: 'MAIN', // MAIN, RANKING, ARCHIVE
  editingMissionId: null,
  draftProject: { name: '', description: '', dates: [], seedType: 'jack' },
  draftMission: {
    title: '', labels: ['企画'], priority: 3, dates: [], clearFormat: 'text', note: ''
  },
  missionModalTab: 'BASIC',
  calendarDate: new Date(),
  missionSortMode: 'createdAt',

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

  // ポイント計算ロジック
  getProjectPoints(project) {
    return project.missions
      .filter(m => m.status === 'cleared')
      .reduce((sum, m) => sum + ((m.priority || 1) * 2), 0);
  },

  // 成長段階計算ロジック (1-10段階)
  getGrowthStage(points) {
    const thresholds = [0, 30, 90, 210, 450, 930, 1890, 3810, 7650, 15330];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (points >= thresholds[i]) return i + 1;
    }
    return 1;
  },

  // 現在のプラント画像パスを取得
  getPlantImagePath(project) {
    const stage = this.getGrowthStage(this.getProjectPoints(project));
    const seed = SEED_TYPES.find(s => s.id === project.seedType);
    return `${seed.plantPrefix}${stage}.svg`;
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
      { id: 'def-1', title: 'イベントの目的を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet', createdAt: Date.now(), priority: 3 },
      { id: 'def-2', title: 'イベントのタイトルを決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet', createdAt: Date.now(), priority: 3 },
      { id: 'def-3', title: 'イベントの概要を決める', tag: '企画', daysLeft: 30, type: 'plan', isDeletable: false, dates: [], clearFormat: 'text', status: 'yet', createdAt: Date.now(), priority: 3 }
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
      proposals: PROPOSAL_POOL.slice(0, 3),
      lastProposalClearedTime: null,
      likes: 0,
      hasLiked: false
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
    
    if (this.selectedProjectId) {
      const p = this.projects.find(x => x.id === this.selectedProjectId);
      if (p && p.proposals.length === 0 && p.lastProposalClearedTime) {
        const hoursDiff = (Date.now() - p.lastProposalClearedTime) / (1000 * 60 * 60);
        if (hoursDiff >= 12) {
          this.refreshProposals(p);
        }
      }
    }

    switch (this.currentView) {
      case 'HOME': renderHome(appEl); break;
      case 'CREATE_PROJECT_INFO': renderCreateProjectInfo(appEl); break;
      case 'CREATE_PROJECT_SEED': renderCreateProjectSeed(appEl); break;
      case 'CREATE_PROJECT_INVITE': renderCreateProjectInvite(appEl); break;
      case 'MAIN_BOARD': renderMainBoard(appEl); break;
    }
  },

  refreshProposals(p) {
    const usedIds = p.missions.map(m => m.originProposalId).filter(id => id);
    const available = PROPOSAL_POOL.filter(pr => !usedIds.includes(pr.id));
    const shuffled = available.sort(() => 0.5 - Math.random());
    p.proposals = shuffled.slice(0, 3);
    p.lastProposalClearedTime = null;
    this.save();
  }
};

window.state = state;

// --- 並び替えロジック ---
function getSortedMissions(missions) {
  return [...missions].sort((a, b) => {
    if (state.missionSortMode === 'priority') return (b.priority || 0) - (a.priority || 0);
    if (state.missionSortMode === 'deadline') {
      const dateA = a.dates && a.dates.length > 0 ? new Date(a.dates[0]).getTime() : Infinity;
      const dateB = b.dates && b.dates.length > 0 ? new Date(b.dates[0]).getTime() : Infinity;
      return dateA - dateB;
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

// --- アーカイブ直接編集 ---
window.editArchiveItem = (type) => {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  let missionId = '';
  let currentVal = '';
  let format = 'text';
  let titleLabel = '';

  if (type === 'title') { missionId = 'def-2'; currentVal = p.clearedData['def-2']?.content || p.name; titleLabel = 'タイトル'; }
  else if (type === 'summary') { missionId = 'def-3'; currentVal = p.clearedData['def-3']?.content || p.description; titleLabel = '概要'; }
  else if (type === 'url') { 
    const m = p.missions.find(x => x.title === '広報リンクを挿入');
    missionId = m?.id || 'url-temp';
    currentVal = p.clearedData[missionId]?.content || '';
    format = 'link';
    titleLabel = 'URL';
  } else if (type === 'venue') {
    const m = p.missions.find(x => x.title === '開催場所を決める');
    missionId = m?.id || 'venue-temp';
    currentVal = p.clearedData[missionId]?.content || '';
    titleLabel = '場所';
  } else if (type === 'period') {
    missionId = 'period-temp';
    currentVal = p.clearedData['period-temp']?.content || (p.dates.length > 0 ? `${p.dates[0]} 〜 ${p.dates[p.dates.length-1]}` : '');
    titleLabel = '期間';
  } else if (type === 'image') {
    const m = p.missions.find(x => x.title === 'メインビジュアルを作成');
    missionId = m?.id || 'image-temp';
    window.openClearMissionModal(missionId, 'image');
    return;
  }

  window.openEditModal(titleLabel, currentVal, format, (newVal) => {
    let m = p.missions.find(x => x.id === missionId);
    if (!m) {
      m = {
        id: missionId,
        title: type === 'url' ? '広報リンクを挿入' : type === 'venue' ? '開催場所を決める' : type === 'period' ? '開催日時' : type,
        tag: type === 'url' ? '広報' : '企画',
        clearFormat: format,
        status: 'cleared',
        dates: [],
        daysLeft: 7,
        isDeletable: (missionId.startsWith('def-') || type === 'url' || type === 'venue') ? false : true,
        createdAt: Date.now(),
        priority: 3
      };
      p.missions.push(m);
    } else {
      m.status = 'cleared';
    }

    p.clearedData[missionId] = { content: newVal, timestamp: Date.now(), title: m.title, format: format };
    state.save();
    state.render();
  });
};

window.openEditModal = (title, currentVal, format, onSave) => {
  const overlay = document.createElement('div');
  overlay.id = 'edit-archive-modal';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 page-transition';
  
  let inputHtml = '';
  if (format === 'text' || title === '概要' || title === '期間') {
    inputHtml = `<textarea id="edit-input" class="w-full h-40 p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="内容を入力してください">${currentVal}</textarea>`;
  } else if (format === 'link') {
    inputHtml = `<input type="url" id="edit-input" class="w-full p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="https://..." value="${currentVal}">`;
  } else {
    inputHtml = `<input type="text" id="edit-input" class="w-full p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="内容を入力してください" value="${currentVal}">`;
  }

  overlay.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-sm:w-[90%] max-w-sm p-8 shadow-2xl relative animate-fadeIn">
      <button onclick="document.getElementById('edit-archive-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <h3 class="heading-m text-[#484545] mb-6 pr-6">${title}の編集</h3>
      ${inputHtml}
      <button id="save-edit-btn" class="btn-primary w-full py-4 mt-8 heading-r font-bold">保存する</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('save-edit-btn').onclick = () => {
    const val = document.getElementById('edit-input').value;
    if (val !== null) onSave(val);
    overlay.remove();
  };
};

// --- インバイト機能 ---
window.copyInviteCode = (code) => {
  navigator.clipboard.writeText(code).then(() => {
    alert('招待コードをコピーしました！');
  }).catch(() => {
    alert('コピーに失敗しました。直接メモしてください: ' + code);
  });
};

window.shareInvite = (code) => {
  const shareData = {
    title: 'イベントチームへの招待',
    text: `一緒にイベントを作りましょう！招待コード: ${code}`,
  };
  
  try {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith('http')) {
      shareData.url = currentUrl;
    }
  } catch (e) {}

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    navigator.share(shareData).catch(err => {
      if (err.name !== 'AbortError') {
        window.copyInviteCode(code);
      }
    });
  } else {
    window.copyInviteCode(code);
  }
};

window.showProjectInviteModal = (code) => {
  const overlay = document.createElement('div');
  overlay.id = 'project-invite-modal';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 page-transition';
  overlay.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-sm:w-[95%] max-w-sm p-8 shadow-2xl relative animate-fadeIn">
      <button onclick="document.getElementById('project-invite-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <h2 class="heading-m text-[#484545] mb-8 text-center font-bold">メンバーを招待</h2>
      <div onclick="window.copyInviteCode('${code}')" class="bg-[#FDFBF8] border border-[#D3D6D8] p-6 rounded-2xl shadow-sm cursor-pointer active:bg-gray-100 transition-colors mb-6 text-center">
        <p class="text-[11px] text-[#A7AAAC] font-bold mb-2">タップしてコードをコピー</p>
        <p class="heading-m tracking-[0.3em] font-mono text-[#484545]">${code}</p>
      </div>
      <button onclick="window.shareInvite('${code}')" class="flex items-center justify-center gap-3 w-full bg-[#0CA1E3] text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform mb-4">
        <img src="./images/icon/icon-Link-white.svg" class="w-6 h-6">招待リンクを送る
      </button>
      <button onclick="document.getElementById('project-invite-modal').remove()" class="w-full py-3 text-rs font-bold text-[#A7AAAC]">閉じる</button>
    </div>
  `;
  document.body.appendChild(overlay);
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
  if (!m) {
     m = { id: missionId, title: 'ミッション', tag: '企画', clearFormat: 'text', status: 'yet', dates: [], daysLeft: 7, createdAt: Date.now(), priority: 3, isDeletable: true };
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
  const title = m ? m.title : 'ミッション';
  const format = overrideFormat || (m ? m.clearFormat : 'text');
  const desc = MISSION_DESCRIPTIONS[missionId] || (m && m.originProposalId ? MISSION_DESCRIPTIONS[m.originProposalId] : "ミッションをクリアしてプロジェクトを進めましょう。");

  const overlay = document.createElement('div');
  overlay.id = 'clear-mission-modal';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 page-transition';
  let inputHtml = '';
  if (format === 'text') {
    inputHtml = `<textarea id="clear-input" class="w-full h-40 p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="内容を入力してください"></textarea>`;
  } else if (format === 'image') {
    inputHtml = `<div class="w-full aspect-video bg-[#EBE8E5] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#A7AAAC] cursor-pointer" onclick="document.getElementById('file-input').click()"><img id="preview-img" class="hidden w-full h-full object-cover rounded-2xl"><div id="upload-placeholder" class="text-center"><img src="./images/icon/icon-image.svg" class="w-12 h-12 mx-auto mb-2 opacity-40"><p class="text-rs text-[#A7AAAC] font-bold">画像をアップロード</p></div><input type="file" id="file-input" class="hidden" accept="image/*" onchange="window.handleImageSelect(this)"></div>`;
  } else {
    inputHtml = `<input type="url" id="clear-input" class="w-full p-4 rounded-2xl bg-[#EBE8E5] focus:outline-none text-r" placeholder="https://...">`;
  }
  overlay.innerHTML = `<div class="bg-white rounded-3xl w-full max-sm:w-[90%] max-w-sm p-8 shadow-2xl relative animate-fadeIn"><button onclick="document.getElementById('clear-mission-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><h3 class="heading-m text-[#484545] mb-2 pr-6">${title}</h3><p class="text-rs text-[#A7AAAC] mb-6 font-bold whitespace-pre-wrap">${desc}</p>${inputHtml}<button onclick="window.submitMissionClear('${missionId}')" class="btn-primary w-full py-4 mt-8 heading-r font-bold">クリアする</button></div>`;
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
    const isSelected = currentTargetDates.includes(dateStr), isEventDate = eventDates.includes(dateStr), hasMission = missionDeadlines.includes(dateStr);
    daysHtml += `<div onclick="window.toggleDate('${dateStr}', '${target}')" class="relative h-10 w-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all text-rs font-bold ${isSelected ? 'bg-[#0CA1E3] text-white shadow-md' : (isEventDate ? 'bg-[#CFD8FF] text-[#484545]' : 'bg-white text-[#484545]')}" > ${d} ${hasMission ? '<div class="absolute bottom-1 w-1 h-1 bg-[#EE3E12] rounded-full"></div>' : ''} </div>`;
  }
  modal.innerHTML = `<div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn"><div class="flex items-center justify-between mb-6"><h3 class="heading-r text-[#484545] font-bold">${year}年 ${month+1}月</h3><div class="flex gap-2"><button onclick="window.moveCalendarMonth(-1, '${target}')" class="p-2 bg-[#FDFBF8] rounded-full"><img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 brightness-0 opacity-50"></button><button onclick="window.moveCalendarMonth(1, '${target}')" class="p-2 bg-[#FDFBF8] rounded-full"><img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 rotate-180 brightness-0 opacity-50"></button></div></div><div class="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] text-[#A7AAAC] font-bold"><div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div></div><div class="grid grid-cols-7 gap-1 mb-8">${daysHtml}</div><button onclick="document.getElementById('calendar-modal').remove()" class="btn-primary w-full py-3 heading-rs font-bold">決定</button></div>`;
}

window.moveCalendarMonth = (offset, target) => { state.calendarDate.setMonth(state.calendarDate.getMonth() + offset); renderCalendarInner(target); };
window.toggleDate = (dateStr, target) => {
  if (target === 'view') return; 
  let dates = target === 'project' ? state.draftProject.dates : state.draftMission.dates;
  
  if (target === 'mission') {
    // ミッション期限は1日のみ。選択済みなら解除、未選択ならそれ以外を消して追加
    const idx = dates.indexOf(dateStr);
    if (idx > -1) {
      dates.splice(0, dates.length);
    } else {
      dates.splice(0, dates.length);
      dates.push(dateStr);
    }
  } else {
    // プロジェクト開催日は複数可
    const idx = dates.indexOf(dateStr);
    if (idx > -1) dates.splice(idx, 1); else dates.push(dateStr);
  }
  
  dates.sort();
  renderCalendarInner(target);
  if (target === 'project') state.render(); else window.renderMissionModalContent();
};

// --- ミッション ---
window.openMissionModal = (missionId = null) => {
  state.editingMissionId = missionId;
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (missionId && project) {
    const m = project.missions.find(x => x.id === missionId);
    state.draftMission = { ...m, dates: [...(m.dates || [])], labels: [m.tag] };
  } else {
    state.draftMission = { title: '', labels: ['企画'], priority: 3, dates: [], clearFormat: 'text', note: '' };
  }
  state.missionModalTab = 'BASIC';
  let overlay = document.getElementById('mission-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'mission-overlay';
  overlay.className = 'fixed inset-0 bg-black/40 z-[100] flex items-end justify-center page-transition';
  overlay.onclick = (e) => { if(e.target === overlay) window.closeMissionModal(); };
  overlay.innerHTML = `<div id="mission-panel" class="bg-white w-full max-w-md rounded-t-[40px] p-6 shadow-2xl transition-transform transform translate-y-full" style="height: 95vh;"><div class="w-12 h-1.5 bg-[#E1DFDC] rounded-full mx-auto mb-4"></div><h2 class="text-[17px] font-bold text-center text-[#484545] mb-4" id="mission-modal-title"></h2><div id="mission-modal-content" class="h-full pb-10"></div></div>`;
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

window.deleteMission = (e) => {
  if (e) e.stopPropagation();
  if (!state.editingMissionId) return;
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  const m = project.missions.find(x => x.id === state.editingMissionId);
  if (m && !m.isDeletable) return alert('初期フローのミッションは削除できません');
  
  if (confirm('本当にこのミッションを削除しますか？')) {
    project.missions = project.missions.filter(x => x.id !== state.editingMissionId);
    state.save();
    window.closeMissionModal();
    state.render();
  }
};

window.renderMissionModalContent = function() {
  const container = document.getElementById('mission-modal-content'), titleEl = document.getElementById('mission-modal-title');
  if (!container || !titleEl) return;
  const isEdit = state.editingMissionId !== null, isBasic = state.missionModalTab === 'BASIC';
  titleEl.innerText = isEdit ? 'ミッションを編集' : '新規ミッションを作成';
  let dateDisplay = state.draftMission.dates.length > 0 ? `<div class="bg-[#EBE8E5] px-3 py-1.5 rounded-lg text-[#484545] font-bold text-rs">${state.draftMission.dates[0]}</div>` : 'カレンダーから設定する';
  
  const renderBasic = () => `
    <div class="flex flex-col h-full">
      <div class="flex justify-center gap-10 mb-6">
        <button onclick="window.setMissionTab('BASIC')" class="text-[14px] font-bold pb-1 border-b-2 ${isBasic ? 'border-[#0CA1E3] text-[#0CA1E3]' : 'border-transparent text-[#A7AAAC]'}">基本設定</button>
        <button onclick="window.setMissionTab('DETAIL')" class="text-[14px] font-bold pb-1 border-b-2 ${!isBasic ? 'border-[#9EDF05] text-[#9EDF05]' : 'border-transparent text-[#A7AAAC]'}">詳細設定</button>
      </div>
      <div class="space-y-4 flex-1">
        <div>
          <label class="heading-rs block mb-1 text-[#484545]">ミッション</label>
          <input type="text" id="mission-title-input" placeholder="ミッションを入力" value="${state.draftMission.title}" oninput="state.draftMission.title=this.value; this.style.borderColor=''" class="input-field w-full px-4 py-3 focus:outline-none border-2 border-transparent transition-colors">
          <p id="error-title" class="hidden text-[10px] font-bold mt-1" style="color: #e8383d;">※ミッション名は入力必須です</p>
        </div>
        <div><div class="flex items-center gap-2 mb-1"><label class="heading-rs text-[#484545]">ラベル</label><button class="w-5 h-5 border border-[#A7AAAC] rounded-full flex items-center justify-center text-[#A7AAAC] text-sm">+</button></div><div class="flex gap-2">${['企画','運営','制作','広報'].map(l => { const sel = state.draftMission.labels.includes(l), conf = LABEL_CONFIG[l]; return `<button onclick="window.toggleMissionLabel('${l}')" class="px-4 py-1 rounded-full border text-[12px] font-bold transition-all ${sel ? `${conf.border} ${conf.text} ${conf.bg}` : 'border-[#D3D6D8] text-[#A7AAAC]'}">${l}</button>`; }).join('')}</div></div>
        <div><label class="heading-rs block mb-1 text-[#484545]">優先度</label><div class="flex gap-1">${[1,2,3,4,5].map(v => `<button onclick="state.draftMission.priority=${v};window.renderMissionModalContent()" class="p-0.5"><svg width="32" height="32" viewBox="0 0 24 24" fill="${state.draftMission.priority >= v ? '#FFC300' : 'none'}" stroke="${state.draftMission.priority >= v ? '#FFC300' : '#E1DFDC'}" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>`).join('')}</div></div>
        <div><label class="heading-rs block mb-1 text-[#484545]">期限</label><div class="flex items-center gap-2 mb-2 cursor-pointer" onclick="window.openCalendarModal('mission')"><img src="./images/icon/icon-Calender.svg" class="w-4 h-4 opacity-40"><span class="text-[12px] text-[#A7AAAC] font-bold">${dateDisplay}</span></div></div>
        <div><label class="heading-rs block mb-3 text-[#484545]">形式</label><div class="flex justify-around">${['text', 'image', 'link'].map(f => `<div onclick="state.draftMission.clearFormat='${f}';window.renderMissionModalContent()" class="flex flex-col items-center gap-1.5 cursor-pointer"><div class="w-12 h-12 border-2 rounded-lg flex items-center justify-center ${state.draftMission.clearFormat===f ? 'border-[#0CA1E3]' : 'border-[#A7AAAC]'}"><img src="./images/icon/icon-${f==='text'?'TextBox':f==='image'?'image':'Link'}.svg" class="w-6 h-6"></div><span class="text-[9px] font-bold">${f==='text'?'テキスト':f==='image'?'画像':'リンク'}形式</span></div>`).join('')}</div></div>
      </div>
      <button onclick="window.createOrUpdateMission()" class="btn-primary w-full py-4 heading-r font-bold mt-4 shadow-lg shadow-blue-200">${isEdit ? '保存' : '作成'}</button>
    </div>
  `;
  
  const renderDetail = () => `
    <div class="flex flex-col h-full">
      <div class="flex justify-center gap-10 mb-6">
        <button onclick="window.setMissionTab('BASIC')" class="text-[14px] font-bold pb-1 border-b-2 border-transparent text-[#A7AAAC]">基本設定</button>
        <button onclick="window.setMissionTab('DETAIL')" class="text-[14px] font-bold pb-1 border-b-2 border-[#9EDF05] text-[#9EDF05]">詳細設定</button>
      </div>
      <div class="space-y-6 flex-1">
        ${isEdit && state.draftMission.isDeletable !== false ? `
          <button onclick="window.deleteMission(event)" class="w-full flex items-center justify-between p-4 bg-[#FFEEEA] text-[#EE3E12] rounded-2xl border border-[#EE3E12]/20 active:scale-95 transition-transform">
             <span class="font-bold">このミッションを削除する</span>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        ` : `
          <div class="p-10 text-center text-[#A7AAAC] text-rs">このミッションは詳細設定を変更できません</div>
        `}
      </div>
    </div>
  `;

  container.innerHTML = isBasic ? renderBasic() : renderDetail();
};

window.setMissionTab = (tab) => { state.missionModalTab = tab; window.renderMissionModalContent(); };
window.toggleMissionLabel = (l) => { state.draftMission.labels = [l]; window.renderMissionModalContent(); };

window.createOrUpdateMission = () => {
  const titleInput = document.getElementById('mission-title-input');
  const errorText = document.getElementById('error-title');
  
  if (!state.draftMission.title) {
    if (titleInput) titleInput.style.borderColor = '#e8383d';
    if (errorText) errorText.classList.remove('hidden');
    return;
  }
  
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (state.editingMissionId) {
    const idx = project.missions.findIndex(m => m.id === state.editingMissionId);
    if (idx > -1) {
      project.missions[idx] = { 
        ...project.missions[idx], 
        title: state.draftMission.title, 
        tag: state.draftMission.labels[0], 
        dates: [...state.draftMission.dates], 
        clearFormat: state.draftMission.clearFormat, 
        priority: state.draftMission.priority 
      };
    }
  } else {
    project.missions.push({ 
      id: Date.now().toString(), 
      title: state.draftMission.title, 
      tag: state.draftMission.labels[0], 
      daysLeft: 7, 
      dates: [...state.draftMission.dates], 
      clearFormat: state.draftMission.clearFormat, 
      status: 'yet', 
      isDeletable: true, 
      createdAt: Date.now(), 
      priority: state.draftMission.priority 
    });
  }
  state.save(); window.closeMissionModal(); state.render();
};

window.addProposalToMission = (pid) => {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  const pr = project.proposals.find(x => x.id === pid);
  if (!pr) return;

  project.missions.push({ 
    id: Date.now().toString(), 
    originProposalId: pr.id,
    title: pr.title, 
    tag: pr.tag, 
    daysLeft: 7, 
    dates: [], 
    clearFormat: pr.format, 
    status: 'yet', 
    isDeletable: true, 
    createdAt: Date.now(), 
    priority: pr.priority 
  });

  project.proposals = project.proposals.filter(x => x.id !== pid);
  if (project.proposals.length === 0) {
    project.lastProposalClearedTime = Date.now();
  }
  
  state.save(); 
  state.render();
};

window.showProposalHelp = (e, pid) => {
  e.stopPropagation();
  const desc = MISSION_DESCRIPTIONS[pid] || "ミッションをクリアしてプロジェクトを進めましょう。";
  
  const overlay = document.createElement('div');
  overlay.id = 'help-modal';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 page-transition';
  overlay.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-sm:w-[90%] max-w-sm p-8 shadow-2xl relative animate-fadeIn">
      <button onclick="document.getElementById('help-modal').remove()" class="absolute top-4 right-4 p-2 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="flex items-center gap-3 mb-4">
        <img src="./images/icon/icon-Help.svg" class="w-6 h-6">
        <h3 class="heading-m text-[#484545]">提案のヒント</h3>
      </div>
      <div class="bg-[#FDFBF8] p-5 rounded-2xl border border-[#D3D6D8]">
        <p class="text-rs text-[#484545] font-bold leading-relaxed whitespace-pre-wrap">${desc}</p>
      </div>
      <button onclick="document.getElementById('help-modal').remove()" class="btn-primary w-full py-4 mt-8 heading-r font-bold">わかった</button>
    </div>
  `;
  document.body.appendChild(overlay);
};

window.toggleMissionMenu = (e, missionId) => {
  e.stopPropagation();
  const existingMenu = document.getElementById('mission-menu');
  if (existingMenu) { 
    const same = existingMenu.dataset.mid === missionId;
    existingMenu.remove(); 
    if (same) return; 
  }
  const menu = document.createElement('div');
  menu.id = 'mission-menu'; menu.dataset.mid = missionId;
  menu.className = 'absolute right-4 top-10 bg-white border border-[#D3D6D8] rounded-xl shadow-xl z-[60] overflow-hidden min-w-[100px] animate-fadeIn';
  menu.innerHTML = `<button onclick="event.stopPropagation(); window.openMissionModal('${missionId}')" class="w-full text-left px-4 py-3 hover:bg-[#FDFBF8] text-rs font-bold border-b border-[#FDFBF8]">編集</button>`;
  e.currentTarget.parentElement.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
};

window.toggleSortMenu = (e) => {
  e.stopPropagation();
  const existingMenu = document.getElementById('sort-menu');
  if (existingMenu) { existingMenu.remove(); return; }
  
  const menu = document.createElement('div');
  menu.id = 'sort-menu';
  menu.className = 'absolute right-0 top-10 bg-white border border-[#D3D6D8] rounded-2xl shadow-xl z-[60] overflow-hidden min-w-[140px] animate-fadeIn';
  const modes = [
    {id: 'createdAt', label: '制作日順'},
    {id: 'deadline', label: '締切順'},
    {id: 'priority', label: '優先度順'}
  ];
  menu.innerHTML = modes.map(m => `
    <button onclick="window.changeMissionSort('${m.id}')" class="w-full text-left px-5 py-4 hover:bg-[#FDFBF8] text-rs font-bold border-b border-[#FDFBF8] flex items-center justify-between">
      ${m.label} ${state.missionSortMode === m.id ? '<span class="text-[#0CA1E3]">●</span>' : ''}
    </button>
  `).join('');
  e.currentTarget.parentElement.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
};

window.showMissionListModal = () => {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  const overlay = document.createElement('div');
  overlay.id = 'mission-list-modal';
  overlay.className = 'fixed inset-0 bg-black/60 z-[150] flex items-end justify-center page-transition';
  overlay.innerHTML = `<div class="bg-white w-full max-w-md rounded-t-[40px] p-6 shadow-2xl h-[80vh] overflow-y-auto animate-fadeIn"><div class="flex items-center justify-between mb-8"><h2 class="heading-m text-[#484545]">ミッション一覧</h2><button onclick="document.getElementById('mission-list-modal').remove()" class="p-2 opacity-40"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div class="space-y-4">${p.missions.map(m => { const cleared = p.clearedData[m.id]; return `<div class="bg-[#FDFBF8] border border-[#D3D6D8] rounded-2xl p-5"><div class="flex items-center gap-2 mb-2">${Components.Tag(m.tag)}${m.status==='cleared'?'<span class="text-[8px] text-[#9EDF05] font-bold border border-[#9EDF05] px-1 rounded ml-1">CLEAR</span>':''}</div><h3 class="text-r font-bold text-[#484545] mb-2">${m.title}</h3>${cleared ? `<div class="mt-3 pt-3 border-t border-[#EBE8E5]"><p class="text-[10px] text-[#A7AAAC] font-bold mb-1">提出内容</p>${cleared.format === 'image' ? `<img src="${cleared.content}" class="w-full h-32 object-cover rounded-xl mt-1 shadow-inner">` : `<p class="text-rs text-[#484545] bg-white p-3 rounded-lg border border-[#EBE8E5] break-words">${cleared.content}</p>`}</div>` : `<p class="text-[10px] text-[#A7AAAC]">未提出</p>`}</div>`; }).join('')}</div></div>`;
  document.body.appendChild(overlay);
};

window.handleGoodClick = (e) => {
  if (e) e.stopPropagation();
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  if (p && !p.hasLiked) {
    p.likes = (p.likes || 0) + 1;
    p.hasLiked = true;
    state.save();
    state.render();
  }
};

// --- UIコンポーネント ---
const Components = {
  Header: (p) => {
    if (!p) {
      return `<header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20"><div class="flex-1"></div><button onclick="state.setView('CREATE_PROJECT_INFO')" class="flex items-center gap-2 border border-[#0CA1E3] text-[#0CA1E3] px-5 py-2 rounded-xl bg-white shadow-sm active:scale-95 transition-transform"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span class="heading-r font-bold">作成</span></button></header>`;
    }
    const currentPlant = state.getPlantImagePath(p);
    return `<header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8]"><div class="flex items-center gap-3"><button onclick="state.setView('HOME')" class="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><img src="./images/icon/iocn-Chevron.svg" class="w-4 h-4 brightness-0 opacity-50"></button><div class="flex items-center gap-2"><img src="${currentPlant}" class="w-5 h-5 object-contain"><span class="text-[14px] font-bold truncate max-w-[180px]">${p.name}</span></div></div><button class="p-1"><img src="./images/icon/icon-Setting.svg" class="w-6 h-6"></button></header>`;
  },
  Tabs: (active) => `
    <div class="px-6 flex border-b border-[#D3D6D8] bg-[#FDFBF8]">
      <div onclick="state.mainBoardTab='MAIN';state.render()" class="flex-1 flex flex-row items-center justify-center gap-2 py-3 cursor-pointer ${active==='MAIN'?'border-b-2 border-[#0CA1E3]':'opacity-40'}"><img src="./images/icon/icon-MainBoard${active==='MAIN'?'-pressed':''}.svg" class="w-5 h-5"><span class="text-[11px] font-bold ${active==='MAIN'?'text-[#0CA1E3]':''}">メインボード</span></div>
      <div onclick="state.mainBoardTab='RANKING';state.render()" class="flex-1 flex flex-row items-center justify-center gap-2 py-3 cursor-pointer ${active==='RANKING'?'border-b-2 border-[#EE3E12]':'opacity-40'}"><img src="./images/icon/icon-Ranking${active==='RANKING'?'-pressed':''}.svg" class="w-5 h-5"><span class="text-[11px] font-bold ${active==='RANKING'?'text-[#EE3E12]':''}">ランキング</span></div>
      <div onclick="state.mainBoardTab='ARCHIVE';state.render()" class="flex-1 flex flex-row items-center justify-center gap-2 py-3 cursor-pointer ${active==='ARCHIVE'?'border-b-2 border-[#FFC300]':'opacity-40'}"><img src="./images/icon/icon-Archive${active==='ARCHIVE'?'-pressed':''}.svg" class="w-5 h-5"><span class="text-[11px] font-bold ${active==='ARCHIVE'?'text-[#FFC300]':''}">アーカイブ</span></div>
    </div>
  `,
  Tag: (text) => {
    const conf = LABEL_CONFIG[text] || { color: '#484545' };
    return `<span class="px-1.5 py-0.5 rounded text-[8px] text-white font-bold" style="background-color: ${conf.color}">${text}</span>`;
  },
  PenIcon: (type) => `<button onclick="window.editArchiveItem('${type}')" class="p-1 opacity-60 hover:opacity-100 transition-opacity"><img src="./images/icon/%20icon-Pen.svg" class="w-4 h-4"></button>`,
  StepIndicator: (step) => `
    <div class="flex items-center justify-center gap-3 mb-10">
      <div class="w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step === 1 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
      <div class="w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
      <div class="w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step === 3 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
    </div>
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
        ${row.map(p => {
          const currentPlant = state.getPlantImagePath(p);
          return `<div class="flex flex-col items-center cursor-pointer group" onclick="state.setView('MAIN_BOARD', '${p.id}')">
            <span class="text-[10px] text-[#484545] mb-2 truncate w-full text-center px-1 font-bold">${p.name}</span>
            <div class="h-24 w-full flex items-end justify-center mb-1">
              <img src="${currentPlant}" class="max-h-full max-w-full object-contain block h-full">
            </div>
          </div>`;
        }).join('')}
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
      <header class="px-6 pt-10 pb-8 text-center">
        <h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-2 pb-12 flex flex-col page-transition items-center">
        <div class="w-full space-y-6 mb-12">
          <div><label class="heading-rs block mb-2 text-[#484545]">プロジェクト名</label><input type="text" placeholder="プロジェクト名を入力" value="${state.draftProject.name}" oninput="window.updateDraftInfo('name', this.value)" class="input-field w-full px-5 py-4 focus:outline-none"></div>
          <div><label class="heading-rs block mb-2 text-[#484545]">プロジェクトの説明</label><textarea placeholder="プロジェクトの説明を入力" rows="4" oninput="window.updateDraftInfo('description', this.value)" class="input-field w-full px-5 py-4 focus:outline-none resize-none">${state.draftProject.description}</textarea></div>
          <div class="pt-2 border-t border-[#EBE8E5]">
            <div class="flex items-center justify-between mb-4"><label class="heading-rs text-[#484545]">開催日時</label><button onclick="window.openCalendarModal('project')" class="bg-[#EBE8E5] px-4 py-2 rounded-full font-bold text-[12px]">日付を追加</button></div>
            <div class="space-y-3">${dateListHtml}</div>
          </div>
        </div>
        <div class="mt-auto w-full max-w-sm space-y-3">
          ${Components.StepIndicator(1)}
          <button id="next-btn" onclick="state.setView('CREATE_PROJECT_SEED')" class="btn-primary w-full py-5 heading-m font-bold shadow-lg" ${canNext ? '' : 'disabled'}>次へ</button>
          <button onclick="state.setView('HOME')" class="btn-secondary w-full py-4 heading-m font-bold text-[#484545]">戻る</button>
        </div>
      </main>
    </div>`;
}

function renderCreateProjectSeed(container) {
  let sel = state.draftProject.seedType || '';
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 pt-10 pb-8 text-center">
        <h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-2 pb-12 flex flex-col items-center page-transition">
        <h2 class="heading-m mb-12 text-[#484545] font-bold">種を選択</h2>
        <div class="grid grid-cols-3 gap-6 mb-16 w-full max-w-[320px]">
          ${SEED_TYPES.map(s => `<div onclick="state.draftProject.seedType='${s.id}';state.render()" class="flex flex-col items-center cursor-pointer">
            <div class="w-20 h-20 rounded-full bg-[#EBE8E5] flex items-center justify-center border-2 ${sel===s.id?'border-[#0CA1E3] scale-110 shadow-md bg-white':'border-transparent'}">
              <img src="${s.path}" class="w-12 h-12">
            </div>
          </div>`).join('')}
        </div>
        <div class="mt-auto w-full max-w-sm space-y-3">
          ${Components.StepIndicator(2)}
          <button onclick="state.setView('CREATE_PROJECT_INVITE')" class="btn-primary w-full py-5 heading-m font-bold shadow-lg" ${sel?'':'disabled'}>次へ</button>
          <button onclick="state.setView('CREATE_PROJECT_INFO')" class="btn-secondary w-full py-4 heading-m font-bold text-[#484545]">戻る</button>
        </div>
      </main>
    </div>`;
}

function renderCreateProjectInvite(container) {
  const code = state.draftProject.inviteCode || Math.random().toString(36).substring(2,10).toUpperCase();
  state.draftProject.inviteCode = code;
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 pt-10 pb-8 text-center">
        <h1 class="heading-l text-[#0CA1E3]">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-2 pb-12 flex flex-col items-center page-transition">
        <h2 class="heading-m mb-12 text-[#484545] font-bold">チームメンバーを招待</h2>
        <div class="text-center space-y-6 mb-12 w-full max-w-sm">
          <div onclick="window.copyInviteCode('${code}')" class="bg-white border border-[#D3D6D8] p-8 rounded-2xl shadow-sm cursor-pointer active:bg-[#FDFBF8] transition-colors">
            <p class="text-[11px] text-[#A7AAAC] font-bold mb-3 text-center">タップしてコードをコピー</p>
            <p class="text-[22px] tracking-[0.3em] font-mono text-[#484545] text-center font-bold">${code}</p>
          </div>
          <button onclick="window.shareInvite('${code}')" class="flex items-center justify-center gap-3 mx-auto bg-[#0CA1E3] text-white px-10 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform">
            <img src="./images/icon/icon-Link-white.svg" class="w-5 h-5">招待リンクを送る
          </button>
        </div>
        <div class="mt-auto w-full max-w-sm space-y-3">
          ${Components.StepIndicator(3)}
          <button onclick="state.addProject()" class="btn-primary w-full py-5 heading-m font-bold shadow-lg">プロジェクトを作成</button>
          <button onclick="state.setView('CREATE_PROJECT_SEED')" class="btn-secondary w-full py-4 heading-m font-bold text-[#484545]">戻る</button>
        </div>
      </main>
    </div>`;
}

window.changeMissionSort = (mode) => {
  state.missionSortMode = mode;
  state.render();
};

function renderMainBoard(container) {
  const p = state.projects.find(x => x.id === state.selectedProjectId);
  if (!p) return state.setView('HOME');
  const currentPlant = state.getPlantImagePath(p);

  const renderArchive = () => {
    const title = p.clearedData['def-2']?.content || '未設定', summary = p.clearedData['def-3']?.content || '未設定';
    const mainVisual = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].title==='メインビジュアルを作成' || p.clearedData[k].title==='image')]?.content;
    const url = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].format==='link' || p.clearedData[k].title==='url')]?.content || '未設定';
    const venue = p.clearedData[Object.keys(p.clearedData).find(k => p.clearedData[k].title==='開催場所を決める' || p.clearedData[k].title==='venue')]?.content || '未設定';
    const period = p.clearedData['period-temp']?.content || (p.dates.length > 0 ? `${p.dates[0]} 〜 ${p.dates[p.dates.length-1]}` : '未設定');
    
    return `
      <div class="pb-20 page-transition space-y-6">
        <div class="px-6 pt-6 flex items-center justify-between">
          <div class="flex items-center gap-2 bg-white border border-[#D3D6D8] rounded-full px-3 py-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer" onclick="window.openCalendarModal('view')">
            <img src="./images/icon/icon-Calender.svg" class="w-3.5 h-3.5">
            <span class="text-[11px] font-bold text-[#484545]">残り <span class="text-[15px] font-mono">${p.daysLeft}</span> 日</span>
          </div>
          <button onclick="window.handleGoodClick(event)" class="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all active:scale-90 ${p.hasLiked ? 'border-[#EE3E12] bg-[#EE3E12]/5' : 'border-[#D3D6D8] bg-white'}">
            <img src="./images/icon/icon-Good${p.hasLiked ? '-pressed' : ''}.svg" class="w-6 h-6">
            <span class="text-rs font-bold font-mono ${p.hasLiked ? 'text-[#EE3E12]' : 'text-[#A7AAAC]'}">${p.likes || 0}</span>
          </button>
        </div>

        <div class="relative group w-full aspect-[2/1] overflow-hidden bg-[#EBE8E5] flex items-center justify-center shadow-inner">
          ${mainVisual ? `<img src="${mainVisual}" class="w-full h-full object-cover">` : `<img src="./images/icon/icon-image.svg" class="w-12 h-12 opacity-20">`}
          <div class="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-lg">
            ${Components.PenIcon('image')}
          </div>
        </div>

        <div class="px-6 space-y-8">
          <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-1">
              <h2 class="text-[18px] font-bold text-[#484545] leading-snug">「${title}」</h2>
              ${Components.PenIcon('title')}
            </div>
          </div>
          <div class="space-y-6">
            <section>
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-[12px] font-bold text-[#A7AAAC]">概要</h3>
                ${Components.PenIcon('summary')}
              </div>
              <p class="text-[13px] text-[#484545] leading-relaxed whitespace-pre-wrap font-medium">${summary}</p>
            </section>
            <section class="grid grid-cols-[80px_1fr_40px] gap-y-6 text-[13px]">
              <div class="font-bold text-[#A7AAAC]">期間</div>
              <div class="font-bold text-[#484545] flex items-center gap-2">${period} ${Components.PenIcon('period')}</div>
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
      </div>`;
  };

  const renderRankingView = () => {
    return `
      <div class="flex-1 flex flex-col page-transition">
        <div class="pt-12 pb-16 px-6 flex justify-center items-end gap-1">
          <div class="flex flex-col items-center">
             <div class="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 mb-2">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dog" class="w-full h-full">
             </div>
             <div class="w-24 h-24 bg-[#FFC300] rounded-t-xl flex items-center justify-center">
                <span class="text-white text-[32px] font-bold">2</span>
             </div>
          </div>
          <div class="flex flex-col items-center">
             <div class="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 mb-2 relative z-10 scale-110">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=King" class="w-full h-full">
             </div>
             <div class="w-28 h-32 bg-[#0CA1E3] rounded-t-xl flex items-center justify-center shadow-lg">
                <span class="text-white text-[48px] font-bold">1</span>
             </div>
          </div>
          <div class="flex flex-col items-center">
             <div class="w-16 h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200 mb-2">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Flower" class="w-full h-full">
             </div>
             <div class="w-22 h-20 bg-[#9EDF05] rounded-t-xl flex items-center justify-center">
                <span class="text-white text-[24px] font-bold">3</span>
             </div>
          </div>
        </div>

        <div class="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-10 flex flex-col items-center justify-center text-center">
           <img src="./images/icon/icon-Setting.svg" class="w-16 h-16 opacity-10 mb-6 grayscale">
           <h3 class="text-m font-bold text-[#484545] mb-2">メンバーがいません</h3>
           <p class="text-rs text-[#A7AAAC] font-bold mb-8 leading-relaxed">メンバーを追加して<br>ミッションポイントを競い合いましょう！</p>
           <button class="bg-[#FDFBF8] border border-[#D3D6D8] px-8 py-3 rounded-full text-rs font-bold text-[#484545] active:scale-95 transition-transform" onclick="window.showProjectInviteModal('${p.inviteCode}')">
             メンバーを招待する
           </button>
        </div>
      </div>
    `;
  };

  const ongoingMissions = getSortedMissions(p.missions.filter(m => m.status !== 'cleared'));

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <div class="sticky top-0 bg-[#FDFBF8] z-30 shadow-sm">
        ${Components.Header(p)}
        ${Components.Tabs(state.mainBoardTab)}
      </div>
      <main class="flex-1 overflow-y-auto no-scrollbar pb-32">
        ${state.mainBoardTab === 'MAIN' ? `
          <div class="px-6 pt-4 space-y-6 page-transition">
            <div onclick="window.openCalendarModal('view')" class="cursor-pointer bg-white border border-[#D3D6D8] rounded-full px-4 py-2 flex items-center justify-center gap-3 shadow-sm mx-auto w-fit active:scale-95 transition-transform">
               <img src="./images/icon/icon-Calender.svg" class="w-4 h-4">
               <span class="text-[12px] font-bold">開催まで残り <span class="text-[18px] font-mono">${p.daysLeft}</span> 日</span>
            </div>
            <div class="flex justify-center -mt-2">
              <div class="relative w-48 h-48 rounded-full border-[10px] border-[#EBE8E5] flex items-center justify-center shadow-inner">
                <div class="w-36 h-36 bg-[#CFD8FF] rounded-full flex items-center justify-center overflow-hidden">
                  <img src="${currentPlant}" class="w-24 h-28 object-contain mt-2 transition-all duration-500 transform hover:scale-110">
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
               ${p.proposals.map((pr, i) => `
                 <div class="relative bg-white border border-[#D3D6D8] rounded-2xl p-2.5 shadow-sm flex flex-col min-h-[120px] active:bg-[#FDFBF8] transition-colors group">
                   <div onclick="window.addProposalToMission('${pr.id}')" class="cursor-pointer flex-1 flex flex-col">
                     <div class="flex items-center justify-between mb-1.5"><span class="text-[7.5px] text-black/40 font-bold">提案${i+1}</span>${Components.Tag(pr.tag)}</div>
                     <h3 class="text-[13px] font-bold leading-snug flex-1 break-words">${pr.title}</h3>
                   </div>
                   <button onclick="window.showProposalHelp(event, '${pr.id}')" class="absolute bottom-2 right-2 p-1 opacity-40 hover:opacity-100 transition-opacity">
                     <img src="./images/icon/icon-Help.svg" class="w-4 h-4">
                   </button>
                 </div>`).join('')}
               ${p.proposals.length === 0 ? `<div class="col-span-3 py-4 text-center text-[#A7AAAC] text-[10px] font-bold animate-pulse">12時間後に新しい提案が届きます...</div>` : ''}
            </div>
            <section>
               <div class="flex items-center justify-between mb-4">
                 <h2 class="heading-m">ミッション</h2>
                 <div class="relative">
                   <button onclick="window.toggleSortMenu(event)" class="p-2 bg-white border border-[#D3D6D8] rounded-lg shadow-sm active:scale-95 transition-transform">
                      <img src="./images/icon/icon-Filter.svg" class="w-5 h-4">
                   </button>
                 </div>
               </div>
               <div class="space-y-3 pb-10">
                  ${ongoingMissions.length === 0 ? '<p class="text-center py-10 text-[#A7AAAC] text-rs">全てのミッションがクリアされました！</p>' : ongoingMissions.map(m => `
                    <div onclick="window.openClearMissionModal('${m.id}')" class="bg-white border border-[#D3D6D8] rounded-xl p-4 flex flex-col shadow-sm relative animate-fadeIn group cursor-pointer active:bg-[#FDFBF8]">
                       <div class="flex items-center gap-3 mb-2">${Components.Tag(m.tag)}<span class="text-[11px] text-black/40 font-bold">${m.dates && m.dates.length > 0 ? m.dates[0] : '期限なし'}</span></div>
                       <h3 class="text-[14px] font-bold text-[#484545] pr-8">${m.title}</h3>
                       <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 p-2 cursor-pointer hover:opacity-100 transition-opacity" onclick="window.toggleMissionMenu(event, '${m.id}')">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                       </div>
                    </div>`).join('')}
               </div>
            </section>
          </div>
        ` : state.mainBoardTab === 'ARCHIVE' ? renderArchive() : renderRankingView()}
      </main>
      ${state.mainBoardTab === 'MAIN' ? `<button onclick="window.openMissionModal()" class="fixed bottom-10 right-6 w-14 h-14 bg-[#0CA1E3] rounded-full shadow-[0_4px_15px_rgba(12,161,227,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform z-40"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>` : ''}
    </div>
  `;
}

state.init();
