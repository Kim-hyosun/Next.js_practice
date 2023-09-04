import { Box, Button } from '@chakra-ui/react';

export const GoogleLoginButton = function () {
  return (
    <Box>
      <Button
        size="lg"
        width="full"
        maxW="md"
        borderRadius="full"
        bgColor="#4286f4c0"
        color="#fff"
        colorScheme="blue"
        leftIcon={
          <img
            src="/google.svg"
            alt="구글로 로그인하기위한 구글 로고"
            /* style={{ backgroundColor: '#fff', padding: 8 }} */
          />
        }
      >
        Google 계정으로 시작하기
      </Button>
    </Box>
  );
};
