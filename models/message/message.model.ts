import { firestore } from 'firebase-admin';
import { InAuthUser } from '@/models/in_auth_user';
import { InMessage, InMessageServer } from './in_message';
import CustomServeError from '@/controllers/error/custom_serve_error';
import FirebaseAdmin from '../firebase_admin';

const MEMBER_COL = 'members';
const MSG_COL = 'messages';
//const SCR_NAME_COL = 'screen_names';

const { Firestore } = FirebaseAdmin.getInstance();

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
    let messageCount = 1;
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }

    const memberInfo = memberDoc.data() as InAuthUser & { messageCount?: number };
    if (memberInfo.messageCount !== undefined) {
      messageCount = memberInfo.messageCount;
    }
    const newMessageRef = memberRef.collection(MSG_COL).doc();

    const newMessageBody: {
      message: string;
      createAt: firestore.FieldValue;
      author?: {
        displayName: string;
        photoURL?: string;
      };
      messageNo: number;
    } = {
      message,
      messageNo: messageCount,
      createAt: firestore.FieldValue.serverTimestamp(),
    };
    if (author !== undefined) {
      newMessageBody.author = author;
    }
    transaction.set(newMessageRef, newMessageBody);
    transaction.update(memberRef, { messageCount: messageCount + 1 });
  });
}

async function updateMessage({ uid, messageId, deny = true }: { uid: string; messageId: string; deny: boolean }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const messageRef = Firestore.collection(MEMBER_COL).doc(uid).collection(MSG_COL).doc(messageId);
  const result = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    if (messageDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 문서 입니다.' });
    }
    transaction.update(messageRef, { deny });
    const messageData = messageDoc.data() as InMessageServer;
    return {
      ...messageData,
      id: messageId,
      deny,
      createAt: messageData.createAt.toDate().toISOString(),
      replyAt: messageData.replyAt ? messageData.replyAt.toDate().toISOString() : undefined,
    };
  });
  return result;
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

async function listWithPage({ uid, page = 1, size = 10 }: { uid: string; page?: number; size?: number }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const listData = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServeError({ statusCode: 400, message: '존재하지 않는 사용자 입니다.' });
    }
    const memberInfo = memberDoc.data() as InAuthUser & { messageCount?: number };
    const { messageCount = 0 } = memberInfo;
    const totalElements = messageCount !== 0 ? messageCount - 1 : 0; //전체 질문개수
    const remains = totalElements % size; //페이지안에 들어가지 못한 나머지 질문개수
    const totalPages = (totalElements - remains) / size + (remains > 0 ? 1 : 0); //전체페이지 개수
    const startAt = totalElements - (page - 1) * size; //어디서부터 값을 가져와야 하는지(전체 질문개수 - (몇페이지 - 1 ) * 10개단위로페이지에들어감)=> 전체질문 100개중 2페이지이면, 90번째부터 가져와라 됨
    if (startAt < 0) {
      //데이터가 없는 상태이면?
      return { totalElements, totalPages: 0, page, size, content: [] };
    }
    const messageCol = memberRef.collection(MSG_COL).orderBy('messageNo', 'desc').startAt(startAt).limit(size); //메시지 리스트를 날짜순으로 정렬
    const messageColDoc = await transaction.get(messageCol);
    const data = messageColDoc.docs.map((mapvalue) => {
      const docData = mapvalue.data() as Omit<InMessageServer, 'id'>;

      const isDeny = docData.deny !== undefined && docData.deny === true;
      const returnData = {
        ...docData,
        id: mapvalue.id,
        message: isDeny ? '비공개 처리된 메시지 입니다.' : docData.message,
        createAt: docData.createAt.toDate().toISOString(),
        replyAt: docData.replyAt ? docData.replyAt.toDate().toISOString() : undefined,
      } as InMessage;
      return returnData;
    });
    return { totalElements, totalPages, page, size, content: data };
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
    const isDeny = messageData.deny !== undefined && messageData.deny === true;
    return {
      ...messageData,
      message: isDeny ? '비공개 처리된 메시지 입니다.' : messageData.message,
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
  updateMessage,
  list,
  listWithPage,
  get,
  postReply,
};

export default MessageModel;
