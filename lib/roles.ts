// Role definitions
export const ROLES = {
  INVENTORY_MANAGER: 'inventory_manager',
  WAREHOUSE_STAFF: 'warehouse_staff',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role permissions
export const ROLE_PERMISSIONS = {
  [ROLES.INVENTORY_MANAGER]: {
    canManageReceipts: true,
    canManageDeliveries: true,
    canManageTransfers: false,
    canManageAdjustments: false,
    canViewDashboard: true,
    canManageProducts: true,
    canViewHistory: true,
    canManageSettings: true,
  },
  [ROLES.WAREHOUSE_STAFF]: {
    canManageReceipts: false,
    canManageDeliveries: false,
    canManageTransfers: true,
    canManageAdjustments: true,
    canViewDashboard: true,
    canManageProducts: true,
    canViewHistory: true,
    canManageSettings: true,
  },
} as const;

// Navigation items with required permissions
export const NAVIGATION_PERMISSIONS = {
  '/dashboard': 'canViewDashboard',
  '/products': 'canManageProducts',
  '/receipts': 'canManageReceipts',
  '/deliveries': 'canManageDeliveries',
  '/transfers': 'canManageTransfers',
  '/adjustments': 'canManageAdjustments',
  '/history': 'canViewHistory',
  '/settings': 'canManageSettings',
  '/profile': 'canManageSettings', // Everyone can access profile
} as const;

/**
 * Check if a user with a given role has a specific permission
 */
export function hasPermission(role: string, permission: keyof typeof ROLE_PERMISSIONS[typeof ROLES.INVENTORY_MANAGER]): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions[permission] === true;
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(role: string, route: string): boolean {
  // Profile is accessible to everyone
  if (route === '/profile') return true;
  
  const permissionKey = NAVIGATION_PERMISSIONS[route as keyof typeof NAVIGATION_PERMISSIONS];
  if (!permissionKey) return false;
  
  return hasPermission(role, permissionKey as any);
}

/**
 * Get user-friendly role name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case ROLES.INVENTORY_MANAGER:
      return 'Inventory Manager';
    case ROLES.WAREHOUSE_STAFF:
      return 'Warehouse Staff';
    default:
      return role;
  }
}

