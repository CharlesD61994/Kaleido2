let activeUserId = "";

export const setActiveCloudUserId = (userId = "") => {
  activeUserId = String(userId || "");
};

export const getActiveCloudUserId = () => activeUserId;

export const hasActiveCloudUser = () => Boolean(activeUserId);
