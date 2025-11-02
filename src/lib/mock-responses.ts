// Mock LLM responses generator
const responseTemplates = {
  greetings: [
    "Hello! I'm your AI assistant. How can I help you today?",
    "Hi there! What can I assist you with?",
    "Welcome! I'm here to help. What's on your mind?",
  ],
  questions: [
    "That's a great question! Based on my understanding, ",
    "I'd be happy to help with that. Let me think about it...",
    "Interesting question! Here's what I think about it: ",
  ],
  help: [
    "I can definitely help you with that! Here's what you need to know: ",
    "Of course! Let me explain how to do that: ",
    "I'd be glad to assist! Here's the information you need: ",
  ],
  thanks: [
    "You're welcome! I'm glad I could help.",
    "Happy to assist! Is there anything else I can help with?",
    "My pleasure! Don't hesitate to ask if you need anything else.",
  ],
  bye: [
    "Goodbye! It was great chatting with you.",
    "See you later! Feel free to come back anytime.",
    "Have a great day! Looking forward to our next conversation.",
  ],
  default: [
    "I understand. Let me help you with that.",
    "That's a good point. Here's my perspective on it: ",
    "I can help with that. Based on what you've told me, ",
  ],
};

const contextualResponses = {
  // Keywords and their associated responses
  weather: [
    "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for the most accurate forecast!",
    "For weather information, please check a reliable weather service. I'd be happy to help with other questions though!",
  ],
  time: [
    `The current time is ${new Date().toLocaleTimeString()}. Is there anything else I can help you with?`,
    `It's ${new Date().toLocaleTimeString()} right now. What would you like to know?`,
  ],
  code: [
    "I'd be happy to help with coding! Could you provide more details about what you're trying to build?",
    "Sure! What programming language or technology are you working with?",
    "I can definitely help with code. What specific issue are you facing?",
  ],
  ai: [
    "Artificial Intelligence is a fascinating field! AI systems are designed to simulate human intelligence.",
    "AI has many applications today, from natural language processing to computer vision and robotics.",
    "I'm an AI assistant myself! I use machine learning to understand and respond to your messages.",
  ],
  name: [
    "My name is Assistant, and I'm here to help you with your questions and tasks.",
    "You can call me Assistant! I'm your AI companion ready to assist.",
    "I'm an AI assistant, though I don't have a personal name. Just call me Assistant!",
  ],
};

function getRandomElement<T>(array: T[]): T | undefined {
  return array.length > 0 ? array[Math.floor(Math.random() * array.length)] : undefined;
}

function getResponseForMessage(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  // Check for contextual responses first
  for (const [keyword, responses] of Object.entries(contextualResponses)) {
    if (lowerMessage.includes(keyword)) {
      return getRandomElement(responses) || "I'm here to help!";
    }
  }

  // Check for common patterns
  if (lowerMessage.match(/^(hi|hello|hey|greetings?)/)) {
    return getRandomElement(responseTemplates.greetings) ?? "Hello!";
  }

  if (lowerMessage.match(/\?$/)) {
    return getRandomElement(responseTemplates.questions) ?? "That's an interesting question!";
  }

  if (lowerMessage.match(/^(help|can you|could you)/)) {
    return getRandomElement(responseTemplates.help) ?? "I'd be happy to help you with that!";
  }

  if (lowerMessage.match(/^(thank|thanks|thx)/)) {
    return getRandomElement(responseTemplates.thanks) ?? "You're welcome!";
  }

  if (lowerMessage.match(/^(bye|goodbye|see ya|later)/)) {
    return getRandomElement(responseTemplates.bye) ?? "Goodbye! Have a great day!";
  }

  // Generate a contextual response based on message length and content
  const words = lowerMessage.split(' ').filter(w => w.length > 0);

  if (words.length === 1) {
    // For single word queries, ask for clarification
    return `I see you mentioned "${words[0]}". Could you tell me more about what you'd like to know?`;
  }

  if (words.length < 5) {
    // For short messages, use default responses
    const response = getRandomElement(responseTemplates.default);
    return (response ?? "I understand.") + `${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`;
  }

  // For longer messages, respond based on content
  if (lowerMessage.includes('because') || lowerMessage.includes('why')) {
    return "That's an interesting point about the reasoning behind it. Let me share my thoughts on why that might be the case.";
  }

  if (lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return "Here's how that works: Based on my understanding, this process involves several key steps that work together to achieve the desired outcome.";
  }

  // Default response for longer messages
  const defaultResponses = [
    "That's a comprehensive message! Let me break this down for you: ",
    "I understand what you're saying. Here's my analysis: ",
    "This is quite detailed. From what you've described, ",
    "Thanks for sharing that with me. Based on your message, ",
  ];

  return getRandomElement(defaultResponses) + "the key aspects seem to revolve around the main points you've highlighted. Is there a specific part you'd like me to elaborate on?";
}

export function generateMockResponse(userMessage: string): {
  content: string;
  delay: number;
} {
  // Simulate thinking time based on message length
  const baseDelay = 500;
  const lengthDelay = Math.min(userMessage.length * 10, 2000);
  const randomDelay = Math.random() * 500;
  const totalDelay = baseDelay + lengthDelay + randomDelay;

  return {
    content: getResponseForMessage(userMessage),
    delay: totalDelay,
  };
}