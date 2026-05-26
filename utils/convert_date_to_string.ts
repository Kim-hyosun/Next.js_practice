import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

function convertDateToString(dateString: string): string {
  return dayjs(dateString).fromNow();
}

export default convertDateToString;
