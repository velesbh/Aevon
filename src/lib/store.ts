import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

interface AppState {
  manuscriptText: string;
  characters: Character[];
  locations: Location[];
  wordCount: number;
  
  setManuscriptText: (text: string) => void;
  addCharacter: (character: Omit<Character, 'id'>) => void;
  updateCharacter: (id: string, character: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: string, location: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      manuscriptText: '',
      characters: [
        { id: '1', name: 'Elara Vance', description: 'A rogue scholar.', role: 'Protagonist' },
        { id: '2', name: 'Kaelen', description: 'Commander of the guard.', role: 'Antagonist' },
      ],
      locations: [
        { id: '1', name: 'Eldoria', description: 'The ancient capital city.' },
      ],
      wordCount: 0,
      
      setManuscriptText: (text) => set(() => {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return { manuscriptText: text, wordCount: words.length };
      }),
      
      addCharacter: (character) => set((state) => ({
        characters: [...state.characters, { ...character, id: uuidv4() }]
      })),
      updateCharacter: (id, characterUpdate) => set((state) => ({
        characters: state.characters.map(c => c.id === id ? { ...c, ...characterUpdate } : c)
      })),
      deleteCharacter: (id) => set((state) => ({
        characters: state.characters.filter(c => c.id !== id)
      })),
      
      addLocation: (location) => set((state) => ({
        locations: [...state.locations, { ...location, id: uuidv4() }]
      })),
      updateLocation: (id, locationUpdate) => set((state) => ({
        locations: state.locations.map(l => l.id === id ? { ...l, ...locationUpdate } : l)
      })),
      deleteLocation: (id) => set((state) => ({
        locations: state.locations.filter(l => l.id !== id)
      })),
    }),
    {
      name: 'aevon-storage',
    }
  )
);
