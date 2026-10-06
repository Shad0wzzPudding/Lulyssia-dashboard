import { useState, useEffect, useRef } from 'react';
import lulyssiaExcited from '@/assets/lulyssia-excited.png';
import lulyssiaHappy from '@/assets/lulyssia-happy.png';
import lulyssiaWinking from '@/assets/lulyssia-winking.png';
import lulyssiaCandy from '@/assets/lulyssia-candy.png';
import lulyssiaProud from '@/assets/lulyssia-proud.png';
import lulyssiaWelcoming from '@/assets/lulyssia-welcoming.png';
import lulyssiaConfident from '@/assets/lulyssia-confident.png';
import lulyssiaTg04 from '@/assets/lulyssia-tg-04.webp';
import lulyssiaTg05 from '@/assets/lulyssia-tg-05.webp';
import lulyssiaTg06 from '@/assets/lulyssia-tg-06.webp';
import lulyssiaTg07 from '@/assets/lulyssia-tg-07.webp';
import lulyssiaTg10 from '@/assets/lulyssia-tg-10.webp';
import lulyssiaTg11 from '@/assets/lulyssia-tg-11.webp';
import lulyssiaTg12 from '@/assets/lulyssia-tg-12.webp';
import lulyssiaTg13 from '@/assets/lulyssia-tg-13.webp';

const lulyssiaGreetings = [
  { text: "Heyyy Shad0wzz! How's your day going today??", emoji: "😊", sticker: lulyssiaWelcoming },
  { text: "Welcome back! Ready for another adventure?", emoji: "📸✨", sticker: lulyssiaExcited },
  { text: "Ooh, perfect timing! I was just organizing some photos!", emoji: "📷", sticker: lulyssiaCandy },
  { text: "Hi there! Got any exciting plans for today?", emoji: "🌟", sticker: lulyssiaWelcoming },
  { text: "Yay, you're here! Let's make today super productive!", emoji: "💫", sticker: lulyssiaHappy },
  { text: "Hello hello! Ready to tackle your tasks like a true Trailblazer?", emoji: "🚀", sticker: lulyssiaProud },
  { text: "Heya! Time to check what's on your agenda!", emoji: "📝", sticker: lulyssiaWinking },
  { text: "Welcome! I've been waiting to show you all your updates!", emoji: "✨", sticker: lulyssiaConfident },
  { text: "Make a wish! Today feels like a celebration!", emoji: "🎂", sticker: lulyssiaTg04 },
  { text: "Mmm, snack break! Want to share?", emoji: "🍫", sticker: lulyssiaTg05 },
  { text: "Hmph! Don't keep me waiting too long, okay?", emoji: "💢", sticker: lulyssiaTg06 },
  { text: "Pretty please? Let's get something done together!", emoji: "🥺", sticker: lulyssiaTg07 },
  { text: "Ehehe, you caught me! Let's get back to it!", emoji: "😅", sticker: lulyssiaTg10 },
  { text: "Vacation mode? Or just dreaming about it?", emoji: "🌴", sticker: lulyssiaTg11 },
  { text: "Waaah, that was scary! Glad you're here now!", emoji: "😭", sticker: lulyssiaTg12 },
  { text: "Staring contest? Fine, I won't blink first!", emoji: "👀", sticker: lulyssiaTg13 },
];

export const WelcomeMessage = () => {
  const [greeting] = useState(() => {
    const randomIndex = Math.floor(Math.random() * lulyssiaGreetings.length);
    return lulyssiaGreetings[randomIndex];
  });
  const [displayedText, setDisplayedText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typingComplete = useRef(false);

  useEffect(() => {
    if (typingComplete.current) return;
    
    let currentIndex = 0;
    const typingSpeed = 40; // ms per character

    const typingInterval = setInterval(() => {
      if (currentIndex < greeting.text.length) {
        setDisplayedText(greeting.text.slice(0, currentIndex + 1));
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
  }, [greeting.text]);

  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center mb-4">
        <img 
          src={greeting.sticker} 
          alt="Lulyssia" 
          className={`w-24 h-24 object-contain transition-all duration-500 ${showEmoji ? 'animate-bounce' : 'opacity-80'}`}
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
