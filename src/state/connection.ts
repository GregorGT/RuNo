// connection.ts (improved)
import { atomWithStore } from "jotai-zustand";
import { create } from "zustand";

export type DatabaseType = "Oracle" | "MySQL" | "PostgreSQL" | "SQLite";
export type ButtonState = "default" | "testing" | "connected" | "failed";
export interface Connection {
  id: string;
  name: string;
  type: DatabaseType;
  url: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  lastTested?: string;
}

interface ConnectionsState {
  connections: Connection[];
  selectedConnectionId: string | undefined;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  setSelectedConnectionId: (id: string | undefined) => void;
  connectionStates: Record<string, ButtonState>; // Add this line
  setConnectionStates: (states: Record<string, ButtonState>) => void; // Add this line
}

export const connectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  selectedConnectionId: undefined,
  connectionStates: {},
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
  setConnectionStates: (states) => set({ connectionStates: states }), // Add this line
}));

export const connectionsAtom = atomWithStore(connectionsStore);

// Constants
export const CONNECTION_TYPES: DatabaseType[] = [
  "Oracle",
  "MySQL",
  "PostgreSQL",
  "SQLite",
];

export const DEFAULT_PORTS: Record<DatabaseType, number> = {
  Oracle: 1521,
  MySQL: 3306,
  PostgreSQL: 5432,
  SQLite: 0,
};

export const getDefaultConnection = (): Connection => ({
  id: Date.now().toString(),
  name: "New Connection",
  type: "MySQL",
  url: "",
  database: "",
  user: "",
  password: "",
});
