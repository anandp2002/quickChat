import * as chatService from '../services/chatService.js';

const handleError = (res, error, fallback) => {
  console.error(fallback, error);
  return res.status(error.status || 500).json({
    error: error.status ? error.message : fallback,
  });
};

export const openConversation = async (req, res) => {
  try {
    const conversation = await chatService.openDirectConversation(
      req.user.uid,
      req.params.friendId,
    );
    return res.status(200).json({ conversation });
  } catch (error) {
    return handleError(res, error, 'Failed to open conversation.');
  }
};

export const listMessages = async (req, res) => {
  try {
    const messages = await chatService.getConversationMessages({
      conversationId: req.params.conversationId,
      uid: req.user.uid,
      limit: req.query.limit,
      before: req.query.before,
    });
    return res.json({ messages });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch messages.');
  }
};

export const markRead = async (req, res) => {
  try {
    await chatService.markConversationRead(
      req.params.conversationId,
      req.user.uid,
    );
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, 'Failed to mark conversation as read.');
  }
};
