import { NextApiRequest, NextApiResponse } from 'next';
import FirebaseAdmin from '@/models/firebase_admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid, email, displayName, photoURL } = req.body;
  if (uid === undefined || uid === null) {
    return res.status(400).json({ result: false, message: 'uid가 누락되었습니다.' });
  }
  try {
    const addResult = await FirebaseAdmin.getInstanse()
      .Firebase.collection('members')
      .doc(uid)
      .set({
        //구글 sdk의 uid를 그대로 서버에 넘기기 위해 add.대신 doc(uid).set으로
        uid,
        email: email ?? '',
        displayName: displayName ?? '',
        photoURL: photoURL ?? '',
      });
    return res.status(200).json({ result: true, id: addResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false });
  }
}
