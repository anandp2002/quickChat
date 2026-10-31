import * as friendService from '../services/friendService.js';

const handleError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  return res.status(error.status || 500).json({
    error: error.status ? error.message : fallbackMessage,
  });
};

export const discover = async (req, res) => {
  try {
    const friends = await friendService.listDiscoverableUsers({
      uid: req.user.uid,
      search: req.query.search,
      limit: req.query.limit,
    });
    return res.json({ friends });
  } catch (error) {
    return handleError(res, error, 'Failed to discover users.');
  }
};

export const listFriends = async (req, res) => {
  try {
    const friends = await friendService.listRelationships(req.user.uid, 'accepted');
    return res.json({ friends });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch friends.');
  }
};

export const listRequests = async (req, res) => {
  try {
    const requests = await friendService.listRelationships(req.user.uid, 'pending');
    return res.json({ requests });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch friend requests.');
  }
};

export const createRequest = async (req, res) => {
  try {
    const request = await friendService.sendRequest(req.user.uid, req.params.userId);
    return res.status(201).json({ request });
  } catch (error) {
    return handleError(res, error, 'Failed to send friend request.');
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const request = await friendService.updateRequest(
      req.user.uid,
      req.params.userId,
      req.body.action,
    );
    return res.json({ request });
  } catch (error) {
    return handleError(res, error, 'Failed to update friend request.');
  }
};

export const deleteFriend = async (req, res) => {
  try {
    await friendService.removeFriend(req.user.uid, req.params.userId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, 'Failed to remove friend.');
  }
};
