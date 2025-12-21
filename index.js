
// --- 定数定義 ---
const SEED_TYPES = [
  { id: 'jack', path: './images/plants/seed-jack.svg', name: 'ジャック' },
  { id: 'baribari', path: './images/plants/seed-baribari.svg', name: 'バリバリ' },
  { id: 'lucky', path: './images/plants/seed-lucky.svg', name: 'ラッキー' }
];

// --- 状態管理 ---
const state = {
  projects: [],
  currentView: 'HOME',
  draftProject: {},

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

  setView(view) {
    this.currentView = view;
    this.render();
    window.scrollTo(0, 0);
  },

  addProject() {
    if (!this.draftProject.name || !this.draftProject.description || !this.draftProject.seedType) return;

    const newProject = {
      id: Date.now().toString(),
      name: this.draftProject.name,
      description: this.draftProject.description,
      seedType: this.draftProject.seedType,
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      createdAt: Date.now(),
      isCompleted: false
    };
    this.projects.push(newProject);
    this.save();
    this.draftProject = {};
    this.setView('HOME');
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
    }
  }
};

// --- UIコンポーネント ---
const Components = {
  Header: () => `
    <header class="flex justify-between items-center px-6 py-4 bg-[#FDFBF8] sticky top-0 z-20">
      <button class="p-1 active:opacity-50 transition-opacity">
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
  BottomNav: () => `
    <div class="fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
      <nav class="max-w-sm mx-auto bg-white/95 backdrop-blur-md border border-[#D3D6D8] rounded-[32px] px-8 py-3.5 flex justify-between items-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] pointer-events-auto">
        <button class="p-2 active:scale-110 transition-transform">
          <img src="./images/icon/icon-Home-pressed.svg" class="w-8 h-8 block" alt="Home">
        </button>
        <button class="p-2 opacity-40 hover:opacity-100 transition-opacity">
          <img src="./images/icon/icon-Research.svg" class="w-8 h-8 block" alt="Research">
        </button>
        <button class="p-2 opacity-40 hover:opacity-100 transition-opacity">
          <img src="./images/icon/icon-Notification.svg" class="w-8 h-8 block" alt="Notification">
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
  `
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
              <div class="flex flex-col items-center cursor-pointer group">
                <span class="text-[10px] text-[#484545] mb-2 truncate w-full text-center px-1 font-bold leading-tight">
                  ${p.name}
                </span>
                <div class="h-24 w-full flex items-end justify-center mb-1 transition-transform group-active:scale-95">
                  <img src="${imagePath}" class="max-h-full max-w-full object-contain block" style="width: auto; height: 100%;" alt="${p.name}">
                </div>
              </div>
            `;
          }).join('')}
          ${Array(3 - rowItems.length).fill(0).map(() => `<div class="h-24 w-full"></div>`).join('')}
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
      ${Components.BottomNav()}
    </div>
  `;

  document.getElementById('header-add-btn').onclick = () => {
    state.draftProject = {};
    state.setView('CREATE_PROJECT_INFO');
  };
}

function renderCreateProjectInfo(container) {
  container.innerHTML = `
    <div class="flex flex-col min-h-screen bg-[#FDFBF8]">
      <header class="px-6 py-8 text-center">
        <h1 class="heading-l" style="color: #0CA1E3">新規プロジェクトの作成</h1>
      </header>
      <main class="flex-1 px-8 pt-6 pb-12 page-transition flex flex-col">
        <div class="space-y-8 mb-12">
          <div>
            <label class="heading-rs block mb-3 pl-1" style="color: #484545">プロジェクト名</label>
            <input type="text" id="p-name" placeholder="プロジェクト名を入力" value="${state.draftProject.name || ''}" class="input-field w-full px-5 py-4 focus:outline-none">
          </div>
          <div>
            <label class="heading-rs block mb-3 pl-1" style="color: #484545">プロジェクトの説明</label>
            <textarea id="p-desc" placeholder="プロジェクトの説明を入力" rows="5" class="input-field w-full px-5 py-4 focus:outline-none resize-none">${state.draftProject.description || ''}</textarea>
          </div>
        </div>
        <div class="mt-auto">
          ${Components.Pagination(0)}
          <div class="space-y-4">
            <button id="next-btn" class="btn-primary w-full py-4 heading-r font-bold" disabled>次へ</button>
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold">戻る</button>
          </div>
        </div>
      </main>
    </div>
  `;

  const nameInput = document.getElementById('p-name');
  const descInput = document.getElementById('p-desc');
  const nextBtn = document.getElementById('next-btn');

  const validate = () => {
    nextBtn.disabled = !(nameInput.value.trim() && descInput.value.trim());
  };

  nameInput.oninput = validate;
  descInput.oninput = validate;
  validate();

  document.getElementById('back-btn').onclick = () => state.setView('HOME');
  nextBtn.onclick = () => {
    state.draftProject.name = nameInput.value.trim();
    state.draftProject.description = descInput.value.trim();
    state.setView('CREATE_PROJECT_SEED');
  };
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
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold">戻る</button>
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
      opt.querySelector('div').classList.add('border-[#0CA1E3]', 'scale-110', 'shadow-md');
      selectedSeed = opt.getAttribute('data-seed-id');
      nextBtn.disabled = false;
    };
  });

  document.getElementById('back-btn').onclick = () => state.setView('CREATE_PROJECT_INFO');
  nextBtn.onclick = () => {
    state.draftProject.seedType = selectedSeed;
    state.setView('CREATE_PROJECT_INVITE');
  };
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
            <button id="back-btn" class="btn-secondary w-full py-4 heading-r font-bold">戻る</button>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('back-btn').onclick = () => state.setView('CREATE_PROJECT_SEED');
  document.getElementById('finish-btn').onclick = () => state.addProject();
}

// 起動
state.init();
