import { atomWithStore } from "jotai-zustand";
import { create } from "zustand";

export type Connection = {
  id: string;
  name: string;
  type: "Oracle" | "MySQL" | "PostgreSQL" | "SQLite";
  url: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  lastTested?: string;
};

interface ConnectionsState {
  connections: Connection[];
  selectedConnectionId: string | undefined;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  setSelectedConnectionId: (id: string | undefined) => void;
}

export const connectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  selectedConnectionId: undefined,
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    })),
  deleteConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
      selectedConnectionId:
        state.selectedConnectionId === id
          ? undefined
          : state.selectedConnectionId,
    })),
  setSelectedConnectionId: (id) => set({ selectedConnectionId: id }),
}));

export const connectionsAtom = atomWithStore(connectionsStore);
