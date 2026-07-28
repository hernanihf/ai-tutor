export interface EmojiEntry {
  emoji: string
  name: string
  keywords: string[]
}

export const EMOJIS: EmojiEntry[] = [
  // Faces
  { emoji: '😀', name: 'grinning', keywords: ['smile', 'happy', 'grin'] },
  { emoji: '😂', name: 'joy', keywords: ['lol', 'laugh', 'tears', 'funny'] },
  { emoji: '🤣', name: 'rofl', keywords: ['laugh', 'floor', 'rolling'] },
  { emoji: '😊', name: 'blush', keywords: ['smile', 'happy', 'cute'] },
  { emoji: '😍', name: 'heart_eyes', keywords: ['love', 'crush', 'amazing'] },
  { emoji: '🥰', name: 'smiling_face_with_hearts', keywords: ['love', 'hearts', 'cute'] },
  { emoji: '😎', name: 'sunglasses', keywords: ['cool', 'awesome', 'shades'] },
  { emoji: '🤔', name: 'thinking', keywords: ['hmm', 'thought', 'wonder'] },
  { emoji: '😅', name: 'sweat_smile', keywords: ['nervous', 'awkward', 'phew'] },
  { emoji: '😭', name: 'sob', keywords: ['cry', 'sad', 'tears', 'weep'] },
  { emoji: '😢', name: 'cry', keywords: ['sad', 'tear', 'unhappy'] },
  { emoji: '😤', name: 'triumph', keywords: ['angry', 'mad', 'frustrated'] },
  { emoji: '😠', name: 'angry', keywords: ['mad', 'furious', 'rage'] },
  { emoji: '🤯', name: 'exploding_head', keywords: ['mindblown', 'wow', 'shocked'] },
  { emoji: '😱', name: 'scream', keywords: ['scared', 'shocked', 'horror', 'fear'] },
  { emoji: '😴', name: 'sleeping', keywords: ['sleep', 'tired', 'bored', 'zzz'] },
  { emoji: '🥺', name: 'pleading', keywords: ['puppy', 'please', 'cute', 'sad'] },
  { emoji: '😇', name: 'innocent', keywords: ['angel', 'good', 'halo'] },
  { emoji: '🥳', name: 'partying', keywords: ['party', 'celebrate', 'birthday'] },
  { emoji: '😬', name: 'grimacing', keywords: ['awkward', 'nervous', 'yikes'] },
  { emoji: '🙄', name: 'roll_eyes', keywords: ['eyeroll', 'whatever', 'sigh'] },
  { emoji: '😒', name: 'unamused', keywords: ['meh', 'boring', 'unimpressed'] },
  { emoji: '🤗', name: 'hugs', keywords: ['hug', 'warm', 'embrace'] },
  { emoji: '🫡', name: 'saluting', keywords: ['salute', 'respect', 'sir'] },
  { emoji: '😏', name: 'smirk', keywords: ['sly', 'smug', 'flirt'] },
  { emoji: '🤩', name: 'star_struck', keywords: ['wow', 'amazing', 'star', 'excited'] },
  { emoji: '🥴', name: 'woozy', keywords: ['drunk', 'dizzy', 'confused'] },
  { emoji: '😵', name: 'dizzy_face', keywords: ['dizzy', 'confused', 'dead'] },
  { emoji: '🤐', name: 'zipper_mouth', keywords: ['quiet', 'secret', 'shh', 'silence'] },
  { emoji: '🫠', name: 'melting', keywords: ['melt', 'nervous', 'hot'] },

  // Hands & gestures
  { emoji: '👍', name: 'thumbsup', keywords: ['+1', 'ok', 'good', 'approve', 'like'] },
  { emoji: '👎', name: 'thumbsdown', keywords: ['-1', 'bad', 'no', 'dislike'] },
  { emoji: '👋', name: 'wave', keywords: ['hello', 'hi', 'bye', 'hand'] },
  { emoji: '🙏', name: 'pray', keywords: ['thanks', 'please', 'namaste', 'hope'] },
  { emoji: '👏', name: 'clap', keywords: ['applause', 'bravo', 'well done'] },
  { emoji: '🤝', name: 'handshake', keywords: ['deal', 'agree', 'shake'] },
  { emoji: '✌️', name: 'v', keywords: ['peace', 'victory', 'two'] },
  { emoji: '🤞', name: 'crossed_fingers', keywords: ['luck', 'hope', 'fingers'] },
  { emoji: '👌', name: 'ok_hand', keywords: ['ok', 'perfect', 'nice'] },
  { emoji: '💪', name: 'muscle', keywords: ['strong', 'flex', 'power', 'gym'] },
  { emoji: '🤌', name: 'pinched_fingers', keywords: ['italian', 'perfect', 'chef'] },
  { emoji: '🫶', name: 'heart_hands', keywords: ['love', 'heart', 'hands'] },
  { emoji: '🖐️', name: 'raised_hand', keywords: ['stop', 'five', 'high'] },
  { emoji: '🤙', name: 'call_me', keywords: ['hang loose', 'shaka', 'call'] },
  { emoji: '👀', name: 'eyes', keywords: ['look', 'see', 'watching', 'stare'] },
  { emoji: '🫦', name: 'biting_lip', keywords: ['nervous', 'flirt', 'lip'] },

  // Hearts & love
  { emoji: '❤️', name: 'heart', keywords: ['love', 'red', 'like'] },
  { emoji: '🧡', name: 'orange_heart', keywords: ['love', 'orange'] },
  { emoji: '💛', name: 'yellow_heart', keywords: ['love', 'yellow', 'friendship'] },
  { emoji: '💚', name: 'green_heart', keywords: ['love', 'green', 'nature'] },
  { emoji: '💙', name: 'blue_heart', keywords: ['love', 'blue', 'cool'] },
  { emoji: '💜', name: 'purple_heart', keywords: ['love', 'purple'] },
  { emoji: '🖤', name: 'black_heart', keywords: ['love', 'dark', 'gothic'] },
  { emoji: '💔', name: 'broken_heart', keywords: ['sad', 'breakup', 'heartbreak'] },
  { emoji: '💕', name: 'two_hearts', keywords: ['love', 'hearts', 'cute'] },
  { emoji: '💯', name: '100', keywords: ['perfect', 'score', 'hundred', 'yes'] },

  // Symbols & reactions
  { emoji: '🔥', name: 'fire', keywords: ['hot', 'lit', 'flame', 'bomb'] },
  { emoji: '✨', name: 'sparkles', keywords: ['stars', 'magic', 'shine', 'new'] },
  { emoji: '⭐', name: 'star', keywords: ['rating', 'favorite', 'good'] },
  { emoji: '🌟', name: 'star2', keywords: ['bright', 'shine', 'gold'] },
  { emoji: '💫', name: 'dizzy', keywords: ['spinning', 'star', 'wow'] },
  { emoji: '⚡', name: 'zap', keywords: ['lightning', 'fast', 'electric', 'power'] },
  { emoji: '✅', name: 'white_check_mark', keywords: ['done', 'ok', 'yes', 'complete'] },
  { emoji: '❌', name: 'x', keywords: ['no', 'wrong', 'cross', 'error'] },
  { emoji: '⚠️', name: 'warning', keywords: ['alert', 'caution', 'careful'] },
  { emoji: '🚫', name: 'no_entry', keywords: ['no', 'stop', 'forbidden'] },
  { emoji: '❓', name: 'question', keywords: ['ask', 'huh', 'what'] },
  { emoji: '❗', name: 'exclamation', keywords: ['important', 'red', 'alert'] },
  { emoji: '💬', name: 'speech_balloon', keywords: ['chat', 'comment', 'message'] },
  { emoji: '💭', name: 'thought_balloon', keywords: ['thinking', 'thought', 'idea'] },

  // Celebration & fun
  { emoji: '🎉', name: 'tada', keywords: ['party', 'celebrate', 'congrats', 'yay'] },
  { emoji: '🎊', name: 'confetti', keywords: ['party', 'celebrate', 'fun'] },
  { emoji: '🎈', name: 'balloon', keywords: ['party', 'birthday', 'celebration'] },
  { emoji: '🎁', name: 'gift', keywords: ['present', 'birthday', 'surprise'] },
  { emoji: '🏆', name: 'trophy', keywords: ['win', 'champion', 'first', 'award'] },
  { emoji: '🥇', name: 'first_place', keywords: ['gold', 'win', 'first', 'medal'] },
  { emoji: '🎯', name: 'dart', keywords: ['target', 'aim', 'hit', 'goal'] },
  { emoji: '🎮', name: 'video_game', keywords: ['game', 'controller', 'gaming', 'play'] },

  // Tech & work
  { emoji: '💻', name: 'laptop', keywords: ['computer', 'work', 'code', 'mac'] },
  { emoji: '📱', name: 'iphone', keywords: ['phone', 'mobile', 'cell'] },
  { emoji: '💡', name: 'bulb', keywords: ['idea', 'light', 'tip', 'insight'] },
  { emoji: '🔑', name: 'key', keywords: ['lock', 'access', 'security', 'password'] },
  { emoji: '🔒', name: 'lock', keywords: ['secure', 'private', 'locked'] },
  { emoji: '📝', name: 'pencil', keywords: ['write', 'note', 'edit', 'memo'] },
  { emoji: '📌', name: 'pushpin', keywords: ['pin', 'note', 'mark', 'important'] },
  { emoji: '📎', name: 'paperclip', keywords: ['attach', 'file', 'link'] },
  { emoji: '🔍', name: 'mag', keywords: ['search', 'find', 'zoom', 'look'] },
  { emoji: '🛠️', name: 'hammer_and_wrench', keywords: ['tools', 'fix', 'build', 'dev'] },
  { emoji: '🐛', name: 'bug', keywords: ['error', 'debug', 'issue', 'problem'] },
  { emoji: '🚀', name: 'rocket', keywords: ['launch', 'fast', 'deploy', 'go'] },
  { emoji: '📊', name: 'bar_chart', keywords: ['chart', 'graph', 'data', 'stats'] },
  { emoji: '🗂️', name: 'card_index', keywords: ['organize', 'files', 'folder'] },
  { emoji: '⌨️', name: 'keyboard', keywords: ['type', 'code', 'input'] },

  // Food & drink
  { emoji: '🍺', name: 'beer', keywords: ['drink', 'alcohol', 'cheers', 'cold'] },
  { emoji: '🍻', name: 'beers', keywords: ['cheers', 'toast', 'drink', 'party'] },
  { emoji: '🥂', name: 'champagne_glass', keywords: ['celebrate', 'toast', 'cheers', 'wine'] },
  { emoji: '☕', name: 'coffee', keywords: ['morning', 'hot', 'cafe', 'espresso'] },
  { emoji: '🍕', name: 'pizza', keywords: ['food', 'italian', 'slice'] },
  { emoji: '🍔', name: 'hamburger', keywords: ['burger', 'food', 'lunch'] },
  { emoji: '🎂', name: 'birthday', keywords: ['cake', 'celebration', 'party', 'birth'] },
  { emoji: '🍰', name: 'cake', keywords: ['dessert', 'sweet', 'slice'] },
  { emoji: '🍜', name: 'ramen', keywords: ['noodles', 'soup', 'food', 'asian'] },
  { emoji: '🌮', name: 'taco', keywords: ['food', 'mexican', 'lunch'] },

  // Nature & weather
  { emoji: '🌈', name: 'rainbow', keywords: ['colors', 'pride', 'hope', 'colorful'] },
  { emoji: '🌙', name: 'crescent_moon', keywords: ['night', 'moon', 'sleep', 'dark'] },
  { emoji: '☀️', name: 'sunny', keywords: ['sun', 'hot', 'day', 'bright'] },
  { emoji: '🌊', name: 'ocean', keywords: ['wave', 'water', 'sea', 'surf'] },
  { emoji: '❄️', name: 'snowflake', keywords: ['cold', 'winter', 'snow', 'ice', 'freeze'] },
  { emoji: '🌸', name: 'cherry_blossom', keywords: ['flower', 'spring', 'pink', 'japan'] },
  { emoji: '🌺', name: 'hibiscus', keywords: ['flower', 'tropical', 'plant'] },
  { emoji: '🍀', name: 'four_leaf_clover', keywords: ['luck', 'lucky', 'clover', 'fortune'] },

  // Animals
  { emoji: '🐶', name: 'dog', keywords: ['puppy', 'pet', 'woof', 'animal'] },
  { emoji: '🐱', name: 'cat', keywords: ['kitty', 'pet', 'meow', 'animal'] },
  { emoji: '🦊', name: 'fox', keywords: ['fox', 'animal', 'cute'] },
  { emoji: '🐸', name: 'frog', keywords: ['kermit', 'green', 'ribbit'] },
  { emoji: '🦁', name: 'lion', keywords: ['king', 'roar', 'strong', 'animal'] },
  { emoji: '🐙', name: 'octopus', keywords: ['tentacles', 'sea', 'smart'] },
  { emoji: '🦋', name: 'butterfly', keywords: ['beautiful', 'transform', 'nature'] },
  { emoji: '🐢', name: 'turtle', keywords: ['slow', 'shell', 'patience'] },
  { emoji: '🦄', name: 'unicorn', keywords: ['magic', 'rare', 'mythical'] },

  // Travel & places
  { emoji: '🗺️', name: 'world_map', keywords: ['map', 'travel', 'geography'] },
  { emoji: '🏖️', name: 'beach', keywords: ['vacation', 'summer', 'sand', 'sun'] },
  { emoji: '🏔️', name: 'mountain_snow', keywords: ['mountain', 'peak', 'snow', 'hike'] },
  { emoji: '🌍', name: 'earth_africa', keywords: ['world', 'global', 'earth', 'globe'] },
  { emoji: '🏠', name: 'house', keywords: ['home', 'house', 'building'] },
  { emoji: '✈️', name: 'airplane', keywords: ['flight', 'travel', 'plane', 'trip'] },
]

export function searchEmojis(query: string, limit = 8): EmojiEntry[] {
  if (!query) return EMOJIS.slice(0, limit)
  const q = query.toLowerCase()
  const exact: EmojiEntry[] = []
  const starts: EmojiEntry[] = []
  const contains: EmojiEntry[] = []

  for (const entry of EMOJIS) {
    if (entry.name === q) { exact.push(entry); continue }
    if (entry.name.startsWith(q) || entry.keywords.some((k) => k.startsWith(q))) {
      starts.push(entry); continue
    }
    if (entry.name.includes(q) || entry.keywords.some((k) => k.includes(q))) {
      contains.push(entry)
    }
  }

  return [...exact, ...starts, ...contains].slice(0, limit)
}
