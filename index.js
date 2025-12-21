
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

// 連続する日付をグループ化する関数
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
  draftProject: {
    name: '',
    description: '',
    dates: [] // ['2025-10-01', ...]
  },
  calendarDate: new Date(), // カレンダー表示用

  init() {
    const saved = localStorage.getItem('event_planner_projects');
    if (saved) {
      try {
        this.projects = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load projects", e);
        this.projects = [];
      }
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

    const newProject = {
      id: Date.now().toString(),
      name: this.draftProject.name,
      description: this.draftProject.description,
      seedType: this.draftProject.seedType,
      dates: [...this.draftProject.dates],
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      createdAt: Date.now(),
      isCompleted: false,
      progress: 25,
      daysLeft: this.calculateDaysLeft(this.draftProject.dates[0]),
      missions: [
        { id: 'm1', title: 'プロジェクトの概要を設定する。', tag: '運営', daysLeft: 22, type: 'important' },
        { id: 'm2', title: 'プロジェクトをやる目的を設定する。', tag: '企画', daysLeft: 28, type: 'plan' },
        { id: 'm3', title: '開催日時を設定する', tag: '制作', daysLeft: 32, type: 'create' }
      ],
      proposals: [
        { id: 'p1', title: '開催場所を設定する', tag: '制作', type: 'create' },
        { id: 'p2', title: '広報用リンクを挿入', tag: '企画', type: 'plan' },
        { id: 'p3', title: 'メインビジュアル作成', tag: '広報', type: 'public' }
      ]
    };
    this.projects.push(newProject);
    this.save();
    const createdId = newProject.id;
    this.draftProject = { name: '', description: '', dates: [] };
    this.setView('MAIN_BOARD', createdId);
  },

  calculateDaysLeft(dateStr) {
    if (!dateStr) return 99;
    const target = new Date(dateStr);
    const now = new Date();
    // 時刻を0時0分0秒に揃えて計算
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    switch (this.currentView) {
      case 'HOME':
        renderHome(appEl);
        break;
      case 'CREATE_PROJECT_INFO':
        renderCreateProjectInfo(appEl);
        break;
      case 'CREATE_PROJECT_SEED':
        renderCreateProjectSeed(appEl);
        break;
      case 'CREATE_PROJECT_INVITE':
        renderCreateProjectInvite(appEl);
        break;
      case 'MAIN_BOARD':
        renderMainBoard(appEl);
        break;
    }
  }
};

window.state = state;

// ヘルプモーダル表示
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

// カレンダーモーダル表示
window.openCalendarModal = () => {
  // 初期表示を今日か最初の日付に
  state.calendarDate = state.draftProject.dates.length > 0 ? new Date(state.draftProject.dates[0]) : new Date();
  
  const modal = document.createElement('div');
  modal.id = 'calendar-modal';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 page-transition';
  document.body.appendChild(modal);
  renderCalendarInner();
};

function renderCalendarInner() {
  const modal = document.getElementById('calendar-modal');
  if (!modal) return;

  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const todayStr = new Date().toISOString().split('T')[0];

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const monthName = `${year}年 ${month + 1}月`;
  
  let daysHtml = '';
  // 空白埋め
  for (let i = 0; i < firstDay; i++) {
    daysHtml += `<div class="h-10"></div>`;
  }
  // 日付埋め
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = state.draftProject.dates.includes(dateStr);
    const isToday = dateStr === todayStr;
    
    daysHtml += `
      <div 
        onclick="window.toggleDraftDate('${dateStr}')"
        class="h-10 w-full flex items-center justify-center rounded-lg cursor-pointer transition-all text-rs font-bold
        ${isSelected ? 'bg-[#0CA1E3] text-white shadow-md' : 'bg-white hover:bg-[#FDFBF8] text-[#484545]'}
        ${isToday && !isSelected ? 'border border-[#0CA1E3] text-[#0CA1E3]' : ''}"
      >
        ${d}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn">
      <div class="flex items-center justify-between mb-6">
        <h3 class="heading-r text-[#484545] font-bold">${monthName}</h3>
        <div class="flex gap-2">
          <button onclick="window.moveCalendarMonth(-1)" class="p-2 bg-[#FDFBF8] rounded-full active:scale-90 transition-transform">
             <img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 brightness-0 opacity-50">
          </button>
          <button onclick="window.moveCalendarMonth(1)" class="p-2 bg-[#FDFBF8] rounded-full active:scale-90 transition-transform">
             <img src="./images/icon/iocn-Chevron.svg" class="w-3 h-3 rotate-180 brightness-0 opacity-50">
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] text-[#A7AAAC] font-bold">
        <div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div>
      </div>
      <div class="grid grid-cols-7 gap-1 mb-8">
        ${daysHtml}
      </div>

      <div class="flex gap-3">
        <button onclick="document.getElementById('calendar-modal').remove()" class="btn-primary flex-1 py-3 heading-rs font-bold">決定</button>
      </div>
    </div>
  `;
}

window.moveCalendarMonth = (offset) => {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + offset);
  renderCalendarInner();
};

window.toggleDraftDate = (dateStr) => {
  const index = state.draftProject.dates.indexOf(dateStr);
  if (index > -1) {
    state.draftProject.dates.splice(index, 1);
  } else {
    state.draftProject.dates.push(dateStr);
    state.draftProject.dates.sort();
  }
  renderCalendarInner();
  window.refreshDraftDateList();
};

// 特定の範囲を削除する関数
window.removeDraftRange = (dateArrayJson) => {
  const dateArray = JSON.parse(decodeURIComponent(dateArrayJson));
  state.draftProject.dates = state.draftProject.dates.filter(d => !dateArray.includes(d));
  window.refreshDraftDateList();
};

// --- UIコンポーネント ---
const Components = {
  Header: () => `
    <header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20">
      <button class="p-1 active:opacity-50 transition-opacity" onclick="state.setView('HOME')">
        <svg width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1H33M1 12H33M1 23H33" stroke="#484545" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button id="header-add-btn" class="flex items-center gap-1 border border-[#0CA1E3] text-[#0CA1E3] px-4 py-1.5 rounded-lg bg-white shadow-sm active:scale-95 transition-transform">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span class="heading-r font-bold">作成</span>
      </button>
    </header>
  `,
  BottomNav: (active = 'home') => `
    <div class="fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
      <nav class="max-w-sm mx-auto bg-white/95 backdrop-blur-md border border-[#D3D6D8] rounded-[32px] px-8 py-3.5 flex justify-between items-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] pointer-events-auto">
        <button class="p-2 active:scale-110 transition-transform" onclick="state.setView('HOME')">
          <img src="./images/icon/icon-Home${active === 'home' ? '-pressed' : ''}.svg" class="w-8 h-8 block">
        </button>
        <button class="p-2 opacity-40 hover:opacity-100 transition-opacity active:scale-110">
          <img src="./images/icon/icon-Research.svg" class="w-8 h-8 block">
        </button>
        <button class="p-2 opacity-40 hover:opacity-100 transition-opacity active:scale-110">
          <img src="./images/icon/icon-Notification.svg" class="w-8 h-8 block">
        </button>
      </nav>
    </div>
  `,
  ShelfLine: () => `<div class="w-full h-[1.5px] bg-[#D3D6D8] mt-1 mb-8"></div>`,
  Pagination: (step) => `
    <div class="flex gap-2 justify-center mb-10">
      <div class="w-2.5 h-2.5 rounded-full ${step === 0 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
      <div class="w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
      <div class="w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-[#0CA1E3]' : 'bg-[#D3D6D8]'}"></div>
    </div>
  `,
  Tag: (text, type) => {
    const colors = {
      運営: 'bg-[#EE3E12]',
      企画: 'bg-[#0CA1E3]',
      制作: 'bg-[#FFC300]',
      広報: 'bg-[#9EDF05]'
    };
    return `<span class="px-1.5 py-0.5 rounded text-[8px] text-white font-bold ${colors[text] || 'bg-gray-400'}">${text}</span>`;
  }
};

// --- レンダリング関数 ---

function renderHome(container) {
  const ongoing = state.projects.filter(p => !p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const completed = state.projects.filter(p => p.isCompleted).sort((a, b) => b.createdAt - a.createdAt);

  const renderGrid = (list) => {
    if (list.length === 0) {
      return `
        <div class="flex flex-col px-1">
          <div class="h-24 flex items-center">
            <span class="text-rs text-[#A7AAAC]">プロジェクトがありません</span>
          </div>
          ${Components.ShelfLine()}
        </div>
      `;
    }

    let rowsHtml = '';
    for (let i = 0; i < list.length; i += 3) {
      const rowItems = list.slice(i, i + 3);
      rowsHtml += `
        <div class="grid grid-cols-3 gap-x-2 px-1 mb-2 items-end">
          ${rowItems.map(p => {
            const seed = SEED_TYPES.find(s => s.id === p.seedType);
            const imagePath = seed ? seed.path : './images/plants/seed-jack.svg';
            return `
              <div class="flex flex-col items-center cursor-pointer group" onclick="state.setView('MAIN_BOARD', '${p.id}')">
                <span class="text-[10px] text-[#484545] mb-2 truncate w-full text-center px-1 font-bold leading-tight">
                  ${p.name}
                </span>
                <div class="h-24 w-full flex items-end justify-center mb-1 transition-transform group-active:scale-95">
                  <img src="${imagePath}" class="max-h-full max-w-full object-contain block" style="width: auto; height: 100%;" alt="${p.name}">
                </div>
              </div>
            `;
          }).join('')}
          ${Array(3 - rowItems.length).fill(0).map(() => `<div class="h-28 w-full"></div>`).join('')}
        </div>
        ${Components.ShelfLine()}
      `;
    }
    return rowsHtml;
  };

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      ${Components.Header()}
      <main class="flex-1 px-6 pt-2 pb-36 page-transition">
        <section class="mb-12">
          <h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">作成したプロジェクト</h2>
          ${renderGrid(ongoing)}
        </section>

        <section>
          <h2 class="text-[#484545] heading-m mb-6 pl-1 font-bold">完了したプロジェクト</h2>
          ${renderGrid(completed)}
        </section>
      </main>
      ${Components.BottomNav('home')}
    </div>
  `;

  const addBtn = document.getElementById('header-add-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      state.draftProject = { name: '', description: '', dates: [] };
      state.setView('CREATE_PROJECT_INFO');
    };
  }
}

function renderCreateProjectInfo(container) {
  window.refreshDraftDateList = () => {
    const listEl = document.getElementById('selected-dates-list');
    const nextBtn = document.getElementById('next-btn');
    if (!listEl) return;

    const groups = getConsecutiveGroups(state.draftProject.dates);

    if (groups.length === 0) {
      listEl.innerHTML = `<p class="text-[12px] text-[#A7AAAC] text-center py-4">開催日が選択されていません</p>`;
    } else {
      listEl.innerHTML = groups.map((group, i) => {
        const start = group[0];
        const end = group[group.length - 1];
        const [sy, sm, sd] = start.split('-');
        const [ey, em, ed] = end.split('-');
        
        let dateText = '';
        if (group.length > 1) {
          if (sy === ey && sm === em) {
            // 同月内: 2025年10月1日 〜 3日
            dateText = `<div class="flex items-center gap-2"><span class="font-bold">${sy}年${sm}月${sd}日</span><span class="text-[#A7AAAC]">〜</span><span class="font-bold">${ed}日</span></div>`;
          } else {
            // 月をまたぐ: 2025年10月31日 〜 11月2日
            dateText = `<div class="flex flex-col gap-0.5"><div class="flex items-center gap-2"><span class="font-bold">${sy}年${sm}月${sd}日</span><span class="text-[#A7AAAC]">〜</span></div><span class="font-bold">${ey}年${em}月${ed}日</span></div>`;
          }
        } else {
          dateText = `<span class="font-bold">${sy}年${sm}月${sd}日</span>`;
        }

        const encodedGroup = encodeURIComponent(JSON.stringify(group));

        return `
          <div class="flex items-center justify-between bg-white border border-[#D3D6D8] px-5 py-4 rounded-xl shadow-sm animate-fadeIn">
            <div class="text-[14px] text-[#484545]">
              ${dateText}
            </div>
            <button onclick="window.removeDraftRange('${encodedGroup}')" class="p-1 opacity-30 hover:opacity-100 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;
      }).join('');
    }
    validate();
  };

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center">
        <h1 class="heading-l" style="color: #0CA1E3">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-2 pb-12 page-transition flex flex-col">
        <div class="space-y-6 mb-8 overflow-y-auto pr-1 no-scrollbar">
          <div>
            <label class="heading-rs block mb-2 pl-1" style="color: #484545">プロジェクト名</label>
            <input type="text" id="p-name" placeholder="プロジェクト名を入力" value="${state.draftProject.name || ''}" class="input-field w-full px-5 py-4 focus:outline-none">
          </div>
          <div>
            <label class="heading-rs block mb-2 pl-1" style="color: #484545">プロジェクトの説明</label>
            <textarea id="p-desc" placeholder="プロジェクトの説明を入力" rows="4" class="input-field w-full px-5 py-4 focus:outline-none resize-none">${state.draftProject.description || ''}</textarea>
          </div>
          
          <div class="pt-2 border-t border-[#EBE8E5]">
             <div class="flex items-center justify-between mb-4">
                <label class="heading-rs" style="color: #484545">開催日時</label>
                <button onclick="window.openCalendarModal()" class="flex items-center gap-2 bg-[#EBE8E5] px-4 py-2 rounded-full active:scale-95 transition-transform">
                   <img src="./images/icon/icon-Calender.svg" class="w-5 h-5">
                   <span class="text-[12px] font-bold">日付を追加</span>
                </button>
             </div>
             <div id="selected-dates-list" class="space-y-3">
                <!-- 日付リストがここに表示される -->
             </div>
          </div>
        </div>

        <div class="mt-auto">
          ${Components.Pagination(0)}
          <div class="space-y-4">
            <button id="next-btn" class="btn-primary w-full py-4 heading-r font-bold" disabled>次へ</button>
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold" onclick="state.setView('HOME')">キャンセル</button>
          </div>
        </div>
      </main>
    </div>
  `;

  const nameInput = document.getElementById('p-name');
  const descInput = document.getElementById('p-desc');
  const nextBtn = document.getElementById('next-btn');

  function validate() {
    if (nextBtn && nameInput && descInput) {
      const isComplete = nameInput.value.trim() !== '' && 
                         descInput.value.trim() !== '' && 
                         state.draftProject.dates.length > 0;
      nextBtn.disabled = !isComplete;
    }
  }

  nameInput.oninput = () => {
    state.draftProject.name = nameInput.value;
    validate();
  };
  descInput.oninput = () => {
    state.draftProject.description = descInput.value;
    validate();
  };

  nextBtn.onclick = () => {
    state.setView('CREATE_PROJECT_SEED');
  };

  window.refreshDraftDateList();
}

function renderCreateProjectSeed(container) {
  let selectedSeed = state.draftProject.seedType || '';

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center">
        <h1 class="heading-l" style="color: #0CA1E3">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-6 pb-12 page-transition flex flex-col items-center">
        <h2 class="heading-l mb-12" style="color: #484545">種を選択</h2>
        
        <div class="grid grid-cols-3 gap-6 mb-16 w-full max-w-[320px]">
          ${SEED_TYPES.map(seed => `
            <div data-seed-id="${seed.id}" class="seed-option flex flex-col items-center cursor-pointer transition-all">
              <div class="w-20 h-20 rounded-full bg-[#EBE8E5] flex items-center justify-center border-2 ${selectedSeed === seed.id ? 'border-[#0CA1E3] scale-110 shadow-md' : 'border-transparent'}">
                <img src="${seed.path}" class="w-12 h-12 object-contain pointer-events-none block">
              </div>
              <span class="text-[11px] mt-2 font-bold text-[#484545]">${seed.name}</span>
            </div>
          `).join('')}
        </div>

        <div class="mt-auto w-full">
          ${Components.Pagination(1)}
          <div class="space-y-4">
            <button id="next-btn" class="btn-primary w-full py-4 heading-r font-bold" ${selectedSeed ? '' : 'disabled'}>次へ</button>
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold" onclick="state.setView('CREATE_PROJECT_INFO')">戻る</button>
          </div>
        </div>
      </main>
    </div>
  `;

  const nextBtn = document.getElementById('next-btn');
  document.querySelectorAll('.seed-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.seed-option > div').forEach(div => {
        div.classList.remove('border-[#0CA1E3]', 'scale-110', 'shadow-md');
      });
      const circle = opt.querySelector('div');
      if (circle) circle.classList.add('border-[#0CA1E3]', 'scale-110', 'shadow-md');
      selectedSeed = opt.getAttribute('data-seed-id');
      if (nextBtn) nextBtn.disabled = false;
    };
  });

  if (nextBtn) {
    nextBtn.onclick = () => {
      state.draftProject.seedType = selectedSeed;
      state.setView('CREATE_PROJECT_INVITE');
    };
  }
}

function renderCreateProjectInvite(container) {
  const code = state.draftProject.inviteCode || Math.random().toString(36).substring(2, 10).toUpperCase();
  state.draftProject.inviteCode = code;

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center">
        <h1 class="heading-l" style="color: #0CA1E3">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-6 pb-12 page-transition flex flex-col items-center">
        <h2 class="heading-l mb-16" style="color: #484545">チームメンバーを招待</h2>
        <div class="text-center space-y-6 mb-12 w-full">
          <p class="text-rs font-bold" style="color: #484545">共有リンク</p>
          <div class="bg-white border border-[#D3D6D8] p-6 rounded-2xl shadow-sm">
            <p class="heading-m tracking-widest font-mono" style="color: #484545">${code}</p>
          </div>
          <button class="text-rs flex items-center justify-center gap-2 mx-auto bg-[#EBE8E5] px-6 py-3 rounded-full active:scale-95 transition-transform" style="color: #484545">
             <img src="./images/icon/icon-Link.svg" class="w-5 h-5 block">
             共有する
          </button>
        </div>
        <div class="mt-auto w-full">
          ${Components.Pagination(2)}
          <div class="space-y-4">
            <button id="finish-btn" class="btn-primary w-full py-4 heading-r font-bold">プロジェクトを作成</button>
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold" onclick="state.setView('CREATE_PROJECT_SEED')">戻る</button>
          </div>
        </div>
      </main>
    </div>
  `;

  const finishBtn = document.getElementById('finish-btn');
  if (finishBtn) finishBtn.onclick = () => state.addProject();
}

function renderMainBoard(container) {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) {
    state.setView('HOME');
    return;
  }

  const seed = SEED_TYPES.find(s => s.id === project.seedType);
  const plantImage = `${seed.plantPrefix}1.svg`;

  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <!-- Sub Header -->
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="state.setView('HOME')" class="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center active:scale-90 transition-transform">
             <img src="./images/icon/iocn-Chevron.svg" class="w-4 h-4 brightness-0 opacity-50">
          </button>
          <div class="flex items-center gap-2">
            <img src="${seed.path}" class="w-5 h-5">
            <span class="text-[14px] font-bold truncate max-w-[180px]">${project.name}</span>
          </div>
        </div>
        <button class="p-1 active:scale-110 transition-transform">
           <img src="./images/icon/icon-Setting.svg" class="w-6 h-6">
        </button>
      </div>

      <!-- Tabs -->
      <div class="px-6 flex border-b border-[#D3D6D8]">
        <div class="flex-1 flex flex-col items-center py-2 border-b-2 border-[#0CA1E3]">
           <img src="./images/icon/icon-MainBoard-pressed.svg" class="w-6 h-6 mb-1">
           <span class="text-[10px] font-bold text-[#0CA1E3]">メインボード</span>
        </div>
        <div class="flex-1 flex flex-col items-center py-2 opacity-40">
           <img src="./images/icon/icon-Ranking.svg" class="w-6 h-6 mb-1">
           <span class="text-[10px] font-bold">ランキング</span>
        </div>
        <div class="flex-1 flex flex-col items-center py-2 opacity-40">
           <img src="./images/icon/icon-Archive.svg" class="w-6 h-6 mb-1">
           <span class="text-[10px] font-bold">アーカイブ</span>
        </div>
      </div>

      <main class="flex-1 px-6 pt-6 pb-36 overflow-y-auto space-y-8 no-scrollbar page-transition">
        <!-- Countdown -->
        <div class="bg-white border border-[#D3D6D8] rounded-xl p-3 flex items-center justify-center gap-3 shadow-sm">
           <img src="./images/icon/icon-Calender.svg" class="w-6 h-6">
           <span class="heading-m tracking-tight">開催まで残り <span class="text-[24px] font-mono">${project.daysLeft}</span> 日</span>
        </div>

        <!-- Progress Circle & Plant -->
        <div class="relative flex justify-center py-4">
           <div class="relative w-64 h-64 rounded-full border-[12px] border-[#EBE8E5] flex items-center justify-center shadow-inner overflow-hidden">
              <div class="absolute inset-0 rounded-full border-[12px] border-transparent border-t-[#8B00FF] border-r-[#8B00FF] rotate-45"></div>
              <div class="w-48 h-48 bg-[#CFD8FF] rounded-full flex items-center justify-center relative z-0">
                 <img src="${plantImage}" class="w-32 h-40 object-contain mt-4">
              </div>
           </div>
        </div>

        <!-- Proposals (Grid Fixed 3) -->
        <div class="grid grid-cols-3 gap-2">
           ${project.proposals.map((p, i) => `
             <div class="bg-white border border-[#D3D6D8] rounded-2xl p-2 shadow-sm flex flex-col h-32 relative">
                <div class="flex items-center justify-between mb-1">
                   <span class="text-[8px] text-black/40 font-bold">提案${i+1}</span>
                   ${Components.Tag(p.tag, p.type)}
                </div>
                <h3 class="text-[10px] font-bold leading-tight break-words flex-1">${p.title}</h3>
                <div class="text-right mt-auto">
                   <button onclick="window.showProposalHelp('${p.id}')" class="p-1 opacity-30 active:scale-125 transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   </button>
                </div>
             </div>
           `).join('')}
        </div>

        <!-- Missions (Vertical) -->
        <section>
           <div class="flex items-center justify-between mb-4">
              <h2 class="heading-m">ミッション</h2>
              <button class="p-1 active:scale-110 transition-transform">
                 <img src="./images/icon/icon-Filter.svg" class="w-6 h-4">
              </button>
           </div>
           <div class="space-y-4">
              ${project.missions.map(m => `
                <div class="bg-white border border-[#D3D6D8] rounded-xl p-4 flex flex-col shadow-sm relative group active:scale-[0.98] transition-transform">
                   <div class="flex items-center gap-3 mb-2">
                      ${Components.Tag(m.tag, m.type)}
                      <span class="text-[11px] text-black/40 font-bold">残り${m.daysLeft}日</span>
                   </div>
                   <h3 class="text-[14px] font-bold text-[#484545] pr-8 leading-snug">${m.title}</h3>
                   <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                   </div>
                </div>
              `).join('')}
           </div>
        </section>
      </main>

      <!-- FAB -->
      <button class="fixed bottom-32 right-6 w-14 h-14 bg-[#0CA1E3] rounded-full shadow-[0_4px_15px_rgba(12,161,227,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform z-50">
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  `;
}

// 起動
state.init();
