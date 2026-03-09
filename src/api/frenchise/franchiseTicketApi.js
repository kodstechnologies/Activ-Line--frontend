import api from "../axios";

/* ===============================
GET FRANCHISE CHAT ROOMS
=============================== */

export const getTicketRooms = async (page = 1, limit = 20) => {

  const res = await api.get(
    `/api/chat/franchise/rooms?page=${page}&limit=${limit}`
  );

  return res.data;

};


/* ===============================
GET ROOM MESSAGES
=============================== */

export const getRoomMessages = async (roomId) => {

  const res = await api.get(
    `/api/chat/franchise/rooms/${roomId}/messages`
  );

  return res.data;

};


/* ===============================
SEND MESSAGE
=============================== */

export const sendTicketMessage = async (payload) => {

  const res = await api.post(
    "/api/chat/upload",
    payload
  );

  return res.data;

};


/* ===============================
UPDATE ROOM STATUS
=============================== */

export const updateTicketStatus = async (roomId, status) => {

  const res = await api.patch(
    `/api/chat/franchise/rooms/${roomId}/status`,
    { status }
  );

  return res.data;

};


/* ===============================
GET FRANCHISE ADMINS
=============================== */

export const getFranchiseAdmins = async (page = 1, limit = 20, search = "") => {

  const res = await api.get(
    `/api/franchise/admin-credentials?page=${page}&limit=${limit}&search=${search}`
  );

  return res.data;

};


/* ===============================
ASSIGN ADMIN TO ROOM
=============================== */

export const assignAdminToRoom = async (roomId, franchiseAdminId) => {

  const res = await api.patch(
    `/api/chat/franchise/rooms/${roomId}/assign-admin`,
    { franchiseAdminId }
  );

  return res.data;

};