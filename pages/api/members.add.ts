import { NextApiRequest, NextApiResponse } from 'next';
import FirebaseAdmin from '@/models/firebase_admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid, email, displayName, photoURL } = req.body;
  if (uid === undefined || uid === null) {
    return res.status(400).json({ result: false, message: 'uid가 누락되었습니다.' });
  }

  if (email === undefined || email === null) {
    return res.status(400).json({ result: false, message: 'email이 누락되었습니다.' });
  }
  try {
    const screenName = (email as string).replace('@gmail.com', '');

    const addResult = await FirebaseAdmin.getInstanse().Firebase.runTransaction(async (transaction) => {
      const memberRef = FirebaseAdmin.getInstanse().Firebase.collection('members').doc(uid);

      const screenNameRef = FirebaseAdmin.getInstanse().Firebase.collection('screen_names').doc(screenName);

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
      return res.status(201).json({ result: true, id: uid });
    }
    return res.status(200).json({ result: true, id: uid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false });
  }
}
