// DB 의 금칙어 검사에 걸렸을 때 보여 줄 안내. 걸리지 않은 오류면 null 을 돌려준다.
// 목록은 DB 의 board_blocked_words 표에만 있다. 걸린 부분을 알려 주어야 잘못 걸렸을 때 고칠 수 있다.
export function blockedLanguageMessage(error) {
  if (!error.message?.includes('blocked_language')) return null;
  const part = error.details ? ` ("${error.details}")` : '';
  return `욕설이나 음란한 표현으로 보이는 부분${part}이 있어 올리지 못했어요. 고쳐서 다시 올려 주세요.`;
}
