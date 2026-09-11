import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 엑셀 일괄 등록 파일(수 MB) 업로드를 허용하기 위해 기본 1MB 제한을 늘립니다.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
