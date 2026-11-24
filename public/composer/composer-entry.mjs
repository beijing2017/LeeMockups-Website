export function selectedMockup(search) {
  const sku = new URLSearchParams(search).get('sku');
  return sku && /^LM-VM-[A-Z]{3}-\d{3}$/.test(sku) ? sku : null;
}

export async function startComposer({ search, loadRenderer, showLoading, showError }) {
  if (!selectedMockup(search)) return false;
  showLoading();
  try { await loadRenderer(); }
  catch (error) { showError(error); }
  return true;
}

if (typeof document !== 'undefined') {
  void startComposer({
    search: location.search,
    showLoading() {
      document.body.classList.remove('composer-empty');
      document.getElementById('status').textContent = 'Loading your mockup…';
      document.getElementById('progressDetail').textContent = 'Preparing the creator';
      document.getElementById('progressTrack').hidden = false;
      document.getElementById('sampleName').textContent = 'Loading selected mockup…';
      document.getElementById('uvHint').textContent = 'Loading the design area…';
    },
    async loadRenderer() {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './vendor/fflate.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('The creator could not load. Please refresh to try again.'));
        document.head.appendChild(script);
      });
      await import('./app-v8.js?v=20261115-empty');
    },
    showError(error) {
      document.getElementById('status').textContent = error.message || 'The creator could not load. Please refresh to try again.';
      document.getElementById('progressTrack').hidden = true;
      document.getElementById('progressDetail').textContent = '';
      document.getElementById('progressOverlay').classList.add('is-error');
    },
  });
}
