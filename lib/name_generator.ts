function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const adjectives = [
  "Grumpy",
  "Sleepy",
  "Jittery",
  "Pale",
  "Robust",
  "Chatty",
  "Grouchy",
  "Snarky",
  "Hyper",
  "Moody",
  "Frazzled",
  "Peppy",
  "Sassy",
  "Nervous",
  "Cheerful",
  "Fidgety",
  "Stoic",
  "Quirky",
  "Giddy",
  "Lanky",
  "Clumsy",
  "Awkward",
  "Perky",
  "Goofy",
  "Chilly",
  "Nimble",
  "Witty",
  "Zippy",
  "Bouncy",
  "Rowdy",
  "Shaky",
  "Loopy",
  "Fat",
  "Lazy",
  "Idiot",
  "Lord",
  "Prickly",
  "Cranky",
  "Jolly",
  "Tipsy",
  "Flaky",
  "Nerdy",
  "Weird",
  "Boisterous",
  "Spunky",
  "Gawky",
  "Plucky",
  "Brisk",
  "Sneezy",
  "Tense",
  "Graceful",
  "Bulky",
  "Twitchy",
  "Bashful",
  "Dopey",
  "Skittish",
  "Fussy",
  "Huffy",
  "Pouty",
  "Drowsy",
  "Blunt",
  "Zany",
  "Hasty",
  "Frosty",
  "Jaunty",
  "Mellow",
  "Puffy",
  "Snappy",
  "Wacky",
  "Speedy",
  "Meek",
  "Bold",
  "Crisp",
  "Breezy",
  "Loud",
  "Reserved",
  "Carefree",
  "Stealthy",
  "Sprightly",
  "Suave",
  "Proud",
  "Stern",
  "Whimsical",
  "Chipper",
  "Dapper",
  "Ebullient",
  "Fiery",
  "Gutsy",
  "Hearty",
  "Lively",
  "Mirthful",
  "Spritely",
  "Saucy",
  "Sharp",
  "Shrewd",
  "Spiffy",
  "Stout",
  "Tart",
  "Vibrant",
  "Zesty",
  "Annoying",
  "Obese",
  "Stinky",
  "Angry",
];

export const medicalRoles = [
  "Paramedic",
  "Nurse",
  "Surgeon",
  "Radiologist",
  "Technician",
  "Anesthetist",
  "Phlebotomist",
  "Neurologist",
  "Pediatrician",
  "Orthopedist",
  "Dermatologist",
  "Cardiologist",
  "Chiropractor",
  "Pathologist",
  "Psychiatrist",
  "Urologist",
  "Proctologist",
  "Optometrist",
  "Therapist",
  "Pharmacist",
  "Oncologist",
];

export function generateName(): string {
  const adj = getRandomElement(adjectives);
  const role = getRandomElement(medicalRoles);
  const randomNumber = getRandomNumber(10000, 99999); // Generates a 5-digit number
  return `${adj}${role}${randomNumber}`;
}
