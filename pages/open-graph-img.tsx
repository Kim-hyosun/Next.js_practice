import { Box, Image } from '@chakra-ui/react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PrintText from '@/components/print_text';

const OpenGraphImgPage: NextPage = () => {
  const { query } = useRouter();
  const text = query.text ?? '';
  const printText = Array.isArray(text) ? text[0] : text;
  return (
    <Box width="full" bgColor="#fff" p="25px" pt="50px" borderRadius="lg">
      <PrintText printText={printText} />
      <Image src="/screenshot_bg.svg" alt="frame" />
    </Box>
  );
};

export default OpenGraphImgPage;
