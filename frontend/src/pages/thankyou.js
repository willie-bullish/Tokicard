import { fetchQuests, completeQuest } from '../api/quests.js';
import { fetchReferrals } from '../api/referrals.js';

const REFERRAL_REWARD_POINTS = 100;

const QUEST_DEFINITIONS = [
  {
    slug: 'follow-x',
    title: 'Follow Tokicard on X',
    description: '@tokicard',
    points: 50,
    actionLabel: 'Follow',
    href: 'https://x.com/intent/follow?screen_name=tokicardAI',
  },
  {
    slug: 'follow-instagram',
    title: 'Follow Tokicard on Instagram',
    description: '@tokicard',
    points: 50,
    actionLabel: 'Follow',
    href: 'https://instagram.com/tokicard',
  },
  {
    slug: 'join-telegram',
    title: 'Join the Tokicard Telegram community',
    description: 'Community updates',
    points: 50,
    actionLabel: 'Join',
    href: 'https://t.me/tokicard',
  },
];

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error('Failed to parse stored user profile', error);
    return null;
  }
}

function setStoredUser(user) {
  if (!user) return;
  localStorage.setItem('user', JSON.stringify(user));
}

export function renderThankYouPage(container, referralCode = null) {
  const storedUser = getStoredUser();
  const fallbackName =
    storedUser?.fullName ||
    localStorage.getItem('pendingReferralName') ||
    'USER';
  const effectiveReferralCode = storedUser?.referralCode || referralCode || null;

  const displayName =
    storedUser?.fullName?.toUpperCase() ||
    fallbackName.toUpperCase() ||
    'USER';

  const pointsRaw =
    storedUser?.points ??
    storedUser?.score ??
    storedUser?.rewardPoints ??
    storedUser?.tasksPoints ??
    0;

  const pointsValue = Number(pointsRaw) || 0;
  const formattedPoints = (pointsValue / 100).toFixed(2);
  const questsHtml = QUEST_DEFINITIONS.map((quest) => renderQuestRow(quest)).join('');
  
  container.innerHTML = `
    <div class="min-h-screen bg-[#fafafa] flex flex-col">
      <nav class="fixed top-0 inset-x-0 z-40 h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between bg-[#fafafa] border-b border-[#E5E5E5]">
        <div class="flex items-center gap-2">
          <img src="/tokilogo.png" alt="Tokicard" class="w-[118px]">
        </div>
        <div class="relative">
          <button 
            id="menu-button"
            class="p-2 rounded-full border border-[#E5E5E5] bg-white shadow-sm hover:bg-gray-100 transition-colors"
            aria-haspopup="true"
            aria-expanded="false"
            aria-controls="menu-dropdown"
          >
            <span class="sr-only">Open menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div 
            id="menu-dropdown"
            class="hidden absolute right-0 mt-3 w-40 rounded-[14px] bg-white border border-[#E5E5E5] shadow-xl py-2 z-50"
            role="menu"
            aria-labelledby="menu-button"
          >
            <button
              id="roadmap-btn"
              class="w-full text-left px-4 py-2 text-[14px] text-[#9CA3AF] cursor-not-allowed opacity-60"
              role="menuitem"
              type="button"
              disabled
              aria-disabled="true"
            >
              Roadmap
            </button>
            <div class="h-px bg-[#E5E5E5] my-1"></div>
            <button
              id="logout-btn"
              class="w-full text-left px-4 py-2 text-[14px] text-red-500 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              Logout
            </button>
          </div>
      </div>
      </nav>
      <div class="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 mt-20 sm:mt-24 pb-12 gap-10">
      <div class="w-full max-w-[480px] bg-[#f5f5f5] rounded-[24px] sm:p-12 flex flex-col items-center shadow-sm maincard" style="opacity: 1; transform: none;">
        <div class="w-full max-w-[340px] sm:max-w-[380px] mb-8 sm:mb-10" style="opacity: 1; transform: none;">
          <div class="relative w-full">
            <img src="/customercard.png" alt="Tokicard Virtual Card" class="w-full h-auto rounded-[16px] sm:rounded-[20px] shadow-2xl">
              <div class="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <p class="text-white text-[11px] sm:text-[13px] md:text-[15px] tracking-wide leading-none uppercase" style="font-weight: 600; text-shadow: rgba(0, 0, 0, 0.1) 0px 1px 2px;">
                ${displayName}
              </p>
                <p class="text-white text-[11px] sm:text-[12px] md:text-[14px] font-semibold tracking-wide leading-none" style="text-shadow: rgba(0, 0, 0, 0.12) 0px 1px 2px;" data-points-display>
                  $${formattedPoints}
                </p>
            </div>
          </div>
        </div>
        <h1 class="text-[24px] sm:text-[28px] leading-[1.2] mb-4 text-center text-black yourin" style="font-weight: 600; opacity: 1; transform: none;">
          You're In!
        </h1>
        <p class="text-[14px] sm:text-[15px] leading-[1.6] text-center text-[#666666] mb-6 sm:mb-10" style="font-weight: 400; opacity: 1; transform: none;">
          Your early access request has been received. You'll be among the first to experience Tokicard when we go live.
        </p>
        <div class="w-full text-left bg-white rounded-[20px] border border-[#E5E5E5] shadow-sm py-6 px-6 sm:px-8 mt-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-[18px] sm:text-[20px] font-semibold text-[#111111]">Quests</h2>
              <p class="text-[12px] sm:text-[13px] text-[#6B7280]">Complete actions to earn more points</p>
            </div>
            <span class="text-[11px] sm:text-[12px] text-[#6B7280] font-medium">Point conversion: 100 pts = $1</span>
          </div>
          <div class="space-y-3">
            ${questsHtml}
          </div>
          <div id="quest-error" class="text-red-500 text-[12px] sm:text-[13px] mt-3 hidden"></div>
        </div>
        <div class="w-full mt-6 text-center" style="opacity: 1; transform: none;">
          <p class="text-[16px] sm:text-[18px] text-[#111827] mb-2 font-semibold">
            Refer your friends to Tokicard
          </p>
          <p class="text-[12px] sm:text-[13px] text-[#6B7280] mb-4">
            Earn 100 points ($1) for every friend who joins Tokicard
          </p>
          <div class="flex items-center justify-between w-full max-w-[480px] bg-[#F8F8F8] border border-[#E5E5E5] rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-sm mx-auto overflow-hidden" style="box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 3px;">
            <div class="flex items-center flex-1 min-w-0 gap-2 mycontainer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-1.415 1.415a4 4 0 01-5.657-5.656l.708-.708m8.486 0l.708-.708a4 4 0 015.657 5.656l-1.415 1.415a4 4 0 01-5.657-5.656z"></path>
              </svg>
              <p 
                id="referral-link" 
                class="text-[9.5px] sm:text-[13.5px] text-gray-700 font-medium truncate mylink overflow-hidden text-ellipsis whitespace-nowrap" 
                title="${
                  effectiveReferralCode
                    ? `${window.location.origin}/register?ref=${effectiveReferralCode}`
                    : 'Referral link loading...'
                }"
              >
                ${
                  effectiveReferralCode
                    ? `${window.location.origin}/register?ref=${effectiveReferralCode}`
                    : 'Loading referral link...'
                }
              </p>
            </div>
            <button 
              id="copy-btn"
              class="ml-3 sm:ml-4 bg-black text-white text-[13px] sm:text-[14px] font-medium rounded-full px-4 sm:px-5 copybutton sm:py-6 hover:bg-[#222] active:scale-[0.97] transition-all duration-200"
            >
              Copy link
            </button>
          </div>
        </div>

        <div class="w-full mt-6 text-left bg-white rounded-[20px] border border-[#E5E5E5] shadow-sm py-6 px-6 sm:px-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 id="referrals-header" class="text-[16px] sm:text-[18px] font-semibold text-[#111111]">
                Your referrals
              </h3>
              <p class="text-[12px] sm:text-[13px] text-[#6B7280]">Friends who have joined through your link</p>
            </div>
          <span
            id="referral-points-earned"
            class="text-[12px] sm:text-[13px] font-semibold text-[#111827]"
            title="Total verified referral points"
          >
            0 pts
          </span>
          </div>
          <ul id="referrals-list" class="space-y-2"></ul>
          <p id="referrals-empty" class="text-[12px] sm:text-[13px] text-[#6B7280] italic">You haven’t referred anyone yet.</p>
          <div id="referrals-pagination"></div>
        </div>
        <p class="text-[12px] sm:text-[13px] leading-[1.5] text-center text-[#999999] mt-6" style="font-weight: 400; opacity: 1;">
          Follow us for updates, launch announcements, and lifestyle previews.
        </p>
      </div>
      </div>
    </div>
  `;

  // Attach event handlers
  attachThankYouHandlers(effectiveReferralCode);
  attachQuestHandlers();
  updatePointsDisplay();
  hydrateQuests();
  hydrateReferrals();
  clearQuestError();
}

function attachThankYouHandlers(referralCode) {
  // Copy referral link
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.dataset.referral = referralCode || '';
  } else {
    return;
  }
  
  copyBtn.addEventListener('click', async () => {
    const activeReferral =
      copyBtn.dataset.referral || referralCode || getStoredUser()?.referralCode || '';
    if (!activeReferral) {
      showQuestError('Referral link is not ready yet. Please try again shortly.');
      return;
    }
    const referralLink = `${window.location.origin}/register?ref=${activeReferral}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('bg-green-600');
      setTimeout(() => {
        copyBtn.textContent = 'Copy link';
        copyBtn.classList.remove('bg-green-600');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy link';
      }, 2000);
    }
  });

  // Navbar interactions
  const menuButton = document.getElementById('menu-button');
  const menuDropdown = document.getElementById('menu-dropdown');
  const roadmapBtn = document.getElementById('roadmap-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (!menuButton || !menuDropdown) {
    return;
  }
  
  const toggleMenu = () => {
    const isHidden = menuDropdown.classList.contains('hidden');
    menuDropdown.classList.toggle('hidden');
    menuButton.setAttribute('aria-expanded', String(isHidden));
  };

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  if (window._thankyouMenuOutsideHandler) {
    document.removeEventListener('click', window._thankyouMenuOutsideHandler);
  }

  const handleOutsideClick = (e) => {
    if (menuDropdown.classList.contains('hidden')) return;
    if (menuDropdown.contains(e.target) || menuButton.contains(e.target)) return;
    menuDropdown.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
  };

  window._thankyouMenuOutsideHandler = handleOutsideClick;
  document.addEventListener('click', handleOutsideClick);

  if (roadmapBtn) {
    roadmapBtn.disabled = true;
    roadmapBtn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.history.pushState({}, '', '/login');
      import('./login.js').then(({ renderLoginPage }) => {
        renderLoginPage(document.getElementById('root'));
      });
    });
  }
}

function attachQuestHandlers() {
  const buttons = document.querySelectorAll('[data-quest-action]');
  buttons.forEach((button) => {
    button.dataset.state = button.dataset.state || 'default';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const slug = button.dataset.slug;
      if (!slug) return;

      const definition = QUEST_DEFINITIONS.find((quest) => quest.slug === slug);
      const currentState = button.dataset.state || 'default';

      if (currentState === 'default') {
        if (definition?.href) {
          window.open(definition.href, '_blank', 'noopener');
        }
        setButtonToVerify(button);
        return;
      }

      if (currentState === 'verify') {
        await handleQuestCompletion(button, slug);
      }
    });
  });
}

function setButtonToDefault(button, actionLabel) {
  button.dataset.state = 'default';
  button.dataset.completed = 'false';
  button.disabled = false;
  button.textContent = actionLabel;
  button.classList.remove(
    'bg-green-600',
    'border-green-600',
    'hover:bg-green-700',
    'opacity-60',
    'cursor-not-allowed',
    'bg-[#111827]',
    'border-[#111827]',
    'text-white'
  );
  button.classList.add('bg-white', 'text-black', 'border', 'border-black', 'hover:bg-black', 'hover:text-white');
}

function setButtonToVerify(button) {
  button.dataset.state = 'verify';
  button.dataset.completed = 'false';
  button.disabled = false;
  button.textContent = 'Verify';
  button.classList.remove(
    'bg-white',
    'text-black',
    'border-black',
    'hover:bg-black',
    'hover:text-white',
    'opacity-60',
    'cursor-not-allowed',
    'bg-[#111827]',
    'border-[#111827]'
  );
  button.classList.add('bg-green-600', 'text-white', 'border', 'border-green-600', 'hover:bg-green-700');
}

function setButtonToCompleted(button) {
  button.dataset.state = 'completed';
  button.dataset.completed = 'true';
  button.disabled = true;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle text-green-600">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `;
  // Remove all button container styling
  button.className = '';
  button.classList.add('bg-transparent', 'border-0', 'p-0', 'hover:bg-transparent', 'cursor-default');
}

function hydrateQuests() {
  if (!localStorage.getItem('authToken')) return;

  fetchQuests()
    .then((data) => {
      data?.quests?.forEach((quest) => {
        updateQuestRow(quest.slug, quest);
      });
    })
    .catch((error) => {
      console.error('Failed to load quests', error);
    });
}

function hydrateReferrals(page = 1) {
  const list = document.getElementById('referrals-list');
  const emptyState = document.getElementById('referrals-empty');
  const header = document.getElementById('referrals-header');
  const pagination = document.getElementById('referrals-pagination');
  const referralLinkElement = document.getElementById('referral-link');
  const copyBtn = document.getElementById('copy-btn');
  const referralPointsElement = document.getElementById('referral-points-earned');

  if (!list || !emptyState || !header) {
    return;
  }

  list.innerHTML = `
    <li class="animate-pulse rounded-[16px] bg-[#F3F4F6] px-4 py-4">
      <div class="h-4 bg-[#E5E7EB] rounded w-1/2 mb-2"></div>
      <div class="h-3 bg-[#E5E7EB] rounded w-1/3"></div>
    </li>
    <li class="animate-pulse rounded-[16px] bg-[#F3F4F6] px-4 py-4">
      <div class="h-4 bg-[#E5E7EB] rounded w-1/2 mb-2"></div>
      <div class="h-3 bg-[#E5E7EB] rounded w-1/3"></div>
    </li>
    <li class="animate-pulse rounded-[16px] bg-[#F3F4F6] px-4 py-4">
      <div class="h-4 bg-[#E5E7EB] rounded w-1/2 mb-2"></div>
      <div class="h-3 bg-[#E5E7EB] rounded w-1/3"></div>
    </li>
  `;
  emptyState.classList.add('hidden');
  if (pagination) pagination.innerHTML = '';

  fetchReferrals(page, 10)
    .then((data) => {
      const referrals = data?.referrals ?? [];
      const total = data?.total ?? 0;
      const currentPage = data?.page ?? 1;
      const pageSize = data?.pageSize ?? 10;
      const totalPages = Math.max(Math.ceil(total / pageSize), 1);
      const referralCode = data?.referralCode || getStoredUser()?.referralCode || null;

      if (typeof data?.points === 'number') {
        const storedUser = getStoredUser() || {};
        storedUser.points = Number(data.points);
        if (referralCode) {
          storedUser.referralCode = referralCode;
        }
        setStoredUser(storedUser);
        updatePointsDisplay();
      }

      if (header) {
        header.textContent = `Your referrals (${total})`;
      }

      if (referralLinkElement) {
        if (referralCode) {
          const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;
          referralLinkElement.textContent = referralUrl;
          referralLinkElement.title = referralUrl;
          referralLinkElement.classList.remove('text-gray-400');
        } else {
          referralLinkElement.textContent = 'Loading referral link...';
          referralLinkElement.title = '';
          referralLinkElement.classList.add('text-gray-400');
        }
      }

      if (copyBtn) {
        copyBtn.disabled = !referralCode;
        copyBtn.classList.toggle('opacity-60', !referralCode);
        copyBtn.dataset.referral = referralCode || '';
      }

      if (referralPointsElement) {
        const verifiedCount = referrals.filter((referral) => referral.isVerified).length;
        referralPointsElement.textContent = `${verifiedCount * REFERRAL_REWARD_POINTS} pts`;
      }

      if (!referrals.length) {
        list.innerHTML = '';
        emptyState.textContent = 'You haven’t referred anyone yet.';
        emptyState.classList.remove('hidden');
        if (header) {
          header.textContent = 'Your referrals (0)';
        }
        if (pagination) pagination.innerHTML = '';
        return;
      }

      list.innerHTML = referrals.map(renderReferralListItem).join('');
      emptyState.classList.add('hidden');

      if (pagination) {
        pagination.innerHTML = renderPagination({
          currentPage,
          totalPages,
        });
        pagination.querySelectorAll('[data-page]').forEach((button) => {
          button.addEventListener('click', () => {
            const targetPage = Number(button.dataset.page);
            hydrateReferrals(targetPage);
          });
        });
      }
    })
    .catch((error) => {
      console.error('Failed to load referrals', error);
      list.innerHTML = '';
      emptyState.textContent = 'Unable to load referrals right now.';
      emptyState.classList.remove('hidden');
      if (header) {
        header.textContent = 'Your referrals';
      }
      if (pagination) pagination.innerHTML = '';
      if (copyBtn) {
        copyBtn.disabled = true;
        copyBtn.classList.add('opacity-60');
        copyBtn.dataset.referral = '';
      }
      if (referralPointsElement) {
        referralPointsElement.textContent = '0 pts';
      }
    });
}

function updatePointsDisplay() {
  const storedUser = getStoredUser();
  const element = document.querySelector('[data-points-display]');
  if (!element) return;

  const pointsValue = Number(storedUser?.points ?? 0);
  element.textContent = `$${(pointsValue / 100).toFixed(2)}`;
}

function updateQuestRow(slug, questData = {}) {
  const row = document.querySelector(`[data-quest-row="${slug}"]`);
  const definition = QUEST_DEFINITIONS.find((quest) => quest.slug === slug);
  if (!row || !definition) {
    return;
  }
  const descriptionEl = row.querySelector('[data-quest-description]');
  const pointsEl = row.querySelector('[data-quest-points]');
  const button = row.querySelector('[data-quest-action]');

  if (descriptionEl && (questData.description || definition?.description)) {
    descriptionEl.textContent = questData.description || definition?.description || '';
  }

  if (pointsEl) {
    const pointsValue = questData.points ?? definition?.points ?? Number(pointsEl.dataset.points ?? 0);
    pointsEl.textContent = `${pointsValue} pts`;
    pointsEl.dataset.points = pointsValue;
  }

  if (button) {
    if (questData.completed) {
      setButtonToCompleted(button);
    } else if (button.dataset.state === 'verify') {
      setButtonToVerify(button);
    } else {
      setButtonToDefault(button, definition?.actionLabel || 'Open');
    }
  }
}

async function handleQuestCompletion(button, slug) {
  if (button.dataset.completed === 'true') {
    return;
  }

  if (button.dataset.state !== 'verify') {
    return;
  }

  const definition = QUEST_DEFINITIONS.find((quest) => quest.slug === slug);
  if (!definition) {
    return;
  }
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Verifying...';
  button.classList.add('opacity-60');
  clearQuestError();

  try {
    const result = await completeQuest(slug);

    if (!result?.alreadyCompleted) {
      const user = getStoredUser();
      if (user) {
        user.points = Number(user.points || 0) + Number(result?.pointsAwarded || 0);
        setStoredUser(user);
        updatePointsDisplay();
      }
    }

    setButtonToCompleted(button);
    updateQuestRow(slug, { completed: true });
    hydrateQuests();
  } catch (error) {
    console.error('Failed to complete quest', error);
    showQuestError(error.message || 'Unable to complete quest right now.');
    button.disabled = false;
    button.classList.remove('opacity-60');
    setButtonToVerify(button);
  }
}

function showQuestError(message) {
  const element = document.getElementById('quest-error');
  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.remove('hidden');

  clearTimeout(showQuestError._timer);
  showQuestError._timer = setTimeout(() => {
    element.classList.add('hidden');
  }, 4000);
}

function clearQuestError() {
  const element = document.getElementById('quest-error');
  if (!element) return;
  element.classList.add('hidden');
}

function renderQuestRow({ slug, title, description, points, actionLabel }) {
  return `
    <div class="flex items-center justify-between gap-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[16px] px-4 py-3 sm:px-5 sm:py-4" data-quest-row="${slug}">
      <div>
        <p class="text-[14px] sm:text-[15px] font-semibold text-[#111827]">${title}</p>
        <p class="text-[12px] sm:text-[12px] text-[#6B7280]" data-quest-description>${description}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="bg-black text-white text-[11px] sm:text-[12px] font-semibold rounded-full px-3 py-1 whitespace-nowrap" data-quest-points data-points="${points}">${points} pts</span>
        <button
          type="button"
          class="bg-white border border-black text-black text-[12px] sm:text-[13px] font-medium rounded-full px-4 py-2 hover:bg-black hover:text-white transition-colors"
          data-quest-action
          data-slug="${slug}"
          data-state="default"
          data-completed="false"
        >
          ${actionLabel}
        </button>
      </div>
    </div>
  `;
}

function renderReferralListItem(referral) {
  const joinedDate = referral.createdAt
    ? formatReferralDate(referral.createdAt)
    : null;
  const statusLabel = referral.isVerified ? 'Joined' : 'Pending';
  const statusClass = referral.isVerified ? 'text-green-600' : 'text-[#F59E0B]';

  return `
    <li class="flex items-center justify-between gap-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[16px] px-4 py-3 sm:px-5 sm:py-4">
      <div>
        <p class="text-[13px] sm:text-[14px] font-medium text-[#111827]">${referral.email}</p>
        ${
          joinedDate
            ? `<p class="text-[11px] sm:text-[12px] text-[#6B7280]">Joined ${joinedDate}</p>`
            : ''
        }
      </div>
      <span class="text-[11px] sm:text-[12px] font-semibold ${statusClass}">
        ${statusLabel}
      </span>
    </li>
  `;
}

function renderPagination({ currentPage, totalPages }) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return `
    <div class="mt-4 flex items-center justify-between text-[12px] sm:text-[13px] text-[#6B7280]">
      <button
        type="button"
        class="px-3 py-1 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
        data-page="${currentPage - 1}"
        ${hasPrev ? '' : 'disabled'}
      >
        Previous
      </button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button
        type="button"
        class="px-3 py-1 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
        data-page="${currentPage + 1}"
        ${hasNext ? '' : 'disabled'}
      >
        Next
      </button>
    </div>
  `;
}

function formatReferralDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
