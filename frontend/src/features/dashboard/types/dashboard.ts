export interface DashboardMetrics {
  todaySalesTotal: number;
  todaySalesCount: number;
  activeOrdersCount: number;
  bottlesInHolding: number;
  totalPendingDebt: number;
  lowStockCount: number;
  isShiftOpen: boolean;
  cashRegisterName: string;
}

export interface WeeklyChartPoint {
  day: string;
  total: number;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  weeklyChart: WeeklyChartPoint[];
  recentOrders: any[];
  recentSales: any[];
}
