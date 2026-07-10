import create from 'zustand'

const useMapStore = create((set) => ({
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc })
}))

export default useMapStore
