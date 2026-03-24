export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    return null;
  }
  
  return token;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userGrado');
  localStorage.removeItem('userArea');
  localStorage.removeItem('onboardingComplete');
  localStorage.removeItem('onboardingData');
  localStorage.removeItem('isGuest');
}

export function saveUserFromRegister(data: {
  token: string;
  user: { id: string; email: string; name: string };
}): void {
  localStorage.setItem('token', data.token);
  if (data.user.name) {
    localStorage.setItem('userName', data.user.name);
  }
  localStorage.setItem('onboardingComplete', 'true');
}

export function saveOnboardingData(data: {
  name: string;
  grado?: string;
  area?: string;
}): void {
  localStorage.setItem('userName', data.name);
  if (data.grado) localStorage.setItem('userGrado', data.grado);
  if (data.area) localStorage.setItem('userArea', data.area);
  localStorage.setItem('onboardingComplete', 'true');
  localStorage.setItem('isGuest', 'true');
}
