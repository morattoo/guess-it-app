<template>
  <div class="dashboard-layout">
    <!-- Header -->
    <header class="dashboard-header">
      <button
        class="burger-btn"
        @click="toggleSidebar"
        :aria-expanded="isSidebarOpen"
        aria-controls="sidebar-nav"
        aria-label="Toggle navigation menu"
      >
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>

      <h1 class="dashboard-title">{{ pageTitle }}</h1>

      <button class="back-btn" @click="goBack" aria-label="Go back">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </header>

    <!-- Overlay for mobile -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
      aria-hidden="true"
    ></div>

    <!-- Sidebar -->
    <aside id="sidebar-nav" class="dashboard-sidebar" :class="{ 'is-open': isSidebarOpen }">
      <div>
        <button class="dashboard-sidebar__bt-close" @click="closeSidebar">Close</button>
      </div>
      <div class="sidebar-content">
        <!-- User Info -->
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-email">{{ userEmail }}</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav" aria-label="Dashboard navigation">
          <ul role="list">
            <li>
              <router-link
                to="/dashboard"
                class="nav-link"
                @click="closeSidebar"
                exact-active-class="active"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 10L10 3L17 10V17C17 17.5304 16.7893 18.0391 16.4142 18.4142C16.0391 18.7893 15.5304 19 15 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V10Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Dashboard</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/dashboard/questions-pool"
                class="nav-link"
                @click="closeSidebar"
                active-class="active"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M10 14V10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M10 6H10.01"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Questions Pool</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/dashboard/sessions"
                class="nav-link"
                @click="closeSidebar"
                active-class="active"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4C16 2.89543 15.1046 2 14 2Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path d="M8 6H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <path
                    d="M8 10H12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M8 14H10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span>Sessions</span>
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Logout Button -->
        <button class="logout-btn" @click="handleLogout">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 17H3C2.46957 17 1.96086 16.7893 1.58579 16.4142C1.21071 16.0391 1 15.5304 1 15V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14 13L19 8L14 3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M19 8H7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isSidebarOpen = ref(false);

// Mock user data - à remplacer avec les vraies données de Firebase Auth
const userName = ref('John Doe');
const userEmail = ref('john.doe@example.com');

const userInitials = computed(() => {
  return userName.value
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const pageTitle = computed(() => {
  const route = router.currentRoute.value;
  // Personnaliser selon la route
  if (route.path.includes('questions-pool')) return 'Questions Pool';
  if (route.path.includes('sessions')) return 'Sessions';
  return 'Dashboard';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const goBack = () => {
  router.back();
};

const handleLogout = async () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
// Mobile-first approach
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  min-width: 320px;
  margin: 0 auto;
  overflow: hidden;
  background-color: #f5f5f5;
}

// Header
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;

  .dashboard-title {
    flex: 1;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    color: #333;
  }

  .burger-btn,
  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }

    &:focus {
      outline: 2px solid #2f8cff;
      outline-offset: 2px;
    }
  }

  .burger-btn {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .burger-line {
      width: 20px;
      height: 2px;
      background-color: #333;
      border-radius: 2px;
      transition:
        transform 0.3s,
        opacity 0.3s;
    }

    &[aria-expanded='true'] {
      .burger-line:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }
      .burger-line:nth-child(2) {
        opacity: 0;
      }
      .burger-line:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }
    }
  }

  .back-btn {
    color: #666;
  }
}

// Sidebar Overlay
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 150;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Sidebar
.dashboard-sidebar {
  position: fixed;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100vh;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 200;
  transition: left 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &.is-open {
    left: 0;
  }

  .sidebar-content {
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 1.5rem;
  }
}

// User Info
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1.5rem;

  .user-avatar {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 1.125rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .user-details {
    flex: 1;
    min-width: 0;

    .user-name {
      margin: 0;
      font-weight: 600;
      font-size: 0.9375rem;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      margin: 0;
      font-size: 0.8125rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// Navigation
.sidebar-nav {
  flex: 1;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0.75rem 1rem;
    color: #666;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s;
    font-size: 0.9375rem;
    font-weight: 500;

    svg {
      flex-shrink: 0;
    }

    &:hover {
      background-color: #f5f5f5;
      color: #333;
    }

    &:focus {
      outline: 2px solid #2f8cff;
      outline-offset: -2px;
    }

    &.active {
      background-color: #e3f2ff;
      color: #2f8cff;
    }
  }
}

// Logout Button
.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #d33;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #fff5f5;
    border-color: #d33;
  }

  &:focus {
    outline: 2px solid #d33;
    outline-offset: 2px;
  }
}

// Main Content
.dashboard-main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  min-height: 0;
}

.dashboard-container {
  width: 100%;
}

.dashboard-sidebar__bt-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }

  &:focus {
    outline: 2px solid #2f8cff;
    outline-offset: 2px;
  }
}

// Media Query: Fixed width at 768px on larger screens
@media (min-width: 768px) {
  .dashboard-layout {
    width: 768px;
  }
}
</style>
