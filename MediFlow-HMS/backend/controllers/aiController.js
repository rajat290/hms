import { GoogleGenerativeAI } from '@google/generative-ai';
import doctorModel from '../models/doctorModel.js';
import {
  buildFallbackAssistantResponse,
  buildSymptomGuidance,
  cleanChatHistory,
  getChatGuardrailResponse,
  normalizeInput,
} from '../utils/aiGuidance.js';
import { generateAvailableSlots } from '../utils/slotGenerator.js';

const parseScheduleDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const formatScheduleDate = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (hours * 60) + minutes;
};

const pickSuggestedSlot = (slots = []) => {
  if (slots.length === 0) {
    return null;
  }

  const targetMinutes = 11 * 60;

  return [...slots].sort((left, right) => {
    const leftDistance = Math.abs(toMinutes(left.time) - targetMinutes);
    const rightDistance = Math.abs(toMinutes(right.time) - targetMinutes);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return toMinutes(left.time) - toMinutes(right.time);
  })[0];
};

const buildScheduleRationale = ({ requestedDateMatched, suggestedTime }) => {
  const minutes = toMinutes(suggestedTime);

  if (!requestedDateMatched) {
    return 'The requested date was full or unavailable, so the assistant found the next open clinic session.';
  }

  if (minutes >= 10 * 60 && minutes <= 12 * 60) {
    return 'This slot is close to mid-morning, which is often a steady time for check-in and consultation flow.';
  }

  if (minutes < 10 * 60) {
    return 'This is one of the earlier open slots, which can help you get seen sooner on the selected day.';
  }

  return 'This was one of the most balanced remaining openings on the selected day.';
};

const buildScheduleResponse = ({
  doctor,
  requestDate,
  suggestionDate,
  slots,
  requestedDateMatched,
}) => {
  const suggestedSlot = pickSuggestedSlot(slots);

  if (!suggestedSlot) {
    return null;
  }

  const alternativeTimes = slots
    .map((slot) => slot.time)
    .filter((time) => time !== suggestedSlot.time)
    .slice(0, 3);

  const message = requestedDateMatched
    ? `Suggested ${suggestedSlot.time} on ${formatScheduleDate(suggestionDate)} for ${doctor.name}.`
    : `No open slots on ${formatScheduleDate(requestDate)}. Next available is ${suggestedSlot.time} on ${formatScheduleDate(suggestionDate)} for ${doctor.name}.`;

  return {
    status: requestedDateMatched ? 'requested-date' : 'next-available',
    doctorId: doctor._id,
    doctorName: doctor.name,
    speciality: doctor.speciality,
    requestedDate: requestDate.toISOString().slice(0, 10),
    date: suggestionDate.toISOString().slice(0, 10),
    displayDate: formatScheduleDate(suggestionDate),
    suggestedTime: suggestedSlot.time,
    alternativeTimes,
    availableSlotCount: slots.length,
    rationale: buildScheduleRationale({ requestedDateMatched, suggestedTime: suggestedSlot.time }),
    note: 'Availability can change until the appointment is booked.',
    message,
  };
};

const conversationalAI = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const safeMessage = normalizeInput(message).slice(0, 1200);

    const guardrailResponse = getChatGuardrailResponse(safeMessage);
    if (guardrailResponse) {
      return res.json({ success: true, ...guardrailResponse });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length < 10) {
      return res.json({
        success: true,
        ...buildFallbackAssistantResponse(safeMessage),
      });
    }

    const geminiModel = (process.env.GEMINI_MODEL || 'gemini-3-flash-preview').trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: geminiModel,
      systemInstruction:
        "You are MediFlow's healthcare navigation assistant. Provide concise plain-text answers only. " +
        'You may help with appointment booking, doctor discovery, visit preparation, billing navigation, and general non-diagnostic symptom guidance. ' +
        'Never diagnose, prescribe, give medication doses, confirm emergencies are safe, or discourage urgent care. ' +
        'If symptoms sound urgent, clearly direct the user to in-person urgent or emergency care.',
    });

    const chat = model.startChat({
      history: cleanChatHistory(chatHistory),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.3,
      },
    });

    const result = await chat.sendMessage(safeMessage);
    const response = await result.response;
    const text = response.text().trim();

    return res.json({
      success: true,
      message: text || buildFallbackAssistantResponse(safeMessage).message,
      guardrailCategory: 'model_response',
      requiresUrgentCare: false,
    });
  } catch (error) {
    console.error('Gemini AI Error:', error.message || error);

    return res.json({
      success: true,
      ...buildFallbackAssistantResponse(req.body?.message),
    });
  }
};

const getSymptomSuggestions = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const results = buildSymptomGuidance(symptoms);

    res.json({ success: true, results });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const smartSchedule = async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    const requestedDate = parseScheduleDate(date);

    if (!requestedDate) {
      return res.json({ success: false, message: 'Please choose a valid appointment date.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.json({ success: false, message: 'Please choose today or a future date.' });
    }

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: 'Doctor not found.' });
    }

    if (doctor.available === false || doctor.availability?.enabled === false) {
      return res.json({
        success: true,
        suggestion: null,
        message: `${doctor.name} is not accepting AI-assisted schedule suggestions right now. Please review the doctor profile for updated availability.`,
      });
    }

    const requestedDateSlots = generateAvailableSlots(doctor, requestedDate);
    if (requestedDateSlots.length > 0) {
      const suggestion = buildScheduleResponse({
        doctor,
        requestDate: requestedDate,
        suggestionDate: requestedDate,
        slots: requestedDateSlots,
        requestedDateMatched: true,
      });

      return res.json({
        success: true,
        suggestedTime: suggestion.suggestedTime,
        suggestion,
        message: suggestion.message,
      });
    }

    const lookAheadDays = 7;
    for (let offset = 1; offset <= lookAheadDays; offset += 1) {
      const nextDate = new Date(requestedDate);
      nextDate.setDate(requestedDate.getDate() + offset);

      const nextDateSlots = generateAvailableSlots(doctor, nextDate);
      if (nextDateSlots.length === 0) {
        continue;
      }

      const suggestion = buildScheduleResponse({
        doctor,
        requestDate: requestedDate,
        suggestionDate: nextDate,
        slots: nextDateSlots,
        requestedDateMatched: false,
      });

      return res.json({
        success: true,
        suggestedTime: suggestion.suggestedTime,
        suggestion,
        message: suggestion.message,
      });
    }

    return res.json({
      success: true,
      suggestion: null,
      message: `No open slots were found for ${doctor.name} on ${formatScheduleDate(requestedDate)} or in the following ${lookAheadDays} days.`,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { conversationalAI, getSymptomSuggestions, smartSchedule };
