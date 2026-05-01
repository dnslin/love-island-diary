import { Button } from "animal-island-ui";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-text-main">
          恋爱小岛日记
        </h1>
        <p className="text-lg text-text-sub">
          一个私密、温柔、治愈的恋爱日记网站
        </p>
        <Button type="primary" size="middle">
          翻开日记
        </Button>
      </main>
    </div>
  );
}
