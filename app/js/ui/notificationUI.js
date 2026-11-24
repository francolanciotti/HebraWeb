/**
 * NotificationUI - Gestor de avisos emergentes (Toasts y Banners de notificaciones)
 */

export class NotificationUI {
  static showToast(message, icon = '✨', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
  }

  static showBanner(message, actionLabel = 'Ver', onActionCallback = null) {
    const banner = document.getElementById('notification-banner');
    const msgEl = document.getElementById('banner-message');
    const btnEl = document.getElementById('btn-banner-action');

    if (!banner || !msgEl || !btnEl) return;

    msgEl.textContent = message;
    btnEl.textContent = actionLabel;

    banner.classList.remove('hidden');

    const handleClick = () => {
      banner.classList.add('hidden');
      if (onActionCallback) onActionCallback();
      btnEl.removeEventListener('click', handleClick);
    };

    btnEl.addEventListener('click', handleClick);
  }

  static hideBanner() {
    const banner = document.getElementById('notification-banner');
    if (banner) banner.classList.add('hidden');
  }
}
