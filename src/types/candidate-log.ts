import type { Candidate } from './candidate';

/**
 * 認識履歴ログ
 */
export interface CandidateLog {
  /** ログ ID */
  id: number;
  /** 入力画像 URI */
  imageUri: string;
  /** 候補リスト */
  candidates: Candidate[];
  /** 利用者が選択した品目 ID */
  selectedItemId?: string | null;
  /** 作成日時 */
  createdAt: string;
}
