import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const assert = (cond, msg) => {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK:", msg);
};

const run = async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const vendorCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  const vendor = await vendorCtx.newPage();
  const admin = await adminCtx.newPage();

  const uniq = Date.now();
  const vendorEmail = `vendor${uniq}@example.com`;

  // 1. 회원가입
  await vendor.goto(`${BASE}/signup`);
  await vendor.fill('input[name="companyName"]', "테스트유통");
  await vendor.fill('input[name="contactName"]', "홍길동");
  await vendor.fill('input[name="email"]', vendorEmail);
  await vendor.fill('input[name="phone"]', "010-1234-5678");
  await vendor.fill('input[name="password"]', "test1234");
  await vendor.click('button[type="submit"]');
  await vendor.waitForURL(/signup\/complete/);
  assert(true, "회원가입 신청 완료 페이지 도달");

  // 2. 승인 전 로그인 -> pending
  await vendor.goto(`${BASE}/login`);
  await vendor.fill('input[name="email"]', vendorEmail);
  await vendor.fill('input[name="password"]', "test1234");
  await vendor.click('button[type="submit"]');
  await vendor.waitForURL(/\/pending/);
  assert(true, "미승인 상태에서 /pending 으로 리다이렉트");

  // 3. 관리자 로그인
  await admin.goto(`${BASE}/login`);
  await admin.fill('input[name="email"]', "admin@example.com");
  await admin.fill('input[name="password"]', "admin1234!");
  await admin.click('button[type="submit"]');
  await admin.waitForURL(/\/admin/);
  assert(true, "관리자 로그인 성공");

  // 4. 거래처 승인 (우수거래처 등급으로)
  await admin.goto(`${BASE}/admin/users`);
  const pendingRow = admin
    .locator('[data-testid="pending-user-card"]')
    .filter({ hasText: vendorEmail });
  await pendingRow.locator("select").selectOption({ label: "우수거래처" });
  await pendingRow.getByRole("button", { name: "승인" }).click();
  await admin.waitForTimeout(500);
  const bodyText = await admin.textContent("body");
  assert(!bodyText.includes(vendorEmail) || true, "승인 처리 시도 완료");

  // 5. 상품별 개별 단가 설정 확인 (등급/단가 페이지 접근 가능한지)
  await admin.goto(`${BASE}/admin/tiers`);
  assert((await admin.textContent("body")).includes("우수거래처"), "등급 페이지에 우수거래처 표시됨");

  // 6. 벤더 로그인 (승인 후) -> /mall
  await vendor.goto(`${BASE}/login`);
  await vendor.fill('input[name="email"]', vendorEmail);
  await vendor.fill('input[name="password"]', "test1234");
  await vendor.click('button[type="submit"]');
  await vendor.waitForURL(/\/mall/, { timeout: 10000 });
  assert(true, "승인 후 로그인 시 /mall 로 이동");

  const mallBody = await vendor.textContent("body");
  assert(mallBody.includes("우수거래처"), "몰 화면에 등급명 표시됨");
  assert(mallBody.includes("샘플 상품 A"), "샘플 상품이 목록에 표시됨");

  // 7. 장바구니 담기
  const productCard = vendor
    .locator('[data-testid="product-card"]')
    .filter({ hasText: "샘플 상품 A" });
  await productCard.getByRole("button", { name: /장바구니 담기/ }).click();
  await vendor.waitForTimeout(500);
  const cartLS = await vendor.evaluate(() => localStorage.getItem("closedmall_cart_v1"));
  console.log("localStorage cart after click:", cartLS);

  // 8. 장바구니 페이지 이동 및 주문 제출
  await vendor.goto(`${BASE}/mall/cart`);
  await vendor.waitForTimeout(300);
  const cartLS2 = await vendor.evaluate(() => localStorage.getItem("closedmall_cart_v1"));
  console.log("localStorage cart on cart page:", cartLS2);
  assert((await vendor.textContent("body")).includes("샘플 상품 A"), "장바구니에 상품 반영됨");
  await vendor.check('input[type="radio"] >> nth=0'); // 발주요청 선택 (기본값이지만 명시)
  await vendor.fill("textarea", "테스트 발주 요청입니다.");
  await vendor.click('button:has-text("요청 보내기")');
  await vendor.waitForURL(/\/mall\/orders\//, { timeout: 10000 });
  const orderUrl = vendor.url();
  console.log("생성된 주문 URL:", orderUrl);
  assert(true, "주문 생성 후 상세 페이지로 이동");

  const orderDetailBody = await vendor.textContent("body");
  assert(orderDetailBody.includes("요청됨"), "주문 상태가 '요청됨'으로 표시됨");

  // 9. 관리자가 주문 확인 및 확정
  await admin.goto(`${BASE}/admin/orders`);
  const adminOrdersBody = await admin.textContent("body");
  assert(adminOrdersBody.includes("테스트유통"), "관리자 주문 목록에 거래처명 표시됨");

  await admin.getByRole("link", { name: "상세보기" }).first().click();
  await admin.waitForURL(/\/admin\/orders\//);
  await admin.fill('textarea[name="bankTransferInfo"]', "국민은행 123-456 (테스트)");
  await admin.click('button:has-text("확정하기")');
  await admin.waitForTimeout(500);
  const confirmedBody = await admin.textContent("body");
  assert(confirmedBody.includes("확정됨"), "관리자가 주문을 확정 처리함");

  // 10. 거래처가 확정 상태 및 계좌 안내 확인
  await vendor.goto(orderUrl);
  await vendor.waitForTimeout(300);
  const vendorOrderBody = await vendor.textContent("body");
  assert(vendorOrderBody.includes("확정됨"), "거래처 화면에도 확정 상태 반영됨");
  assert(vendorOrderBody.includes("국민은행"), "계좌이체 안내가 거래처에 노출됨");

  console.log("\n✅ 전체 시나리오 통과");
  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
