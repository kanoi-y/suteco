/**
 * 捨て方ルール・区分
 */
export interface DisposalRule {
  /** 自治体 ID */
  municipalityId: string;
  /** 共通品目 ID */
  itemId: string;
  /** 分別区分 */
  categoryName: string;
  /** 出し方 */
  instructions: string;
  /** 注意事項 */
  notes?: string;
  /** 参照先 URL */
  officialUrl?: string;
}
