// GitHub API Configuration
const API_BASE_URL = 'https://api.github.com';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const userProfile = document.getElementById('userProfile');

// Profile Elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userBio = document.getElementById('userBio');
const userLocation = document.getElementById('userLocation');
const userCompany = document.getElementById('userCompany');
const publicRepos = document.getElementById('publicRepos');
const followers = document.getElementById('followers');
const following = document.getElementById('following');
const publicGists = document.getElementById('publicGists');
const githubLink = document.getElementById('githubLink');
const shareBtn = document.getElementById('shareBtn');
const reposList = document.getElementById('reposList');

// Event Listeners
searchBtn.addEventListener('click', searchUser);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchUser();
    }
});

shareBtn.addEventListener('click', shareProfile);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a username in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    if (username) {
        searchInput.value = username;
        searchUser();
    }
    
    // Add animation to hero elements
    animateHeroElements();
});

// Animation for hero elements
function animateHeroElements() {
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .search-container');
    heroElements.forEach((el, index) => {
        el.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.opacity = '1';
        }, index * 100);
    });
}

// Search User Function
async function searchUser() {
    const username = searchInput.value.trim();
    
    if (!username) {
        showError('Please enter a GitHub username');
        return;
    }
    
    // Reset UI
    hideError();
    hideProfile();
    showLoader();
    
    try {
        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/users/${username}`);
        
        if (!userResponse.ok) {
            if (userResponse.status === 404) {
                throw new Error('User not found. Please try another username.');
            }
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        
        // Fetch user repositories
        const reposResponse = await fetch(`${API_BASE_URL}/users/${username}/repos?sort=updated&per_page=6`);
        const reposData = await reposResponse.json();
        
        // Display user profile
        displayUserProfile(userData);
        displayRepositories(reposData);
        
        // Update URL
        const newUrl = `${window.location.pathname}?user=${username}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

// Display User Profile
function displayUserProfile(user) {
    // Set avatar
    userAvatar.src = user.avatar_url;
    userAvatar.alt = `${user.login}'s avatar`;
    
    // Set user info
    userName.textContent = user.name || user.login;
    userBio.textContent = user.bio || 'No bio available';
    
    // Set location
    if (user.location) {
        userLocation.classList.remove('hidden');
        userLocation.querySelector('.location-text').textContent = user.location;
    } else {
        userLocation.classList.add('hidden');
    }
    
    // Set company
    if (user.company) {
        userCompany.classList.remove('hidden');
        userCompany.querySelector('.company-text').textContent = user.company;
    } else {
        userCompany.classList.add('hidden');
    }
    
    // Set stats with animation
    animateNumber(publicRepos, user.public_repos);
    animateNumber(followers, user.followers);
    animateNumber(following, user.following);
    animateNumber(publicGists, user.public_gists);
    
    // Set GitHub link
    githubLink.href = user.html_url;
    
    // Show profile
    showProfile();
}

// Animate numbers
function animateNumber(element, target) {
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Display Repositories
function displayRepositories(repos) {
    if (repos.length === 0) {
        reposList.innerHTML = '<p class="no-repos">No public repositories found</p>';
        return;
    }
    
    reposList.innerHTML = repos.map((repo, index) => `
        <div class="repo-card" style="animation-delay: ${index * 0.1}s">
            <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
            <p class="repo-description">${repo.description || 'No description available'}</p>
            <div class="repo-stats">
                ${repo.language ? `
                    <span class="language-badge">
                        <span class="language-dot" style="background: ${getLanguageColor(repo.language)}"></span>
                        ${repo.language}
                    </span>
                ` : ''}
                <span class="repo-stat">
                    <svg class="repo-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    ${repo.stargazers_count}
                </span>
                <span class="repo-stat">
                    <svg class="repo-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12h8"></path>
                        <path d="M12 8v8"></path>
                    </svg>
                    ${repo.forks_count}
                </span>
                ${repo.open_issues_count > 0 ? `
                    <span class="repo-stat">
                        <svg class="repo-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        ${repo.open_issues_count}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Get language color
function getLanguageColor(language) {
    const colors = {
        JavaScript: '#f1e05a',
        Python: '#3572A5',
        Java: '#b07219',
        TypeScript: '#2b7489',
        CSS: '#563d7c',
        HTML: '#e34c26',
        PHP: '#4F5D95',
        Ruby: '#701516',
        Go: '#00ADD8',
        Swift: '#ffac45',
        'C++': '#f34b7d',
        'C#': '#178600',
        Rust: '#dea584',
        Kotlin: '#F18E33',
        Vue: '#4fc08d',
        React: '#61dafb'
    };
    return colors[language] || '#8257e6';
}

// Share Profile Function
function shareProfile() {
    const username = searchInput.value.trim();
    const url = `${window.location.origin}${window.location.pathname}?user=${username}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${userName.textContent} - GitHub Profile`,
            text: `Check out ${userName.textContent}'s GitHub profile!`,
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback - copy to clipboard
        copyToClipboard(url);
        showToast('Profile link copied to clipboard!');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--gradient-1);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .no-repos {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem;
        background: rgba(22, 27, 34, 0.5);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }
`;
document.head.appendChild(style);

// UI Helper Functions
function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showProfile() {
    userProfile.classList.remove('hidden');
}

function hideProfile() {
    userProfile.classList.add('hidden');
}

// Add search suggestions (bonus feature)
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const value = e.target.value.trim();
    
    if (value.length > 2) {
        searchTimeout = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    }
});

async function fetchSuggestions(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/search/users?q=${query}&per_page=5`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            showSuggestions(data.items);
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function showSuggestions(users) {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.suggestions-dropdown');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    // Create suggestions dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'suggestions-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-top: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 100;
        box-shadow: var(--shadow-lg);
    `;
    
    dropdown.innerHTML = users.map(user => `
        <div class="suggestion-item" data-username="${user.login}" style="
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            transition: background 0.2s ease;
        ">
            <img src="${user.avatar_url}" alt="${user.login}" style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
            ">
            <span>${user.login}</span>
        </div>
    `).join('');
    
    // Add hover effect
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(102, 126, 234, 0.1)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
        item.addEventListener('click', () => {
            searchInput.value = item.dataset.username;
            dropdown.remove();
            searchUser();
        });
    });
    
    // Append to search container
    const searchContainer = document.querySelector('.search-container');
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            dropdown.remove();
        }
    }, { once: true });
}