import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col gap-8 min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Asset-Master</h1>
        <p className="text-muted-foreground text-lg">
          실시간 자산 비중 분석 및 포트폴리오 관리 시스템
        </p>
      </header>

      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>자산 비중</CardTitle>
            <CardDescription>태그별 자산 할당 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center bg-muted rounded-md italic text-muted-foreground">
              차트가 여기에 표시됩니다
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>실시간 시세</CardTitle>
            <CardDescription>미 증시 및 국내 상장 미국 ETF</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between p-2 hover:bg-muted/50 rounded-lg">
                <span>NVDA</span>
                <span className="text-green-500 font-medium">+2.5%</span>
              </div>
              <div className="flex justify-between p-2 hover:bg-muted/50 rounded-lg">
                <span>KODEX 미국나스닥100</span>
                <span className="text-green-500 font-medium">+1.2%</span>
              </div>
              <div className="flex justify-between p-2 hover:bg-muted/50 rounded-lg">
                <span>AAPL</span>
                <span className="text-red-500 font-medium">-0.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>최근 거래 및 변경 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">내역이 없습니다.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
