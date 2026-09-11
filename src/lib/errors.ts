// "use server" 파일(서버 액션 모듈)은 async 함수만 export할 수 있으므로,
// 커스텀 에러 클래스는 별도 파일에 둡니다.
export class ProductImageStorageNotConfiguredError extends Error {}
