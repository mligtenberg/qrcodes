import React from 'react';

export const SL={square:'Square',rounded:'Rounded',circle:'Circle',diamond:'Diamond','connected-h':'H-linked','connected-v':'V-linked',fluid:'Fluid'};
export const MS=['square','rounded','circle','diamond','connected-h','connected-v','fluid'];
export const AS=['square','rounded','circle'];

export const SP={
  square:<rect x="3" y="3" width="18" height="18" fill="currentColor"/>,
  rounded:<rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/>,
  circle:<circle cx="12" cy="12" r="9" fill="currentColor"/>,
  diamond:<polygon points="12,3 21,12 12,21 3,12" fill="currentColor"/>,
  'connected-h':<g fill="currentColor"><rect x="2" y="8" width="20" height="8" rx="2"/></g>,
  'connected-v':<g fill="currentColor"><rect x="8" y="2" width="8" height="20" rx="2"/></g>,
  fluid:<path d="M8,3 L16,3 Q21,3 21,8 L21,16 Q21,21 16,21 L8,21 Q3,21 3,16 L3,8 Q3,3 8,3 Z" fill="currentColor"/>,
};

export const FOP={
  square:<path fillRule="evenodd" d="M2,2h20v20H2Z M5,5h14v14H5Z" fill="currentColor"/>,
  rounded:<path fillRule="evenodd" d="M6,2h12a4,4 0 0 1 4,4v12a4,4 0 0 1-4,4H6a4,4 0 0 1-4,-4V6a4,4 0 0 1 4,-4Z M8,5h8a3,3 0 0 1 3,3v8a3,3 0 0 1-3,3H8a3,3 0 0 1-3,-3V8a3,3 0 0 1 3,-3Z" fill="currentColor"/>,
  circle:<path fillRule="evenodd" d="M12,2a10,10 0 1,0 0.001,0Z M12,5a7,7 0 1,1-0.001,0Z" fill="currentColor"/>,
};

export const FIP={
  square:<rect x="6" y="6" width="12" height="12" fill="currentColor"/>,
  rounded:<rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor"/>,
  circle:<circle cx="12" cy="12" r="6" fill="currentColor"/>,
};
