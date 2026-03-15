import type { Candidate } from '@/types/candidate';

/**
 * 認識結果
 */
export interface RecognitionResult {
  /** 候補リスト（信頼度の降順） */
  candidates: Candidate[];
}

/**
 * 認識処理のインターフェース
 */
export interface Recognizer {
  /**
   * 画像 URI を受け取り、認識候補を返す
   * @param imageUri - 認識対象の画像 URI
   * @returns 認識候補リスト（信頼度の降順）
   */
  recognize(imageUri: string): Promise<RecognitionResult>;
}
