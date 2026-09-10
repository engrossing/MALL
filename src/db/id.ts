import { customAlphabet } from "nanoid";

// 소문자+숫자로 구성된 ID 생성기 (URL-safe, 순수 JS라 배포 환경 제약이 없음)
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 20);

export function createId(): string {
  return `c${nanoid()}`;
}
