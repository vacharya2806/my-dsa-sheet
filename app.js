// App State
const STATE_KEY = 'maang-dsa-110-progress';

function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let progress = loadState();
let currentFilter = 'all';
let currentTopic = null;

// Get unique topics
function getTopics() {
    const topics = [...new Set(PROBLEMS.map(p => p.topic))];
    return topics;
}

// Group problems by day
function groupByDay() {
    const grouped = {};
    PROBLEMS.forEach(p => {
        if (!grouped[p.day]) grouped[p.day] = [];
        grouped[p.day].push(p);
    });
    return grouped;
}

// Calculate stats
function updateStats() {
    const solved = Object.values(progress).filter(v => v).length;
    const total = PROBLEMS.length;
    const percent = Math.round((solved / total) * 100);

    document.getElementById('solved-count').textContent = solved;
    document.getElementById('total-problems').textContent = total;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;

    // Calculate current day (furthest day with any solved problem)
    const dayGroups = groupByDay();
    let currentDay = 0;
    for (let day = 1; day <= 110; day++) {
        const problems = dayGroups[day] || [];
        const daySolved = problems.filter(p => progress[`${p.day}-${p.name}`]).length;
        if (daySolved > 0) currentDay = day;
    }
    document.getElementById('current-day').textContent = currentDay;

    // Calculate streak
    let streak = 0;
    for (let day = currentDay; day >= 1; day--) {
        const problems = dayGroups[day] || [];
        const daySolved = problems.filter(p => progress[`${p.day}-${p.name}`]).length;
        if (daySolved === problems.length && problems.length > 0) {
            streak++;
        } else {
            break;
        }
    }
    document.getElementById('streak-count').textContent = streak;
}

// Render topic filters
function renderTopicFilters() {
    const container = document.getElementById('topic-filters');
    const topics = getTopics();
    
    container.innerHTML = `<button class="topic-btn ${!currentTopic ? 'active' : ''}" data-topic="">All Topics</button>` +
        topics.map(t => `<button class="topic-btn ${currentTopic === t ? 'active' : ''}" data-topic="${t}">${t}</button>`).join('');

    container.querySelectorAll('.topic-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTopic = btn.dataset.topic || null;
            renderTopicFilters();
            renderDays();
        });
    });
}

// Render days
function renderDays() {
    const container = document.getElementById('days-container');
    const dayGroups = groupByDay();
    let html = '';

    for (let day = 1; day <= 110; day++) {
        const problems = dayGroups[day] || [];
        
        // Apply topic filter
        if (currentTopic) {
            const hasTopicProblem = problems.some(p => p.topic === currentTopic);
            if (!hasTopicProblem) continue;
        }

        const filteredProblems = currentTopic ? problems.filter(p => p.topic === currentTopic) : problems;
        const daySolved = filteredProblems.filter(p => progress[`${p.day}-${p.name}`]).length;
        const dayComplete = daySolved === filteredProblems.length;

        // Apply status filter
        if (currentFilter === 'completed' && !dayComplete) continue;
        if (currentFilter === 'pending' && dayComplete) continue;

        const topic = filteredProblems[0]?.topic || '';
        const completedClass = dayComplete ? 'completed' : '';

        html += `
            <div class="day-card ${completedClass}" data-day="${day}">
                <div class="day-header" onclick="toggleDay(${day})">
                    <div class="day-title">
                        <span class="day-number">Day ${day}</span>
                        <span class="day-topic">${topic}</span>
                    </div>
                    <div class="day-meta">
                        <span class="day-progress">${daySolved}/${filteredProblems.length}</span>
                        <span class="day-toggle">▼</span>
                    </div>
                </div>
                <div class="day-problems">
                    ${filteredProblems.map(p => renderProblem(p)).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderProblem(problem) {
    const key = `${problem.day}-${problem.name}`;
    const checked = progress[key] ? 'checked' : '';
    const diffClass = problem.difficulty.toLowerCase();

    return `
        <div class="problem-item">
            <div class="problem-checkbox ${checked}" onclick="toggleProblem('${escapeKey(key)}')"></div>
            <div class="problem-info">
                <div class="problem-name">
                    <a href="${problem.link}" target="_blank" rel="noopener noreferrer">${problem.name}</a>
                </div>
                <div class="problem-tags">
                    <span class="problem-tag">${problem.topic}</span>
                </div>
            </div>
            <span class="difficulty-badge ${diffClass}">${problem.difficulty}</span>
        </div>
    `;
}

function escapeKey(key) {
    return key.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function toggleDay(day) {
    const card = document.querySelector(`.day-card[data-day="${day}"]`);
    if (card) {
        card.classList.toggle('expanded');
    }
}

function toggleProblem(key) {
    progress[key] = !progress[key];
    saveState(progress);
    updateStats();
    renderDays();
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderDays();
    });
});

// Initialize
function init() {
    updateStats();
    renderTopicFilters();
    renderDays();
}

init();
