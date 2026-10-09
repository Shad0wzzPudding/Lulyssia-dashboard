import { useState, useEffect, useRef } from 'react';
import { STICKERS } from '@/lib/stickers';
import { useUserNames } from '@/hooks/useUserNames';
import { fillNames } from '@/lib/names';

const lulyssiaGreetings = [
  { text: "Oh, {nickname}. Right on time, as I expected.", emoji: "🦋", sticker: STICKERS.yes },
  { text: "Welcome back. I've already looked over today's case.", emoji: "🔍", sticker: STICKERS.contemplate },
  { text: "Coffee's ready. So is your agenda.", emoji: "☕", sticker: STICKERS.coffee },
  { text: "Mm... oh, you're here. I was only resting my eyes.", emoji: "💤", sticker: STICKERS.sleep },
  { text: "Hmm... you look like you're hiding an unfinished task.", emoji: "👀", sticker: STICKERS.suspicious },
  { text: "There you are! Your tasks won't finish themselves, you know.", emoji: "👉", sticker: STICKERS.restPointing },
  { text: "Back already? Hmhm~ couldn't stay away?", emoji: "😏", sticker: STICKERS.mocking },
  { text: "I took a snapshot of your progress. Let's add to it.", emoji: "📸", sticker: STICKERS.polaroid },
  { text: "Hold on, the files are almost sorted... there. Welcome back.", emoji: "📜", sticker: STICKERS.ritualing },
  { text: "Too many deadlines in my head... help me clear a few, {nickname}?", emoji: "💭", sticker: STICKERS.notSoChill },
  { text: "Wha-! Oh, it's just you. Hi, {nickname}.", emoji: "❗", sticker: STICKERS.startle },
  { text: "Objection! You said you'd come back earlier.", emoji: "💢", sticker: STICKERS.objection },
  { text: "Five more minutes... fine. Let's get to work.", emoji: "😤", sticker: STICKERS.sleepAnnoyed },
  { text: "Taking it slow today? I don't mind keeping you company.", emoji: "🌙", sticker: STICKERS.resting },
  { text: "Um... I think I planned today well? Take a look.", emoji: "😥", sticker: STICKERS.unconfident },
  { text: "Skipping your tasks today? No. Absolutely not.", emoji: "🙅", sticker: STICKERS.no },
];

export const WelcomeMessage = () => {
  const [greeting] = useState(() => {
    const randomIndex = Math.floor(Math.random() * lulyssiaGreetings.length);
    return lulyssiaGreetings[randomIndex];
  });
  // Wait for the saved names so the greeting is typed out with the right name
  const { names, isLoading: namesLoading } = useUserNames();
  const text = fillNames(greeting.text, names);
  const [displayedText, setDisplayedText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typingComplete = useRef(false);

  useEffect(() => {
    if (typingComplete.current || namesLoading) return;
    
    let currentIndex = 0;
    const typingSpeed = 40; // ms per character

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        typingComplete.current = true;
        setShowEmoji(true);
        // Hide cursor after typing is complete
        setTimeout(() => setShowCursor(false), 500);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [text, namesLoading]);

  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center mb-4">
        <img 
          src={greeting.sticker} 
          alt="Lulyssia" 
          className={`w-36 h-36 md:w-44 md:h-44 object-contain transition-all duration-500 ${showEmoji ? 'animate-bounce' : 'opacity-80'}`}
        />
      </div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 flex flex-wrap items-center justify-center gap-2 min-h-[2.5em]">
        <span className="bg-gradient-to-r from-welcome-primary to-welcome-secondary bg-clip-text text-transparent">
          {displayedText}
          {showCursor && (
            <span className="inline-block w-[3px] h-[1em] bg-welcome-primary ml-1 animate-pulse align-middle" />
          )}
        </span>
        <span className={`transition-opacity duration-300 ${showEmoji ? 'opacity-100' : 'opacity-0'}`}>
          {greeting.emoji}
        </span>
      </h1>
      <div className={`w-24 h-1 bg-gradient-to-r from-welcome-primary to-welcome-secondary mx-auto rounded-full transition-transform duration-300 ${showEmoji ? 'scale-100' : 'scale-0'}`} />
    </div>
  );
};
