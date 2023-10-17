import { firestore } from 'firebase-admin';

export interface MessageBase {
  id: string;
  message: string /** 사용자가 남긴질문 */;
  reply?: string /** 댓글 */;
  author?: {
    displayName: string;
    photoURL: string;
  };
  deny?: boolean /** 비공개처리여부  */;
}

export interface InMessage extends MessageBase {
  createAt: string /** 질문 남긴 일시  */;
  replyAt?: string /** 댓글 남긴 일시  */;
}

export interface InMessageServer extends MessageBase {
  createAt: firestore.Timestamp;
  replyAt?: firestore.Timestamp;
}
