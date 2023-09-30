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
    const messageCol = memberRef.collection(MSG_COL);
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
const MessageModel = {
  post,
  list,
};

export default MessageModel;
