export interface TabMetrics {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  windowId: number;
  
  // Timestamps
  created: number | null;
  lastAccessed: number;
  
  // Network activity
  networkActivity: {
    requestCount: number;
    bytesReceived: number;
    lastActivity: number | null;
    firstActivity: number | null;
  };
  
  // Memory (may be grouped across tabs in same process)
  memoryUsage: number | null; // in bytes
  
  // Computed flags
  isActive: boolean;
  isPinned: boolean;
  isAudible: boolean;
  isDiscarded: boolean;
}

export interface WindowInfo {
  id: number;
  tabCount: number;
  focused: boolean;
}

export interface NetworkStats {
  [tabId: number]: {
    requestCount: number;
    bytesReceived: number;
    lastActivity: number | null;
    firstActivity: number | null;
  };
}

export type SortColumn =
  | 'title'
  | 'created'
  | 'lastAccessed'
  | 'memory'
  | 'networkActivity'
  | 'requestCount'
  | 'bytesTransferred';

export type SortDirection = 'asc' | 'desc';
