// ==========================================================
// 1. API & GLOBAL CONSTANTS
// ==========================================================
const API_BASE_URL = 'https://api.sinz.me/fukuoka.php';

const LINE_NAMES = {
  'A': '지하철 공항선',
  'H': '지하철 하코자기선',
  'N': '지하철 나나쿠마선',
  'T': '니시테츠 텐진오무타선',
  'D': '니시테츠 다자이후선'
};

const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30초
const INACTIVE_LIMIT = 3 * 60 * 1000;    // 3분

// STATE VARIABLES
let currentLineCode = null;
let refreshTimer = null;
let inactivityTimer = null;
let isInactive = false;

// ==========================================================
// 2. DOM ELEMENTS
// ==========================================================
const drawerMenu = document.getElementById('drawer-menu');
const drawerOverlay = document.getElementById('drawer-overlay');
const btnOpenDrawer = document.getElementById('btn-open-drawer');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const btnCloseDrawerTop = document.getElementById('btn-close-drawer-top');

const homeView = document.getElementById('home-view');
const lineView = document.getElementById('line-view');
const siteInfoView = document.getElementById('site-info-view');

const selectedLineTitle = document.getElementById('selected-line-title');
const stationTableBody = document.getElementById('station-table-body');
const inactiveBanner = document.getElementById('inactive-banner');

const btnSiteInfo = document.getElementById('btn-site-info');
const btnBackHome = document.getElementById('btn-back-home');
const appTitle = document.getElementById('app-title');

// ==========================================================
// 3. EVENT LISTENERS
// ==========================================================

btnOpenDrawer.addEventListener('click', openDrawer);
btnCloseDrawer.addEventListener('click', closeDrawer);
btnCloseDrawerTop.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

appTitle.addEventListener('click', showHomeView);
btnBackHome.addEventListener('click', showHomeView);

document.querySelectorAll('[data-line]').forEach(button => {
  button.addEventListener('click', (e) => {
    const lineCode = e.currentTarget.getAttribute('data-line');
    selectLineByUser(lineCode);
    closeDrawer();
  });
});

btnSiteInfo.addEventListener('click', () => {
  showSiteInfoView();
  closeDrawer();
});

['touchstart', 'click', 'mousemove', 'keydown', 'scroll'].forEach(evtType => {
  window.addEventListener(evtType, handleUserActivity, { passive: true });
});

// ==========================================================
// 4. FUNCTIONS & VIEW SWITCHING
// ==========================================================

function openDrawer() {
  drawerMenu.classList.add('active');
  drawerOverlay.classList.add('active');
}

function closeDrawer() {
  drawerMenu.classList.remove('active');
  drawerOverlay.classList.remove('active');
}

function showHomeView() {
  stopAutoRefresh();
  clearTimeout(inactivityTimer);

  homeView.style.display = 'block';
  lineView.style.display = 'none';
  siteInfoView.style.display = 'none';

  currentLineCode = null;
  isInactive = false;
  inactiveBanner.style.display = 'none';
}

function showLineView(lineCode) {
  homeView.style.display = 'none';
  lineView.style.display = 'block';
  siteInfoView.style.display = 'none';

  selectedLineTitle.textContent = LINE_NAMES[lineCode] || '';
}

function showSiteInfoView() {
  stopAutoRefresh();
  clearTimeout(inactivityTimer);

  homeView.style.display = 'none';
  lineView.style.display = 'none';
  siteInfoView.style.display = 'block';

  currentLineCode = null;
  isInactive = false;
  inactiveBanner.style.display = 'none';
}

function renderLoadingState() {
  stationTableBody.innerHTML = `
    <tr>
      <td colspan="3" class="loading-cell">
        ⏳ 정보 불러오는 중...
      </td>
    </tr>
  `;
}

// ==========================================================
// 5. STATION NAME FORMATTER
// ==========================================================
function formatStationName(rawName) {
  if (!rawName) return '';

  if (rawName.includes(' (')) {
    return rawName.replace(/\s\(/g, '<br>(');
  }

  return rawName.replace(/\s+/, '<br>');
}

// ==========================================================
// 6. DATA FETCHING & TIMERS
// ==========================================================

function selectLineByUser(lineCode) {
  currentLineCode = lineCode;
  showLineView(lineCode);
  
  isInactive = false;
  inactiveBanner.style.display = 'none';
  
  renderLoadingState();

  loadLineData(lineCode);
  resetInactivityTimer();
  startAutoRefresh();
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    if (currentLineCode && !isInactive) {
      loadLineData(currentLineCode);
    }
  }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function handleUserActivity() {
  if (!currentLineCode) return;

  if (isInactive) {
    isInactive = false;
    inactiveBanner.style.display = 'none';
    
    renderLoadingState();
    loadLineData(currentLineCode);
    startAutoRefresh();
  }

  resetInactivityTimer();
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (!currentLineCode) return;

  inactivityTimer = setTimeout(() => {
    isInactive = true;
    stopAutoRefresh();
    inactiveBanner.style.display = 'block';
  }, INACTIVE_LIMIT);
}

async function loadLineData(lineCode) {
  const targetUrl = `${API_BASE_URL}?line=${lineCode}`;

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      console.error(`[HTTP Error] Status: ${response.status}`);
      return;
    }

    let data = await response.json();

    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = data.data || data.result || data.list || data.stations || [];
    }

    renderTrainData(data);
  } catch (err) {
    console.error('[AJAX Fetch Error]:', err);
  }
}

// ==========================================================
// 7. TRAIN BADGE CREATOR & RENDER
// ==========================================================
function createTrainBadges(trainList) {
  if (!trainList || !Array.isArray(trainList) || trainList.length === 0) return '';

  return trainList.map(train => {
    if (!train) return '';
    
    const typeStr = train.type || train.trainType || train.expressType || '';
    const stsStr = train.sts || train.status || train.trainStatus || '';

    let typeClass = '';
    if (typeStr.includes('N라이너') || typeStr.includes('라이너')) {
      typeClass = 'N라이너';
    } else if (typeStr.includes('특급')) {
      typeClass = '특급';
    } else if (typeStr.includes('급행')) {
      typeClass = '급행';
    } else if (typeStr.includes('쾌속')) {
      typeClass = '쾌속';
    } else if (typeStr.includes('보통')) {
      typeClass = '보통';
    }

    return `
      <div class="train-badge ${typeClass}">
        <span>🚆 ${typeStr}</span>
        ${stsStr ? `<span class="sts-tag">${stsStr}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderTrainData(stations) {
  stationTableBody.innerHTML = '';

  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    stationTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="loading-cell">운행 정보가 없습니다.</td>
      </tr>
    `;
    return;
  }

  stations.forEach(item => {
    if (!item) return;

    const tr = document.createElement('tr');

    const rawStnName = item.stn || item.station || item.stationName || '';
    const formattedStnName = formatStationName(rawStnName);

    const upList = item.up || item.upBound || item.upbound || [];
    const downList = item.down || item.downBound || item.downbound || [];

    const upHtml = createTrainBadges(upList);
    const downHtml = createTrainBadges(downList);

    tr.innerHTML = `
      <td class="col-up">${upHtml}</td>
      <td class="col-stn stn-name">${formattedStnName}</td>
      <td class="col-down">${downHtml}</td>
    `;

    stationTableBody.appendChild(tr);
  });
}