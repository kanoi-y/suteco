/**
 * ごみ品目マスタ
 */
export interface Item {
  /** 共通品目 ID */
  id: string;
  /** 品目表示名 */
  displayName: string;
  /** 別名配列 */
  aliases: string[];
  /** 検索用キーワード配列 */
  keywords: string[];
}
