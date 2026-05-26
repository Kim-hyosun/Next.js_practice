import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import ResizeTextarea from 'react-textarea-autosize';
import { useState } from 'react';
import axios from 'axios';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { ServiceLayout } from '@/components/service_layout';
import { useAuth } from '@/contexts/auth_user.context';
import { InAuthUser } from '@/models/in_auth_user';
import MessageItem from '@/components/message_item';
import { InMessage } from '@/models/message/in_message';
import MemberModel from '@/models/member/member.model';

interface Props {
  userInfo: InAuthUser | null;
  screenName: string;
}

interface MessagePage {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  content: InMessage[];
}

async function postMessage({
  uid,
  message,
  author,
}: {
  uid: string;
  message: string;
  author?: { displayName: string; photoURL?: string };
}) {
  if (message.length <= 0) {
    return { result: false, message: '메시지를 입력해주세요' };
  }
  try {
    await fetch('/api/messages.add', {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, message, author }),
    });
    return { result: true };
  } catch (err) {
    console.error(err);
    return { result: false, message: '메시지 등록 실패' };
  }
}

const UserHomePage: NextPage<Props> = function ({ userInfo, screenName }) {
  const [message, setMessage] = useState('');
  const [isAnonymous, setAnonymous] = useState(true);
  const toast = useToast();
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['messageList', userInfo?.uid];

  const { data, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const resp = await axios.get<MessagePage>(
        `/api/messages.list?uid=${userInfo?.uid}&page=${pageParam}&size=10`,
      );
      return resp.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: !!userInfo?.uid,
    refetchOnWindowFocus: false,
  });

  const messageList: InMessage[] = data?.pages.flatMap((p) => p.content) ?? [];

  async function refreshSingleMessage({ uid, messageId }: { uid: string; messageId: string }) {
    try {
      const resp = await fetch(`/api/messages.info?uid=${uid}&messageId=${messageId}`);
      if (resp.status !== 200) return;
      const updated: InMessage = await resp.json();
      queryClient.setQueryData<InfiniteData<MessagePage>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            content: p.content.map((m) => (m.id === updated.id ? updated : m)),
          })),
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (userInfo === null) {
    return <p>사용자를 찾을 수 없습니다.</p>;
  }
  const isOwner = authUser !== null && authUser.uid === userInfo.uid;
  return (
    <ServiceLayout title={`${userInfo.displayName}의 홈`} minH="100vh" backgroundColor="gray.50">
      <Box maxW="md" mx="auto" pt="6">
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mb="2" bg="#fff">
          <Flex p="6">
            <Avatar size="lg" src={userInfo.photoURL ?? 'https://bit.ly/broken-link'} mr="2" />
            <Flex direction="column" justify="center">
              <Text fontSize="md">{userInfo.displayName}</Text>
              <Text fontSize="xs">{userInfo.email}</Text>
            </Flex>
          </Flex>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mb="2" bg="#fff">
          <Flex align="center" p="2">
            <Avatar
              size="xs"
              src={isAnonymous ? 'https://bit.ly/broken-link' : (authUser?.photoURL ?? 'https://bit.ly/broken-link')}
            />
            <Textarea
              bg="gray.100"
              border="none"
              placeholder="무엇이 궁금한가요?"
              resize="none"
              minH="unset"
              overflow="hidden"
              fontSize="xs"
              mx="2"
              as={ResizeTextarea}
              maxRows={7}
              value={message}
              onChange={(e) => {
                if (e.currentTarget.value) {
                  const lineCount = (e.currentTarget.value.match(/[^\n]*\n[^\n]*/gi)?.length ?? 1) + 1;
                  if (lineCount > 7) {
                    toast({ title: '최대 7줄까지만 입력가능합니다.', position: 'top-right' });
                    return;
                  }
                }
                setMessage(e.currentTarget.value);
              }}
            />
            <Button
              disabled={message.length === 0}
              bgColor="#ffb86c"
              color="#fff"
              colorScheme="yellow"
              variant="solid"
              size="sm"
              onClick={async () => {
                const postData: {
                  message: string;
                  uid: string;
                  author?: { displayName: string; photoURL?: string };
                } = { message, uid: userInfo.uid };
                if (isAnonymous === false) {
                  postData.author = {
                    photoURL: authUser?.photoURL ?? 'https://bit.ly/broken-link',
                    displayName: authUser?.displayName ?? 'anonymous',
                  };
                }
                const messageResp = await postMessage(postData);
                if (messageResp.result === false) {
                  toast({ title: '메시지 등록 실패', position: 'top-right' });
                }
                setMessage('');
                await queryClient.resetQueries({ queryKey });
                await refetch();
              }}
            >
              등록
            </Button>
          </Flex>
          <FormControl display="flex" alignItems="center" mt="1" mx="2" pb="2">
            <Switch
              size="sm"
              colorScheme="orange"
              id="anonymous"
              mr="1"
              isChecked={isAnonymous}
              onChange={() => {
                if (authUser === null) {
                  toast({ title: '로그인이 필요합니다.', position: 'top-right' });
                  return;
                }
                setAnonymous((prev) => !prev);
              }}
            />
            <FormLabel htmlFor="anonymous" mb="0" fontSize="xx-small">
              Anonymous
            </FormLabel>
          </FormControl>
        </Box>
        <VStack spacing="12px" mt="6">
          {messageList.map((messageData) => (
            <MessageItem
              key={`message-item-${userInfo.uid}-${messageData.id}`}
              item={messageData}
              uid={userInfo.uid}
              screenName={screenName}
              displayName={userInfo.displayName ?? ''}
              photoURL={userInfo.photoURL ?? 'https://bit.ly/broken-link'}
              isOwner={isOwner}
              onSendComplete={() => {
                refreshSingleMessage({ uid: userInfo.uid, messageId: messageData.id });
              }}
            />
          ))}
        </VStack>
        {hasNextPage && (
          <Button width="full" mt="2" fontSize="sm" onClick={() => fetchNextPage()}>
            더보기
          </Button>
        )}
      </Box>
    </ServiceLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const { screenName } = query;
  if (screenName === undefined) {
    return { props: { userInfo: null, screenName: '' } };
  }
  const screenNameToStr = Array.isArray(screenName) ? screenName[0] : screenName;
  try {
    const userInfo = await MemberModel.findByScreenName(screenNameToStr);
    return { props: { userInfo, screenName: screenNameToStr } };
  } catch (err) {
    console.error(err);
    return { props: { userInfo: null, screenName: screenNameToStr } };
  }
};

export default UserHomePage;
