/**
 * 認識・検索の候補
 */
export interface Candidate {
  /** 共通品目 ID */
  itemId: string;
  /** 表示ラベル */
  label: string;
  /** 信頼度スコア (0.0 ~ 1.0) */
  score?: number;
}
