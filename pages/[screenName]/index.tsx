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

//import { TriangleDownIcon } from '@chakra-ui/icons';
import { GetServerSideProps, NextPage } from 'next';
import ResizeTextarea from 'react-textarea-autosize';
import { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { ServiceLayout } from '@/components/service_layout';
import { useAuth } from '@/contexts/auth_user.context';
import { InAuthUser } from '@/models/in_auth_user';
import MessageItem from '@/components/message_item';
import { InMessage } from '@/models/message/in_message';
import { useQuery } from 'react-query';

interface Props {
  userInfo: InAuthUser | null;
}

async function postMessage({
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
  if (message.length <= 0) {
    return {
      result: false,
      message: '메시지를 입력해주세요',
    };
  }
  try {
    await fetch('/api/messages.add', {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        message,
        author,
      }),
    });
    return {
      result: true,
    };
  } catch (err) {
    console.error(err);
    return {
      result: false,
      message: '메시지 등록 실패',
    };
  }
}

const UserHomePage: NextPage<Props> = function ({ userInfo }) {
  const [message, setMessage] = useState('');
  const toast = useToast();
  const [isAnonymous, setAnonymous] = useState(true);

  const [page, setPage] = useState(1);
  const [totalpage, setTotalPage] = useState(1);

  const { authUser } = useAuth();
  const [messageList, setMessageList] = useState<InMessage[]>([]);
  const [messageListFetchTrigger, setMessageListFetchTrigger] = useState(false); //글 등록시 리렌더링 위해

  /* async function fetchMessageList(uid: string) {
    try {
      const resp = await fetch(`/api/messages.list?uid=${uid}&page=${page}&size=10`);
      if (resp.status === 200) {
        const data: {
          totalElements: number;
          totalPages: number;
          page: number;
          size: number;
          content: InMessage[];
        } = await resp.json();
        setMessageList((prev) => [...prev, ...data.content]);
        setTotalPage(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  } */

  async function fetchMessageInfo({ uid, messageId }: { uid: string; messageId: string }) {
    try {
      const resp = await fetch(`/api/messages.info?uid=${uid}&messageId=${messageId}`);
      if (resp.status === 200) {
        const data = await resp.json();
        setMessageList((prev) => {
          const findIndex = prev.findIndex((fv) => fv.id === data.id);
          if (findIndex >= 0) {
            //값이 있으면
            const updateArr = [...prev];
            updateArr[findIndex] = data;
            return updateArr;
          }
          return prev; //값없으면 기존 값 그대로 리턴
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  const messageListQueryKey = ['messageList', userInfo?.uid, page, messageListFetchTrigger];

  useQuery(
    messageListQueryKey,
    async () =>
      await axios.get<{
        totalElements: number;
        totalPages: number;
        page: number;
        size: number;
        content: InMessage[];
      }>(`/api/messages.list?uid=${userInfo?.uid}&page=${page}&size=10`),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        //성공시
        setTotalPage(data.data.totalPages);
        if (page === 1) {
          //키 중복 피하기 위한 예외처리
          setMessageList([...data.data.content]);
          return;
        }
        setMessageList((prev) => [...prev, ...data.data.content]);
      },
    },
  );

  /*  useEffect(() => {
    if (userInfo === null) return;
    fetchMessageList(userInfo.uid);
  }, [userInfo, messageListFetchTrigger, page]); */
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
              src={isAnonymous ? 'https://bit.ly/broken-link' : authUser?.photoURL ?? 'https://bit.ly/broken-link'}
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
                    toast({
                      title: '최대 7줄까지만 입력가능합니다.',
                      position: 'top-right',
                    });
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
                  author?: {
                    displayName: string;
                    photoURL?: string;
                  };
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
                setPage(1);
                setTimeout(() => {
                  //값 변경을 조금 미뤄서 키중복 발생위험 낮춤
                  setMessageListFetchTrigger((prev) => !prev);
                }, 50);
                setMessageListFetchTrigger((prev) => !prev);
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
                  toast({
                    title: '로그인이 필요합니다.',
                    position: 'top-right',
                  });
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
          {messageList.map((messageData, index) => (
            <MessageItem
              key={`message-item-${userInfo.uid}-${messageData.id}-${index}`}
              item={messageData}
              uid={userInfo.uid}
              displayName={userInfo.displayName ?? ''}
              photoURL={userInfo.photoURL ?? 'https://bit.ly/broken-link'}
              isOwner={isOwner}
              onSendComplete={() => {
                fetchMessageInfo({ uid: userInfo.uid, messageId: messageData.id });
              }}
            />
          ))}
        </VStack>
        {totalpage > page && (
          <Button
            width="full"
            mt="2"
            fontSize="sm"
            onClick={() => {
              setPage((p) => p + 1);
            }}
          >
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
    return {
      props: {
        userInfo: null,
        screenName: '',
      },
    };
  }
  const screenNameToStr = Array.isArray(screenName) ? screenName[0] : screenName;
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';

    const baseUrl = `${protocol}://${host}${process.env.NODE_ENV === 'development' ? `:${port}` : ''}`;
    console.log(baseUrl);
    const userInfoResp: AxiosResponse<InAuthUser> = await axios(`${baseUrl}/api/user.info/${screenName}`);
    return {
      props: {
        userInfo: userInfoResp.data ?? null,
        screenName: screenNameToStr,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {
        userInfo: null,
        screenName: '',
      },
    };
  }
};

export default UserHomePage;
