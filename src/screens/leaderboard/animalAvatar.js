/** Nicknames end in an animal ("Sunny Otter 42"); each animal gets a friendly avatar. */
const ANIMALS = {
  Otter: '🦦',
  Fox: '🦊',
  Panda: '🐼',
  Robin: '🐦',
  Koala: '🐨',
  Finch: '🐤',
  Hedgehog: '🦔',
  Lynx: '🐱',
  Puffin: '🐧',
  Badger: '🦡',
  Wren: '🐥',
  Seal: '🦭',
};

export function animalAvatar(nickname = '') {
  const animal = nickname.split(' ').find((word) => word in ANIMALS);
  return ANIMALS[animal] ?? '✨';
}
