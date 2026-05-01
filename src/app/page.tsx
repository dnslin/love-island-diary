"use client";

import Image from "next/image";
import { Button, Modal, Typewriter } from "animal-island-ui";
import { useState } from "react";

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 3) {
      setIsOpen(true);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setClickCount(0);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <main className="flex flex-col items-center gap-8 text-center">
        <button
          onClick={handleLogoClick}
          className="cursor-pointer bg-transparent border-none p-0"
          aria-label="恋爱小岛日记 Logo"
        >
          <Image
            src="/logo.svg"
            alt="恋爱小岛日记"
            width={120}
            height={120}
            priority
          />
        </button>
        <h1 className="text-4xl font-bold text-text-main">
          恋爱小岛日记
        </h1>
        <p className="text-lg text-text-sub">
          一个私密、温柔、治愈的恋爱日记网站
        </p>
        <Button type="primary" size="middle">
          翻开日记
        </Button>

        <Modal
          open={isOpen}
          onClose={handleClose}
          maskClosable
          closable
          footer={null}
          width={320}
          typewriter={false}
        >
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="text-2xl">❤</span>
            <Typewriter speed={80} trigger={isOpen}>
              <p className="text-base leading-relaxed text-text-main">
                你的眼睛真好看，里面有晴雨，日月，山川，江河，云雾，花鸟。
              </p>
              <p className="text-base leading-relaxed text-text-main">
                但是我的眼睛更好看，因为里面有你。
              </p>
            </Typewriter>
          </div>
        </Modal>
      </main>
    </div>
  );
}
