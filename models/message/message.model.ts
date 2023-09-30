import { firestore } from 'firebase-admin';
import { InMessage, InMessageServer } from './in_message';
import CustomServeError from '@/controllers/error/custom_serve_error';
import FirebaseAdmin from '../firebase_admin';

const MEMBER_COL = 'members';
const MSG_COL = 'messages';
const SCR_NAME_COL = 'screen_names';

const { Firestore } = FirebaseAdmin.getInstanse();

async function post({
  uid,
  message,
  author,
}: {
  uid: string;
  message: string;
  author?: {
    displayName: string;
    photoURL?: string;
  };
}) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    const newMessageRef = memberRef.collection(MSG_COL).doc();

    const newMessageBody: {
      message: string;
      createAt: firestore.FieldValue;
      author?: {
        displayName: string;
        photoURL?: string;
      };
    } = {
      message,
      createAt: firestore.FieldValue.serverTimestamp(),
    };
    if (author !== undefined) {
      newMessageBody.author = author;
    }
    transaction.set(newMessageRef, newMessageBody);
  });
}

async function list({ uid }: { uid: string }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const listData = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    const messageCol = memberRef.collection(MSG_COL).orderBy('createAt', 'desc'); //메시지 리스트를 날짜순으로 정렬
    const messageColDoc = await transaction.get(messageCol);
    const data = messageColDoc.docs.map((mapvalue) => {
      const docData = mapvalue.data() as Omit<InMessageServer, 'id'>;
      const returnData = {
        ...docData,
        id: mapvalue.id,
        createAt: docData.createAt.toDate().toISOString(),
        replyAt: docData.replyAt ? docData.replyAt.toDate().toISOString() : undefined,
      } as InMessage;
      return returnData;
    });
    return data;
  });
  return listData;
}

async function get({ uid, messageId }: { uid: string; messageId: string }) {
  //특정 리스트만 가지고 메시지 조회해서 컴포넌트만을 업데이트
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);

  const messageRef = Firestore.collection(MEMBER_COL).doc(uid).collection(MSG_COL).doc(messageId);

  const data = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    if (messageDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 문서 입니다.' });
    }
    const messageData = messageDoc.data() as InMessageServer;

    return {
      ...messageData,
      id: messageId,
      createAt: messageData.createAt.toDate().toISOString(),
      replyAt: messageData.replyAt ? messageData.replyAt.toDate().toISOString() : undefined,
    };
  });
  return data;
}

async function postReply({ uid, messageId, reply }: { uid: string; messageId: string; reply: string }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);

  const messageRef = Firestore.collection(MEMBER_COL).doc(uid).collection(MSG_COL).doc(messageId);

  await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    if (messageDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 문서 입니다.' });
    }
    const messageData = messageDoc.data() as InMessageServer;

    if (messageData.reply !== undefined) {
      throw new CustomServeError({ statusCode: 400, message: '이미 댓글을 입력했습니다.' });
    }
    transaction.update(messageRef, { reply, replyAt: firestore.FieldValue.serverTimestamp() });
  });
}
const MessageModel = {
  post,
  list,
  get,
  postReply,
};

export default MessageModel;
