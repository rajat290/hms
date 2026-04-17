const EMERGENCY_RULES = [
  {
    label: 'Chest pain or pressure',
    patterns: ['chest pain', 'pressure in chest', 'tightness in chest', 'crushing chest pain'],
    careAreas: ['Emergency medicine', 'Cardiology'],
  },
  {
    label: 'Trouble breathing',
    patterns: ['shortness of breath', 'difficulty breathing', 'trouble breathing', 'cannot breathe', "can't breathe", 'breathlessness'],
    careAreas: ['Emergency medicine', 'Pulmonology'],
  },
  {
    label: 'Stroke warning signs',
    patterns: ['face drooping', 'slurred speech', 'one sided weakness', 'one-sided weakness', 'numb arm', 'numb face', 'sudden confusion'],
    careAreas: ['Emergency medicine', 'Neurology'],
  },
  {
    label: 'Loss of consciousness or seizure',
    patterns: ['passed out', 'fainted', 'loss of consciousness', 'seizure', 'convulsion'],
    careAreas: ['Emergency medicine', 'Neurology'],
  },
  {
    label: 'Severe bleeding',
    patterns: ['heavy bleeding', 'severe bleeding', 'bleeding heavily', 'coughing blood', 'vomiting blood'],
    careAreas: ['Emergency medicine'],
  },
];

const SAME_DAY_RULES = [
  {
    label: 'High fever',
    patterns: ['high fever', 'fever 103', 'fever 104', 'very high fever', 'persistent fever'],
    careAreas: ['General medicine'],
  },
  {
    label: 'Persistent vomiting or dehydration',
    patterns: ['vomiting all day', 'cannot keep fluids down', "can't keep fluids down", 'dehydrated', 'severe diarrhea'],
    careAreas: ['General medicine', 'Gastroenterology'],
  },
  {
    label: 'Severe abdominal pain',
    patterns: ['severe abdominal pain', 'sharp abdominal pain', 'worsening abdominal pain', 'stomach pain getting worse'],
    careAreas: ['General medicine', 'Gastroenterology'],
  },
  {
    label: 'Worsening infection symptoms',
    patterns: ['fever and cough', 'fever with cough', 'painful urination', 'infected wound', 'swelling getting worse'],
    careAreas: ['General medicine'],
  },
  {
    label: 'Significant dizziness or weakness',
    patterns: ['severe dizziness', 'too weak to stand', 'nearly fainting', 'lightheaded all day'],
    careAreas: ['General medicine'],
  },
];

const CARE_AREA_RULES = [
  {
    label: 'Fever',
    patterns: ['fever', 'chills', 'temperature'],
    careAreas: ['General medicine'],
  },
  {
    label: 'Headache',
    patterns: ['headache', 'migraine'],
    careAreas: ['General medicine', 'Neurology'],
  },
  {
    label: 'Cough or cold symptoms',
    patterns: ['cough', 'sore throat', 'runny nose', 'congestion'],
    careAreas: ['General medicine', 'ENT'],
  },
  {
    label: 'Breathing symptoms',
    patterns: ['wheezing', 'breath', 'breathing'],
    careAreas: ['General medicine', 'Pulmonology'],
  },
  {
    label: 'Digestive symptoms',
    patterns: ['abdominal pain', 'stomach pain', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
    careAreas: ['General medicine', 'Gastroenterology'],
  },
  {
    label: 'Skin symptoms',
    patterns: ['rash', 'itching', 'skin', 'hives'],
    careAreas: ['General medicine', 'Dermatology'],
  },
  {
    label: 'Joint or muscle pain',
    patterns: ['joint pain', 'muscle pain', 'body ache', 'back pain'],
    careAreas: ['General medicine', 'Orthopedics'],
  },
  {
    label: 'Mental health concerns',
    patterns: ['anxious', 'anxiety', 'panic', 'depressed', 'not sleeping', 'insomnia'],
    careAreas: ['Mental health', 'General medicine'],
  },
];

const SELF_HARM_PATTERNS = [
  'kill myself',
  'end my life',
  'suicide',
  'want to die',
  'hurt myself',
  'harm myself',
  'self harm',
  'self-harm',
];

const DIAGNOSIS_PATTERNS = [
  'diagnose me',
  'what disease do i have',
  'what condition do i have',
  'do i have',
  'am i having',
  'is this cancer',
  'is this a heart attack',
  'is this pneumonia',
];

const MEDICATION_PATTERNS = [
  'what medicine',
  'what medication',
  'which antibiotic',
  'should i take',
  'prescribe',
  'dosage',
  'dose should i take',
  'can i start',
  'can i stop',
];

const PLATFORM_PATTERNS = [
  'appointment',
  'book',
  'schedule',
  'reschedule',
  'cancel',
  'doctor',
  'specialist',
  'clinic',
  'payment',
  'invoice',
  'billing',
  'insurance',
  'profile',
  'login',
  'account',
];

const NON_MEDICAL_PATTERNS = [
  'write code',
  'debug',
  'weather',
  'stock price',
  'crypto',
  'movie recommendation',
  'tell me a joke',
];

const uniq = (values) => [...new Set(values.filter(Boolean))];

const normalizeInput = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ').trim();
  }

  return typeof value === 'string' ? value.trim() : '';
};

const includesAny = (text, patterns = []) => patterns.some((pattern) => text.includes(pattern));

const matchRules = (text, rules = []) =>
  rules.filter((rule) => includesAny(text, rule.patterns));

const formatList = (items = []) => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const buildUrgency = (level) => {
  if (level === 'emergency') {
    return {
      level,
      title: 'Get urgent care now',
      description: 'Some of the symptoms entered can need emergency evaluation and should not wait for online advice.',
    };
  }

  if (level === 'same-day') {
    return {
      level,
      title: 'Arrange same-day medical review',
      description: 'These symptoms deserve prompt clinician review, especially if they are worsening or affecting hydration, breathing, or daily activity.',
    };
  }

  return {
    level: 'routine',
    title: 'Monitor closely and book routine care if needed',
    description: 'This tool can only offer general next-step guidance. Mild symptoms may be monitored, but ongoing or worsening symptoms still need clinician review.',
  };
};

const buildSelfCareTips = ({ level, careAreas }) => {
  if (level === 'emergency') {
    return [
      'Avoid strenuous activity while you arrange urgent care.',
      'Keep a list of current medicines, allergies, and medical conditions ready for the clinician.',
    ];
  }

  const tips = ['Rest, hydrate, and note when the symptoms started and how they change.'];

  if (careAreas.includes('Pulmonology') || careAreas.includes('ENT')) {
    tips.push('Avoid smoke, dust, and strenuous activity while symptoms are active.');
  }

  if (careAreas.includes('Gastroenterology')) {
    tips.push('Take small sips of fluids regularly so dehydration does not build up.');
  }

  if (careAreas.includes('Dermatology')) {
    tips.push('Avoid starting new creams or over-the-counter medicines unless a clinician has advised them.');
  }

  if (careAreas.includes('Orthopedics')) {
    tips.push('Reduce heavy lifting or high-impact movement until you are assessed.');
  }

  return uniq(tips).slice(0, 3);
};

const buildNextSteps = ({ level, emergencySignals }) => {
  if (level === 'emergency') {
    return [
      'Seek emergency care immediately or call local emergency services.',
      'Do not wait for a chat reply or routine appointment if symptoms are severe or worsening.',
      `Tell the clinician about ${formatList(emergencySignals).toLowerCase()} as soon as you arrive.`,
    ];
  }

  if (level === 'same-day') {
    return [
      'Book urgent clinic care or a same-day doctor review.',
      'Move to emergency care sooner if breathing becomes difficult, pain becomes severe, or you cannot keep fluids down.',
      'Bring temperature readings, medicine names, and relevant medical history to the visit.',
    ];
  }

  return [
    'Track symptoms over the next 24 to 48 hours.',
    'Book a clinic visit if the symptoms persist, worsen, or start affecting breathing, hydration, sleep, or daily activity.',
    'Use the doctor directory or smart scheduler to find the right department if you are unsure where to start.',
  ];
};

const buildQuestionsForClinician = ({ careAreas, detectedSymptoms }) => [
  'When did the symptoms start, and are they getting worse or staying the same?',
  `Which department is the best starting point: ${careAreas[0] || 'General medicine'}?`,
  `Should I mention ${formatList(detectedSymptoms).toLowerCase() || 'these symptoms'} when I book?`,
];

const buildSymptomGuidance = (input) => {
  const rawText = normalizeInput(input);
  const text = rawText.toLowerCase();

  const emergencyMatches = matchRules(text, EMERGENCY_RULES);
  const sameDayMatches = matchRules(text, SAME_DAY_RULES);
  const careMatches = matchRules(text, CARE_AREA_RULES);

  const emergencySignals = uniq(emergencyMatches.map((rule) => rule.label));
  const urgentSignals = uniq([
    ...emergencySignals,
    ...sameDayMatches.map((rule) => rule.label),
  ]);

  const detectedSymptoms = uniq([
    ...careMatches.map((rule) => rule.label),
    ...sameDayMatches.map((rule) => rule.label),
    ...emergencyMatches.map((rule) => rule.label),
  ]);

  const careAreas = uniq([
    ...emergencyMatches.flatMap((rule) => rule.careAreas),
    ...sameDayMatches.flatMap((rule) => rule.careAreas),
    ...careMatches.flatMap((rule) => rule.careAreas),
  ]);

  const level = emergencySignals.length > 0 ? 'emergency' : urgentSignals.length > 0 ? 'same-day' : 'routine';
  const urgency = buildUrgency(level);
  const normalizedCareAreas = careAreas.length > 0 ? careAreas : ['General medicine'];

  const summary =
    level === 'emergency'
      ? 'The symptoms entered include red flags that can need immediate in-person assessment. This tool cannot tell what is causing them.'
      : level === 'same-day'
        ? 'The symptoms entered sound important enough for prompt clinician review today. This tool cannot diagnose the cause.'
        : 'The symptoms entered may be suitable for monitoring and a routine doctor review if they continue, but this tool cannot diagnose the cause.';

  const nextSteps = buildNextSteps({ level, emergencySignals: emergencySignals.length > 0 ? emergencySignals : detectedSymptoms });
  const selfCare = buildSelfCareTips({ level, careAreas: normalizedCareAreas });
  const questionsForClinician = buildQuestionsForClinician({
    careAreas: normalizedCareAreas,
    detectedSymptoms: detectedSymptoms.length > 0 ? detectedSymptoms : ['your symptoms'],
  });

  return {
    summary,
    urgency,
    detectedSymptoms,
    careAreas: normalizedCareAreas,
    nextSteps,
    selfCare,
    urgentSignals,
    questionsForClinician,
    disclaimer: 'This symptom guide does not diagnose illness or replace licensed medical care.',
    conditions: normalizedCareAreas,
    recommendations: nextSteps,
  };
};

const getChatGuardrailResponse = (message) => {
  const rawText = normalizeInput(message);
  const text = rawText.toLowerCase();

  if (!text) {
    return {
      message: 'I can help with booking, finding the right department, visit preparation, and general symptom next steps.',
      guardrailCategory: 'general_guidance',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, SELF_HARM_PATTERNS)) {
    return {
      message: 'This sounds urgent. Please contact local emergency services or a crisis hotline in your area right now, and stay with a trusted person if possible. I am not able to safely handle self-harm crises in chat.',
      guardrailCategory: 'crisis_support',
      requiresUrgentCare: true,
    };
  }

  if (matchRules(text, EMERGENCY_RULES).length > 0) {
    return {
      message: 'The symptoms you mentioned can need emergency care. Please seek urgent medical attention now or call local emergency services instead of relying on chat.',
      guardrailCategory: 'medical_emergency',
      requiresUrgentCare: true,
    };
  }

  if (includesAny(text, MEDICATION_PATTERNS)) {
    return {
      message: 'I cannot prescribe medicines, tell you what dose to take, or advise you to start or stop prescription treatment. Please contact a licensed clinician or pharmacist for medication advice.',
      guardrailCategory: 'medication_boundary',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, DIAGNOSIS_PATTERNS)) {
    return {
      message: 'I cannot diagnose conditions or confirm whether you have a specific disease. I can help summarize symptoms, suggest the right care area, or guide you to book a clinician review.',
      guardrailCategory: 'diagnosis_boundary',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, NON_MEDICAL_PATTERNS) && !includesAny(text, PLATFORM_PATTERNS)) {
    return {
      message: 'I am focused on MediFlow care guidance, appointments, doctor discovery, billing, and visit preparation. Ask me about symptoms, specialties, bookings, or clinic workflow.',
      guardrailCategory: 'scope_boundary',
      requiresUrgentCare: false,
    };
  }

  return null;
};

const buildFallbackAssistantResponse = (message) => {
  const rawText = normalizeInput(message);
  const text = rawText.toLowerCase();

  if (includesAny(text, ['book', 'appointment', 'schedule'])) {
    return {
      message: 'To book an appointment, open the Doctors page, choose a specialist, select a slot, and continue to payment. If you tell me the symptom area, I can suggest the right department to start with.',
      guardrailCategory: 'booking_help',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, ['reschedule', 'cancel'])) {
    return {
      message: 'Open My Appointments to reschedule or cancel a booking. If fees or refund timing are unclear, the billing section or admin desk can confirm the policy for that appointment.',
      guardrailCategory: 'appointment_management',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, ['doctor', 'specialist', 'which department'])) {
    return {
      message: 'You can start with General medicine for unclear symptoms, or choose a specialist such as Cardiology, Pulmonology, Gastroenterology, Dermatology, or Orthopedics based on the main symptom pattern.',
      guardrailCategory: 'doctor_discovery',
      requiresUrgentCare: false,
    };
  }

  if (includesAny(text, ['payment', 'billing', 'invoice', 'insurance'])) {
    return {
      message: 'For payment or insurance questions, check the booking summary, My Billing, or ask the clinic team to confirm accepted payment methods and coverage details before the visit.',
      guardrailCategory: 'billing_help',
      requiresUrgentCare: false,
    };
  }

  const symptomGuidance = buildSymptomGuidance(rawText);
  const supportsSymptomGuidance =
    symptomGuidance.detectedSymptoms.length > 0 ||
    includesAny(text, ['pain', 'fever', 'cough', 'breathing', 'rash', 'vomiting', 'dizzy', 'fatigue', 'headache']);

  if (supportsSymptomGuidance) {
    return {
      message:
        `${symptomGuidance.urgency.title}. ${symptomGuidance.summary} ` +
        `Best next step: ${symptomGuidance.nextSteps[0]} ` +
        `A good starting department may be ${formatList(symptomGuidance.careAreas)}.`,
      guardrailCategory: 'symptom_guidance',
      requiresUrgentCare: symptomGuidance.urgency.level === 'emergency',
    };
  }

  return {
    message: 'I can help with booking, visit preparation, care navigation, and general symptom next-step guidance. I cannot diagnose conditions or prescribe treatment.',
    guardrailCategory: 'general_guidance',
    requiresUrgentCare: false,
  };
};

const cleanChatHistory = (chatHistory = []) => {
  if (!Array.isArray(chatHistory)) {
    return [];
  }

  const history = chatHistory
    .filter((item) => (item.role === 'user' || item.role === 'model') && item.parts?.[0]?.text)
    .map((item) => ({
      role: item.role,
      parts: [{ text: String(item.parts[0].text).trim().slice(0, 1200) }],
    }))
    .filter((item) => item.parts[0].text);

  const startIndex = history.findIndex((item) => item.role === 'user');
  const normalizedHistory = startIndex > 0 ? history.slice(startIndex) : history;

  return normalizedHistory.slice(-8);
};

export {
  buildFallbackAssistantResponse,
  buildSymptomGuidance,
  cleanChatHistory,
  getChatGuardrailResponse,
  normalizeInput,
};
