// Lumi's lines. Short, kind, a little silly, suitable for all ages.
const QUIPS = {
  start: [
    'Let’s light this up!',
    'I believe in you. Also in mirrors.',
    'Gems are waiting. They’re very patient. Mostly.',
    'Ready? I was born ready. Literally, I’m light.',
    'Tap mirrors. Bend beams. Be brilliant.',
    'This one looks shiny!',
  ],
  boss: ['Uh-oh. It’s a BOSS level!', 'Big glare incoming. You got this!', 'Boss time! I’m hiding behind you.'],
  disco: ['DISCO LEVEL! Everybody dance!', 'Funky photons ahead!', 'Ooh, party lights!'],
  night: ['It’s night mode. Spooky… but glowy.', 'Shh, the gems are sleeping. Wake them up!'],
  gem: ['Shiny!', 'Ooooh!', 'Ding!', 'Nice bend!', 'Gem-tastic!', 'That one blushed.', 'Sparkle get!'],
  crack: ['Crrrack! That mirror is stuck now.', 'Oops, it cracked! Plan around it… or restart.', 'Crack! It won’t turn anymore.'],
  shade: ['Eek! Keep that one dark!', 'Too spooky, turn it back!', 'The shadow crystal hates light. Rude, but true.'],
  lastMove: ['Last move! No pressure. (A little pressure.)', 'Final move… choose wisely!', 'One left. I’m holding my breath. I don’t breathe.'],
  win3: ['PERFECT! Three stars!', 'Flawless! The gems are applauding.', 'You’re basically a laser wizard.', 'Brilliant! I’m glowing with pride.'],
  win2: ['Great job! Try for three?', 'So close to perfect!', 'Nice! Two shiny stars.'],
  win1: ['Solved! Every star counts.', 'Done! Now, can you do it in fewer moves?', 'Phew! We made it.'],
  outOfMoves: [
    'Out of moves! The photons went on strike.',
    'Oops! The beams got tangled.',
    'So close! Light takes practice.',
    'Out of moves. Even the sun has bad days.',
  ],
  idle: ['Psst… try tapping a mirror.', 'Stuck? A Hint could help!', 'I’m not bored. I’m just… glowing.', 'Hmm, think like a photon.'],
  streak: ['You’re on fire! 🔥', 'Unstoppable!', 'Streak power!', 'Hot hot hot!'],
};

/** A random line for an event. */
export function quipFor(event, random = Math.random) {
  const lines = QUIPS[event] ?? QUIPS.start;
  return lines[Math.floor(random() * lines.length)];
}
