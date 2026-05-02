'use client';

import Image from 'next/image';
import { Modal, Typewriter } from 'animal-island-ui';
import { useState } from 'react';

export default function CoverLogo() {
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
    <>
      <button
        onClick={handleLogoClick}
        className="cursor-pointer bg-transparent border-none p-0"
        aria-label="恋爱小岛日记 Logo"
      >
        <Image
          src="/logo.svg"
          alt="恋爱小岛日记"
          width={48}
          height={48}
          priority
        />
      </button>

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E8AEB7"/>
          </svg>
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
    </>
  );
}
