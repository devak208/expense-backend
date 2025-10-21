const { prisma } = require('../utils/database');

const syncUser = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const email = req.auth.email || `${clerkId}@clerk.dev`; // Fallback if no email
    const firstName = req.auth.firstName || '';
    const lastName = req.auth.lastName || '';

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName
        }
      });
    }

    // Attach user to req
    req.user = user;
    next();
  } catch (error) {
    console.error('Error syncing user:', error);
    next(error);
  }
};

module.exports = syncUser;