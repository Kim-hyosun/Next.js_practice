import { Avatar, Box, Flex, Text, Button } from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ServiceLayout } from '@/components/service_layout';
import { useAuth } from '@/contexts/auth_user.context';
import { InAuthUser } from '@/models/in_auth_user';
import MessageItem from '@/components/message_item';
import { InMessage } from '@/models/message/in_message';
import MemberModel from '@/models/member/member.model';
import MessageModel from '@/models/message/message.model';

interface Props {
  userInfo: InAuthUser | null;
  messageData: InMessage | null;
  screenName: string;
  baseUrl: string;
}

const MessagePage: NextPage<Props> = function ({ userInfo, messageData: initMsgData, screenName, baseUrl }) {
  const [messageData, setMessageData] = useState<null | InMessage>(initMsgData);
  const { authUser } = useAuth();

  async function fetchMessageInfo({ uid, messageId }: { uid: string; messageId: string }) {
    try {
      const resp = await fetch(`/api/messages.info?uid=${uid}&messageId=${messageId}`);
      if (resp.status === 200) {
        const data = await resp.json();
        setMessageData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (userInfo === null) {
    return <p>사용자를 찾을 수 없습니다.</p>;
  }
  if (messageData === null) {
    return <p>메시지 정보가 없습니다.</p>;
  }
  const isOwner = authUser !== null && authUser.uid === userInfo.uid;
  const metaImgUrl = `${baseUrl}/open-graph-img?text=${encodeURIComponent(messageData.message)}`;
  const thumbnailImgUrl = `${baseUrl}/api/thumbnail?url=${encodeURIComponent(metaImgUrl)}`;
  return (
    <>
      <Head>
        <meta property="og:image" content={thumbnailImgUrl} />
        <meta name="twitter:card" content="card" />
        <meta name="twitter:site" content="Waggle" />
        <meta name="twitter:title" content={messageData.message} />
        <meta name="twitter:image" content={thumbnailImgUrl} />
      </Head>
      <ServiceLayout title={`${userInfo.displayName}의 홈`} minH="100vh" backgroundColor="gray.50">
        <Box maxW="md" mx="auto" pt="6">
          <Link href={`/${screenName}`}>
            <a>
              <Button mb="2" fontSize="sm">
                &larr; {screenName} 홈으로
              </Button>
            </a>
          </Link>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mb="2" bg="#fff">
            <Flex p="6">
              <Avatar size="lg" src={userInfo.photoURL ?? 'https://bit.ly/broken-link'} mr="2" />
              <Flex direction="column" justify="center">
                <Text fontSize="md">{userInfo.displayName}</Text>
                <Text fontSize="xs">{userInfo.email}</Text>
              </Flex>
            </Flex>
          </Box>
          <MessageItem
            item={messageData}
            uid={userInfo.uid}
            screenName={screenName}
            displayName={userInfo.displayName ?? ''}
            photoURL={userInfo.photoURL ?? 'https://bit.ly/broken-link'}
            isOwner={isOwner}
            onSendComplete={() => {
              fetchMessageInfo({ uid: userInfo.uid, messageId: messageData.id });
            }}
          />
        </Box>
      </ServiceLayout>
    </>
  );
};

function resolveBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const protocol = process.env.PROTOCOL || 'http';
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  return `${protocol}://${host}${process.env.NODE_ENV === 'development' ? `:${port}` : ''}`;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const { screenName, messageId } = query;
  const baseUrl = resolveBaseUrl();
  const emptyProps = { userInfo: null, messageData: null, screenName: '', baseUrl };
  if (screenName === undefined || messageId === undefined) {
    return { props: emptyProps };
  }
  const screenNameToStr = Array.isArray(screenName) ? screenName[0] : screenName;
  const messageIdToStr = Array.isArray(messageId) ? messageId[0] : messageId;
  try {
    const userInfo = await MemberModel.findByScreenName(screenNameToStr);
    if (!userInfo || !userInfo.uid) {
      return { props: { ...emptyProps, screenName: screenNameToStr } };
    }
    const messageData = await MessageModel.get({ uid: userInfo.uid, messageId: messageIdToStr });
    return {
      props: {
        userInfo,
        messageData: (messageData as InMessage) ?? null,
        screenName: screenNameToStr,
        baseUrl,
      },
    };
  } catch (err) {
    console.error(err);
    return { props: { ...emptyProps, screenName: screenNameToStr } };
  }
};

export default MessagePage;
