function createFallingEmoji() {
    const emojis = ['❤️', '💖', '💘', '💕', '💞', '💓', '💗', '😍'];
    const emoji = document.createElement('div');
    emoji.classList.add('falling-emoji');
    emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = Math.random() * 100 + 'vw'; // Random horizontal position
    emoji.style.animationDuration = (Math.random() * 3 + 2) + 's'; // Random speed for fall
    document.body.appendChild(emoji);
}