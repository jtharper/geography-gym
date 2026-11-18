// Leaderboard names are always "<adjective> <animal>" from these lists (the site and the server share them),
// so the public board can't show anything a player typed.
export const ADJ = ["Swift", "Brave", "Clever", "Curious", "Daring", "Eager", "Gentle", "Happy", "Jolly", "Keen", "Lucky", "Mighty", "Nimble",
  "Plucky", "Quick", "Sunny", "Bold", "Bright", "Calm", "Cosmic", "Dashing", "Fearless", "Golden", "Hidden", "Merry", "Noble", "Polar",
  "Rapid", "Roaming", "Silver", "Snowy", "Speedy", "Steady", "Stormy", "Trusty", "Wandering", "Wild", "Wise", "Zesty", "Breezy"];
export const ANIMAL = ["Falcon", "Okapi", "Panda", "Koala", "Llama", "Otter", "Puffin", "Toucan", "Gecko", "Lynx", "Narwhal", "Penguin",
  "Kiwi", "Jaguar", "Bison", "Camel", "Dolphin", "Eagle", "Fennec", "Gazelle", "Hedgehog", "Ibex", "Kangaroo", "Lemur", "Meerkat",
  "Orca", "Pelican", "Quokka", "Raccoon", "Sloth", "Tapir", "Walrus", "Yak", "Zebra", "Alpaca", "Beaver", "Capybara", "Moose", "Owl", "Tiger"];
export const validName = n => { const [a, b, ...rest] = String(n || "").split(" "); return !rest.length && ADJ.includes(a) && ANIMAL.includes(b); };
