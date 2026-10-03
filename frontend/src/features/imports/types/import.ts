export interface ImportErrorItem {
  row: number;
  identifier: string;
  error: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportErrorItem[];
  message: string;
}
