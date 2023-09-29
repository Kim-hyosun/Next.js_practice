import { InAuthUser } from '@/models/in_auth_user';
import FirebaseAdmin from '@/models/firebase_admin';

const MEMBER_COL = 'members';
const SCR_NAME_COL = 'screen_names';

type AddResult = { result: true; id: string } | { result: false; message: string };

async function add({ uid, email, displayName, photoURL }: InAuthUser): Promise<AddResult> {
  try {
    const screenName = (email as string).replace('@gmail.com', '');

    const addResult = await FirebaseAdmin.getInstanse().Firestore.runTransaction(async (transaction) => {
      const memberRef = FirebaseAdmin.getInstanse().Firestore.collection(MEMBER_COL).doc(uid);

      const screenNameRef = FirebaseAdmin.getInstanse().Firestore.collection(SCR_NAME_COL).doc(screenName);

      const memberDoc = await transaction.get(memberRef);

      if (memberDoc.exists) {
        //이미 추가된 상태
        return false;
      }
      const addData = {
        uid,
        email,
        displayName: displayName ?? '',
        photoURL: photoURL ?? '',
      };
      transaction.set(memberRef, addData);
      transaction.set(screenNameRef, addData);
      return true;
    });
    if (addResult === false) {
      return { result: true, id: uid };
    }
    return { result: true, id: uid };
  } catch (err) {
    console.error(err);
    return {
      result: false,
      message: '서버에러',
    };
  }
}

async function findByScreenName(screenName: string): Promise<InAuthUser | null> {
  const memberRef = FirebaseAdmin.getInstanse().Firestore.collection(SCR_NAME_COL).doc(screenName);

  const memberDoc = await memberRef.get();

  if (memberDoc.exists === false) {
    return null;
  }
  const data = memberDoc.data() as InAuthUser;
  return data;
}

const MemberModel = {
  add,
  findByScreenName,
};

export default MemberModel;
