import {
  getAdminAnalytics,
  getAdminQuests,
  createQuest,
  updateQuest,
  deleteQuest,
} from '../api/admin.js';
import { showToast } from '../utils/toast.js';

let analyticsData = null;
let questsData = [];

export function renderAdminDashboard(container) {
  // Check if admin is logged in
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    window.location.href = '/admin';
    return;
  }

  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5]">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="/tokilogo.png" alt="Tokicard Logo" width="80">
              <h1 class="text-xl font-semibold text-black">Admin Dashboard</h1>
            </div>
            <button
              id="logout-btn"
              class="px-4 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Analytics Section -->
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-black mb-6">User Analytics</h2>
          <div id="analytics-loading" class="text-center py-8 text-gray-500">
            Loading analytics...
          </div>
          <div id="analytics-content" class="hidden">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Total Users</div>
                <div class="text-3xl font-bold text-black" id="stat-total-users">-</div>
              </div>
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Verified Users</div>
                <div class="text-3xl font-bold text-green-600" id="stat-verified-users">-</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Total Points</div>
                <div class="text-3xl font-bold text-purple-600" id="stat-total-points">-</div>
              </div>
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Quest Completions</div>
                <div class="text-3xl font-bold text-blue-600" id="stat-completions">-</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Users (Last 7 Days)</div>
                <div class="text-2xl font-bold text-black" id="stat-recent-users">-</div>
              </div>
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="text-sm text-gray-600 mb-1">Users (Last 30 Days)</div>
                <div class="text-2xl font-bold text-black" id="stat-monthly-users">-</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tasks/Quests Management Section -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-black">Task Management</h2>
            <button
              id="add-quest-btn"
              class="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
            >
              + Add New Task
            </button>
          </div>

          <div id="quests-loading" class="text-center py-8 text-gray-500">
            Loading tasks...
          </div>
          <div id="quests-content" class="hidden">
            <div id="quests-list" class="space-y-4"></div>
          </div>
        </section>
      </div>

      <!-- Add/Edit Quest Modal -->
      <div id="quest-modal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style="display: none;">
        <div class="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-black" id="modal-title">Add New Task</h3>
            <button
              id="close-modal-btn"
              class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <form id="quest-form">
            <input type="hidden" id="quest-id" />
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL-friendly identifier)
              </label>
              <input
                type="text"
                id="quest-slug"
                required
                placeholder="e.g., follow-founder"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                id="quest-title"
                required
                placeholder="e.g., Follow our Founder"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="quest-description"
                rows="3"
                placeholder="Task description"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Points</label>
              <input
                type="number"
                id="quest-points"
                required
                min="0"
                placeholder="50"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                id="quest-sort-order"
                min="0"
                placeholder="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
              />
            </div>
            <div class="flex gap-3">
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
              >
                Save
              </button>
              <button
                type="button"
                id="cancel-modal-btn"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Load data
  loadAnalytics();
  loadQuests();

  // Event listeners
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
  });

  document.getElementById('add-quest-btn').addEventListener('click', () => {
    openQuestModal();
  });

  document.getElementById('close-modal-btn').addEventListener('click', closeQuestModal);
  document.getElementById('cancel-modal-btn').addEventListener('click', closeQuestModal);

  document.getElementById('quest-modal').addEventListener('click', (e) => {
    if (e.target.id === 'quest-modal') {
      closeQuestModal();
    }
  });

  document.getElementById('quest-form').addEventListener('submit', handleQuestSubmit);
}

async function loadAnalytics() {
  try {
    const data = await getAdminAnalytics();
    analyticsData = data;
    renderAnalytics(data);
  } catch (error) {
    showToast('Failed to load analytics: ' + error.message);
    console.error('Analytics error:', error);
  }
}

function renderAnalytics(data) {
  document.getElementById('analytics-loading').classList.add('hidden');
  document.getElementById('analytics-content').classList.remove('hidden');

  document.getElementById('stat-total-users').textContent = data.overview.totalUsers.toLocaleString();
  document.getElementById('stat-verified-users').textContent = data.overview.verifiedUsers.toLocaleString();
  document.getElementById('stat-total-points').textContent = data.overview.totalPoints.toLocaleString();
  document.getElementById('stat-completions').textContent = data.overview.totalCompletions.toLocaleString();
  document.getElementById('stat-recent-users').textContent = data.overview.recentUsers.toLocaleString();
  document.getElementById('stat-monthly-users').textContent = data.overview.monthlyUsers.toLocaleString();
}

async function loadQuests() {
  try {
    const data = await getAdminQuests();
    questsData = data.quests;
    renderQuests(data.quests);
  } catch (error) {
    showToast('Failed to load tasks: ' + error.message);
    console.error('Quests error:', error);
  }
}

function renderQuests(quests) {
  document.getElementById('quests-loading').classList.add('hidden');
  document.getElementById('quests-content').classList.remove('hidden');

  const questsList = document.getElementById('quests-list');
  if (quests.length === 0) {
    questsList.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center text-gray-500">
        No tasks yet. Click "Add New Task" to create one.
      </div>
    `;
    return;
  }

  questsList.innerHTML = quests
    .map(
      (quest) => `
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-black mb-1">${quest.title}</h3>
          <div class="text-sm text-gray-600 mb-2">Slug: <code class="bg-gray-100 px-2 py-1 rounded">${quest.slug}</code></div>
          ${quest.description ? `<p class="text-sm text-gray-600 mb-2">${quest.description}</p>` : ''}
          <div class="flex items-center gap-4 text-sm">
            <span class="text-gray-600">Points: <span class="font-semibold text-purple-600">${quest.points}</span></span>
            <span class="text-gray-600">Sort Order: <span class="font-semibold">${quest.sortOrder}</span></span>
            <span class="text-gray-600">Completions: <span class="font-semibold text-blue-600">${quest.completionCount}</span></span>
          </div>
        </div>
        <div class="flex gap-2 ml-4">
          <button
            class="edit-quest-btn px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            data-quest-id="${quest.id}"
          >
            Edit
          </button>
          <button
            class="delete-quest-btn px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            data-quest-id="${quest.id}"
            data-quest-title="${quest.title}"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  // Attach event listeners
  document.querySelectorAll('.edit-quest-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const questId = e.target.dataset.questId;
      const quest = questsData.find((q) => q.id === questId);
      if (quest) {
        openQuestModal(quest);
      }
    });
  });
  

  document.querySelectorAll('.delete-quest-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const questId = e.target.dataset.questId;
      const questTitle = e.target.dataset.questTitle;
      if (confirm(`Are you sure you want to delete "${questTitle}"? This action cannot be undone.`)) {
        handleDeleteQuest(questId);
      }
    });
  });
}

function openQuestModal(quest = null) {
  const modal = document.getElementById('quest-modal');
  const form = document.getElementById('quest-form');
  const title = document.getElementById('modal-title');
  const idInput = document.getElementById('quest-id');
  const slugInput = document.getElementById('quest-slug');
  const titleInput = document.getElementById('quest-title');
  const descInput = document.getElementById('quest-description');
  const pointsInput = document.getElementById('quest-points');
  const sortOrderInput = document.getElementById('quest-sort-order');

  if (quest) {
    title.textContent = 'Edit Task';
    idInput.value = quest.id;
    slugInput.value = quest.slug;
    slugInput.disabled = true; // Don't allow editing slug
    titleInput.value = quest.title;
    descInput.value = quest.description || '';
    pointsInput.value = quest.points;
    sortOrderInput.value = quest.sortOrder;
  } else {
    title.textContent = 'Add New Task';
    form.reset();
    idInput.value = '';
    slugInput.disabled = false;
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeQuestModal() {
  const modal = document.getElementById('quest-modal');
  modal.classList.add('hidden');
  modal.style.display = 'none';
  document.getElementById('quest-form').reset();
  document.getElementById('quest-id').value = '';
  document.getElementById('quest-slug').disabled = false;
}

async function handleQuestSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('quest-id').value;
  const slug = document.getElementById('quest-slug').value.trim();
  const title = document.getElementById('quest-title').value.trim();
  const description = document.getElementById('quest-description').value.trim();
  const points = parseInt(document.getElementById('quest-points').value, 10);
  const sortOrder = parseInt(document.getElementById('quest-sort-order').value, 10) || 100;

  if (!slug || !title || isNaN(points)) {
    showToast('Please fill in all required fields');
    return;
  }

  try {
    if (id) {
      // Update
      await updateQuest(id, {
        title,
        description: description || null,
        points,
        sortOrder,
      });
      showToast('Task updated successfully!');
    } else {
      // Create
      await createQuest({
        slug,
        title,
        description: description || null,
        points,
        sortOrder,
      });
      showToast('Task created successfully!');
    }

    closeQuestModal();
    loadQuests();
    loadAnalytics(); // Refresh analytics to update quest stats
  } catch (error) {
    showToast('Failed to save task: ' + error.message);
    console.error('Quest save error:', error);
  }
}

async function handleDeleteQuest(questId) {
  try {
    await deleteQuest(questId);
    showToast('Task deleted successfully!');
    loadQuests();
    loadAnalytics(); // Refresh analytics
  } catch (error) {
    showToast('Failed to delete task: ' + error.message);
    console.error('Quest delete error:', error);
  }
}

