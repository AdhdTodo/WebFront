import axios from "axios";

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도하세요.";
  }

  const responseMessage = error.response?.data?.message;
  if (typeof responseMessage === "string") {
    return responseMessage;
  }

  const status = error.response?.status;
  if (status === 401) {
    return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (status === 403) {
    return "이 데이터에 접근할 권한이 없습니다.";
  }
  if (status === 429) {
    return "요청이 너무 많습니다. 잠시 쉬었다가 다시 시도하세요.";
  }
  if (status === 422) {
    return "입력값을 확인해 주세요.";
  }
  if (status && status >= 500) {
    return "서버 오류가 발생했습니다. 백엔드 상태를 확인해 주세요.";
  }

  const detail = error.response?.data?.detail;
  if (detail?.message) {
    return detail.message;
  }
  if (typeof detail === "string") {
    return detail;
  }

  return "API 요청에 실패했습니다.";
}
