// state.js
export const AppState = {
    isLoading: false,
    message: 'Laddar...',
    currentTab: 'generate',
  };
  
export function setLoading(isLoading, message = 'Laddar...') {
  AppState.isLoading = isLoading;
  AppState.message = message;

  // Update a global loader element whenever state changes
  const loaderElement = document.querySelector('.global-loader'); 
  if (loaderElement) {
    if (isLoading) {
      loaderElement.textContent = message;
      loaderElement.style.display = 'block';
    } else {
      loaderElement.style.display = 'none';
    }
  }
}

export function setCurrentTab(tabName) {
  AppState.currentTab = tabName;
}