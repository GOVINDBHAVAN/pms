import { create } from 'zustand';

const TOKEN_KEY = 'pms_token';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  employee: null,
  isLoading: false,

  setAuth: (token, employee) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, employee });
  },

  updateToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set(state => ({
      token,
      employee: state.employee ? { ...state.employee, wizard_completed: 1 } : null,
    }));
  },

  setEmployee: (employee) => set({ employee }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, employee: null });
  },

  getToken: () => get().token,
}));
