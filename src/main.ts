import { App } from './App';
import './styles/main.css';

const app = new App();

app.init().catch((error: unknown) => {
  console.error('Failed to initialize Weather App:', error);

  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.innerHTML = `
      <div class="app" style="justify-content: center; align-items: center; min-height: 100vh;">
        <div class="text-center">
          <p style="font-size: 2rem; margin-bottom: 16px;">&#9888;</p>
          <h1 style="font-size: 1.25rem; margin-bottom: 8px;">Something went wrong</h1>
          <p class="text-secondary">Unable to start the Weather App. Please refresh the page.</p>
        </div>
      </div>
    `;
  }
});
