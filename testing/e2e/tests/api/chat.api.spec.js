import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { requestJson, uniqueEmail } from '../../utils/http.js';
import {
  createAdminUser,
  loginViaApi,
  signUpCustomer,
  updatePharmacistProfile,
} from '../../utils/session.js';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartpharma.com';
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin';

async function loginSuperAdmin() {
  return loginViaApi({
    baseUrl: backendUrl,
    identifier: superAdminEmail,
    password: superAdminPassword,
  });
}

async function bootstrapCustomer() {
  const email = uniqueEmail('chat-customer');
  const password = 'Password123!';

  await signUpCustomer({
    baseUrl: backendUrl,
    email,
    password,
    fullName: `CHAT Customer ${randomUUID().slice(0, 8)}`,
  });

  return loginViaApi({
    baseUrl: backendUrl,
    identifier: email,
    password,
  });
}

async function bootstrapPharmacist() {
  const adminLogin = await loginSuperAdmin();

  const pharmacistEmail = uniqueEmail('chat-pharmacist');
  const pharmacistPassword = 'Password123!';
  const pharmacist = await createAdminUser({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    user: {
      email: pharmacistEmail,
      fullName: 'CHAT Pharmacist',
      password: pharmacistPassword,
      roleName: 'PHARMACIST',
    },
  });

  await updatePharmacistProfile({
    baseUrl: backendUrl,
    token: adminLogin.accessToken,
    userId: pharmacist.id,
    profile: {
      qualifications: 'Licensed pharmacist',
      education: 'Pharmacy University',
      experience: '3 years',
      specialtyCode: 'GENERAL_MEDICINE',
      isApproved: true,
    },
  });

  return loginViaApi({
    baseUrl: backendUrl,
    identifier: pharmacistEmail,
    password: pharmacistPassword,
  }).then((session) => ({
    ...session,
    fullName: pharmacist.fullName,
  }));
}

async function createChatRoomAsCustomer(customerLogin, type = 'PHARMACIST', consultationId) {
  const res = await requestJson({
    baseUrl: backendUrl,
    path: '/chat/rooms',
    method: 'POST',
    token: customerLogin.accessToken,
    body: {
      type,
      participantIds: [customerLogin.user.id],
      consultationId,
    },
  });

  expect(res.ok, JSON.stringify(res.rawBody, null, 2)).toBeTruthy();
  return res.body;
}

async function getRoomById(token, roomId) {
  const rooms = await requestJson({
    baseUrl: backendUrl,
    path: '/chat/rooms/me',
    token,
  });

  expect(rooms.ok, JSON.stringify(rooms.rawBody, null, 2)).toBeTruthy();
  expect(Array.isArray(rooms.body)).toBeTruthy();

  return rooms.body.find((room) => room.id === roomId) || null;
}

async function waitForRoomTitleChange(token, roomId, initialTitle = 'AI Chatbot', timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastRoom = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastRoom = await getRoomById(token, roomId);
    if (lastRoom?.title && lastRoom.title !== initialTitle) {
      return lastRoom;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Timed out waiting for room ${roomId} title to change from ${initialTitle}. Last room: ${JSON.stringify(lastRoom, null, 2)}`,
  );
}

test.describe('Chat / Pharmacist / AI API E2E', () => {
  test('CHAT-01 Customer tạo session chat thành công', async () => {
    const customerLogin = await bootstrapCustomer();
    const room = await createChatRoomAsCustomer(customerLogin, 'PHARMACIST');

    expect(room).toMatchObject({
      type: 'PHARMACIST',
      status: 'WAITING',
      customerId: customerLogin.user.id,
    });
    expect(room.id).toBeTruthy();
    expect(room.participantIds).toContain(customerLogin.user.id);

    const rooms = await requestJson({
      baseUrl: backendUrl,
      path: '/chat/rooms/me',
      token: customerLogin.accessToken,
    });
    expect(rooms.ok).toBeTruthy();
    expect(rooms.body.some((item) => item.id === room.id)).toBeTruthy();
  });

  test('CHAT-02 Pharmacist thấy session được assign/available', async () => {
    const customerLogin = await bootstrapCustomer();
    const room = await createChatRoomAsCustomer(customerLogin, 'PHARMACIST');
    const pharmacistLogin = await bootstrapPharmacist();

    const activeRooms = await requestJson({
      baseUrl: backendUrl,
      path: '/pharmacists/chat/rooms/active',
      token: pharmacistLogin.accessToken,
    });
    expect(activeRooms.ok).toBeTruthy();
    expect(activeRooms.body.some((item) => item.id === room.id)).toBeTruthy();

    const joinedRoom = await requestJson({
      baseUrl: backendUrl,
      path: `/pharmacists/chat/rooms/${room.id}/join`,
      method: 'POST',
      token: pharmacistLogin.accessToken,
    });

    expect(joinedRoom.ok, JSON.stringify(joinedRoom.rawBody, null, 2)).toBeTruthy();
    expect(joinedRoom.body).toMatchObject({
      id: room.id,
      status: 'ACTIVE',
      pharmacistName: pharmacistLogin.fullName,
    });
  });

  test('CHAT-04 Unauthorized không vào được chat API', async () => {
    const noTokenRooms = await requestJson({
      baseUrl: backendUrl,
      path: '/chat/rooms/me',
    });
    expect(noTokenRooms.status).toBe(401);

    const customerLogin = await bootstrapCustomer();
    const forbiddenRooms = await requestJson({
      baseUrl: backendUrl,
      path: '/pharmacists/chat/rooms/active',
      token: customerLogin.accessToken,
    });
    expect(forbiddenRooms.status).toBe(403);
  });

  test('CHAT-05 AI chat trả response hợp lệ', async () => {
    const customerLogin = await bootstrapCustomer();
    const aiRoom = await createChatRoomAsCustomer(customerLogin, 'AI');
    const prompt = `CHAT-05 ai check ${randomUUID().slice(0, 8)}`;

    const reply = await requestJson({
      baseUrl: backendUrl,
      path: '/chat/ai',
      method: 'POST',
      token: customerLogin.accessToken,
      body: {
        conversationId: aiRoom.id,
        message: prompt,
      },
    });

    expect(reply.ok, JSON.stringify(reply.rawBody, null, 2)).toBeTruthy();
    expect(reply.body).toMatchObject({
      chatRoomId: aiRoom.id,
      senderType: 'AI',
      type: 'TEXT',
      status: 'SENT',
    });
    expect(reply.body.content).toBeTruthy();
  });

  test('CHAT-06 Chat metadata/title-summary được cập nhật sau async job', async () => {
    const customerLogin = await bootstrapCustomer();
    const aiRoom = await createChatRoomAsCustomer(customerLogin, 'AI');
    const prompt = `CHAT-06 metadata ${randomUUID().slice(0, 8)}`;

    const reply = await requestJson({
      baseUrl: backendUrl,
      path: '/chat/ai',
      method: 'POST',
      token: customerLogin.accessToken,
      body: {
        conversationId: aiRoom.id,
        message: prompt,
      },
    });

    expect(reply.ok, JSON.stringify(reply.rawBody, null, 2)).toBeTruthy();

    const updatedRoom = await waitForRoomTitleChange(customerLogin.accessToken, aiRoom.id);
    expect(updatedRoom).toBeTruthy();
    expect(updatedRoom.title).not.toBe('AI Chatbot');
    expect(updatedRoom.lastMessage).toBeTruthy();
    expect(updatedRoom.lastMessage.content).toBe(reply.body.content);
  });
});
